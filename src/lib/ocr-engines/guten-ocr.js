// Guten OCR Engine Implementation
import { loadModel, recognize } from '@gutenye/ocr-common'

/**
 * Guten OCR Engine
 * High accuracy OCR based on PaddleOCR and ONNX runtime
 */
export class GutenOCR {
  constructor() {
    this.modelLoaded = false
    this.model = null
  }

  /**
   * Initialize the OCR model
   * @private
   */
  async _initializeModel() {
    if (this.modelLoaded) {
      return this.model
    }

    try {
      console.log('Initializing Guten OCR model...')
      
      // Load the model (this might take a moment on first run)
      this.model = await loadModel('en') // English model
      this.modelLoaded = true
      
      console.log('Guten OCR model loaded successfully')
      return this.model
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
      const model = await this._initializeModel()

      // Convert different input types to appropriate format
      let processedImageData = imageData
      
      // Handle Buffer or ArrayBuffer
      if (imageData instanceof ArrayBuffer) {
        processedImageData = new Uint8Array(imageData)
      } else if (Buffer.isBuffer(imageData)) {
        processedImageData = new Uint8Array(imageData)
      } else if (imageData instanceof File) {
        // Convert File to ArrayBuffer
        const arrayBuffer = await imageData.arrayBuffer()
        processedImageData = new Uint8Array(arrayBuffer)
      }

      console.log('Running Guten OCR recognition...')
      
      // Run OCR recognition
      const result = await recognize(model, processedImageData, {
        // Guten OCR options
        lang: options.lang || 'en',
        threshold: options.threshold || 0.5,
        ...options
      })

      // Extract text and confidence from result
      let text = ''
      let totalConfidence = 0
      let wordCount = 0

      if (result && result.length > 0) {
        // Guten OCR returns array of text regions
        for (const region of result) {
          if (region.text) {
            text += region.text + '\n'
            if (region.confidence !== undefined) {
              totalConfidence += region.confidence
              wordCount++
            }
          }
        }
      }

      // Calculate average confidence
      const averageConfidence = wordCount > 0 ? totalConfidence / wordCount : 0

      // Clean up the text
      text = text.trim()

      console.log(`Guten OCR extracted ${text.length} characters with ${averageConfidence.toFixed(2)} confidence`)

      return {
        text,
        confidence: averageConfidence,
        regions: result, // Raw result for debugging
        engine: 'guten'
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
