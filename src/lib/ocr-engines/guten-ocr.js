// Guten OCR Engine Implementation
import Ocr from '@gutenye/ocr-node'
import { promises as fs } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { v4 as uuidv4 } from 'uuid'

/**
 * Guten OCR Engine
 * High accuracy OCR based on PaddleOCR and ONNX runtime
 */
export class GutenOCR {
  constructor() {
    this.modelLoaded = false
    this.ocr = null
  }

  /**
   * Initialize the OCR model
   * @private
   */
  async _initializeModel() {
    if (this.modelLoaded) {
      return this.ocr
    }

    try {
      console.log('Initializing Guten OCR model...')
      
      // Load the model (this might take a moment on first run)
      this.ocr = await Ocr.create({
        // Use default models for English
        isDebug: process.env.NODE_ENV === 'development'
      })
      
      this.modelLoaded = true
      
      console.log('Guten OCR model loaded successfully')
      return this.ocr
    } catch (error) {
      console.error('Failed to load Guten OCR model:', error)
      throw new Error(`Guten OCR initialization failed: ${error.message}`)
    }
  }

  /**
   * Recognize text from image data
   * @param {Buffer|File|ArrayBuffer} imageData - Image data to process
   * @param {Object} options - OCR options
   * @returns {Promise<{text: string, confidence: number}>}
   */
  async recognize(imageData, options = {}) {
    try {
      // Ensure model is loaded
      const ocr = await this._initializeModel()

      // Convert different input types to appropriate format for Node.js
      let imageInput = imageData
      let tempFilePath = null
      
      try {
        // For Node.js server-side processing
        if (typeof imageData === 'string') {
          // Assume it's a file path
          imageInput = imageData
        } else {
          // For Buffer/ArrayBuffer/File data, create a temporary file
          // This is often more reliable for OCR engines
          let buffer
          
          if (Buffer.isBuffer(imageData)) {
            buffer = imageData
          } else if (imageData instanceof ArrayBuffer || imageData instanceof Uint8Array) {
            buffer = Buffer.from(imageData)
          } else if (imageData instanceof File) {
            const arrayBuffer = await imageData.arrayBuffer()
            buffer = Buffer.from(arrayBuffer)
          } else {
            throw new Error('Unsupported image data type')
          }
          
          // Create temporary file
          const tempFileName = `ocr-${uuidv4()}.jpg`
          tempFilePath = join(tmpdir(), tempFileName)
          await fs.writeFile(tempFilePath, buffer)
          imageInput = tempFilePath
          
          console.log(`Created temporary file: ${tempFilePath}`)
        }

        console.log('Running Guten OCR detection...')
        
        // Run OCR detection
        const result = await ocr.detect(imageInput, options)

        // Extract text and confidence from result
        let text = ''
        let totalScore = 0
        let lineCount = 0

        if (result && result.length > 0) {
          // Guten OCR returns array of text lines
          for (const line of result) {
            if (line.text) {
              text += line.text + '\n'
              if (line.score !== undefined) {
                totalScore += line.score
                lineCount++
              }
            }
          }
        }

        // Calculate average confidence
        const averageConfidence = lineCount > 0 ? totalScore / lineCount : 0

        // Clean up the text
        text = text.trim()

        console.log(`Guten OCR extracted ${text.length} characters with ${averageConfidence.toFixed(2)} confidence`)

        return {
          text,
          confidence: averageConfidence,
          regions: result, // Raw result for debugging
          engine: 'guten'
        }
      } finally {
        // Clean up temporary file if created
        if (tempFilePath) {
          try {
            await fs.unlink(tempFilePath)
            console.log(`Cleaned up temporary file: ${tempFilePath}`)
          } catch (unlinkError) {
            console.warn(`Failed to clean up temporary file ${tempFilePath}:`, unlinkError.message)
          }
        }
      }
    } catch (error) {
      console.error('Guten OCR recognition failed:', error)
      throw new Error(`OCR recognition failed: ${error.message}`)
    }
  }

  /**
   * Get engine version
   * @returns {string}
   */
  getVersion() {
    return '1.4.x' // Guten OCR version
  }

  /**
   * Check if model is loaded
   * @returns {boolean}
   */
  isReady() {
    return this.modelLoaded
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.model) {
      // Clean up model resources if needed
      this.model = null
      this.modelLoaded = false
    }
  }
}
