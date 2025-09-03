// Tesseract OCR Engine Implementation
import { createWorker } from 'tesseract.js'

/**
 * Tesseract OCR Engine
 * Pure JavaScript port of Tesseract OCR
 */
export class TesseractOCR {
  constructor() {
    this.worker = null
    this.initialized = false
  }

  /**
   * Initialize the Tesseract worker
   * @private
   */
  async _initializeWorker() {
    if (this.initialized && this.worker) {
      return this.worker
    }

    try {
      console.log('Initializing Tesseract OCR worker...')
      
      this.worker = await createWorker('eng', 1, {
        logger: m => {
          if (process.env.NODE_ENV === 'development') {
            console.log('Tesseract:', m)
          }
        }
      })

      // Set page segmentation mode for better text detection
      await this.worker.setParameters({
        tessedit_pageseg_mode: '6', // Uniform block of text
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 \'-,./:(){}',
      })

      this.initialized = true
      console.log('Tesseract OCR worker initialized successfully')
      return this.worker
    } catch (error) {
      console.error('Failed to initialize Tesseract OCR worker:', error)
      throw new Error(`Tesseract OCR initialization failed: ${error.message}`)
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
      // Ensure worker is initialized
      const worker = await this._initializeWorker()

      // Convert different input types to format supported by Tesseract.js
      let imageInput = imageData
      
      // Tesseract.js can handle Buffer, File, and other formats directly
      if (imageData instanceof ArrayBuffer) {
        imageInput = Buffer.from(imageData)
      } else if (imageData instanceof Uint8Array) {
        imageInput = Buffer.from(imageData)
      }

      console.log('Running Tesseract OCR recognition...')
      
      const startTime = Date.now()
      
      // Run OCR recognition
      const { data } = await worker.recognize(imageInput, {
        rectangle: options.rectangle, // Optional: specify region to OCR
      })

      const processingTime = Date.now() - startTime

      // Extract text and confidence
      const text = data.text || ''
      const confidence = data.confidence || 0

      console.log(`Tesseract OCR extracted ${text.length} characters with ${confidence.toFixed(2)}% confidence in ${processingTime}ms`)

      return {
        text: text.trim(),
        confidence: confidence / 100, // Convert from percentage to decimal
        words: data.words || [],
        lines: data.lines || [],
        paragraphs: data.paragraphs || [],
        engine: 'tesseract',
        processingTime
      }
    } catch (error) {
      console.error('Tesseract OCR recognition failed:', error)
      throw new Error(`OCR recognition failed: ${error.message}`)
    }
  }

  /**
   * Get engine version
   * @returns {string}
   */
  getVersion() {
    return 'tesseract.js-5.x'
  }

  /**
   * Check if worker is ready
   * @returns {boolean}
   */
  isReady() {
    return this.initialized && this.worker !== null
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.worker) {
      try {
        await this.worker.terminate()
        console.log('Tesseract OCR worker terminated')
      } catch (error) {
        console.warn('Error terminating Tesseract worker:', error.message)
      }
      this.worker = null
      this.initialized = false
    }
  }
}
