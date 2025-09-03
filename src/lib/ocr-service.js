// OCR Service - Abstraction layer for different OCR engines
// This allows easy switching between OCR providers without changing the API

// import { GutenOCR } from './ocr-engines/guten-ocr.js' // Removed due to Sharp dependency issues
import { TesseractOCR } from './ocr-engines/tesseract-ocr.js'

// Configuration - easily change OCR engine here
// Using Tesseract as default (Guten OCR removed due to Sharp dependency issues)
const OCR_ENGINE = process.env.OCR_ENGINE || 'tesseract' // 'tesseract'

// OCR Engine registry
const engines = {
  // guten: GutenOCR, // Removed due to Sharp dependency issues
  tesseract: TesseractOCR,
}

// Get the configured OCR engine
const getOCREngine = () => {
  const Engine = engines[OCR_ENGINE]
  if (!Engine) {
    throw new Error(`OCR engine "${OCR_ENGINE}" not found. Available engines: ${Object.keys(engines).join(', ')}`)
  }
  return Engine
}

/**
 * OCR Service - Main interface for text extraction from images
 */
export class OCRService {
  constructor() {
    const Engine = getOCREngine()
    this.engine = new Engine()
  }

  /**
   * Extract text from image buffer or file
   * @param {Buffer|File} imageData - Image data to process
   * @param {Object} options - OCR options (engine-specific)
   * @returns {Promise<{text: string, confidence: number, engine: string}>}
   */
  async extractText(imageData, options = {}) {
    try {
      console.log(`Using OCR engine: ${OCR_ENGINE}`)
      
      const startTime = Date.now()
      const result = await this.engine.recognize(imageData, options)
      const processingTime = Date.now() - startTime
      
      console.log(`OCR processing completed in ${processingTime}ms`)
      
      return {
        text: result.text,
        confidence: result.confidence || 0,
        engine: OCR_ENGINE,
        processingTime,
        rawResult: result // For debugging
      }
    } catch (error) {
      console.error(`OCR engine ${OCR_ENGINE} failed:`, error)
      throw new Error(`OCR processing failed: ${error.message}`)
    }
  }

  /**
   * Extract and clean card name from OCR text
   * @param {Buffer|File} imageData - Image data to process
   * @returns {Promise<{cardName: string, allText: string, confidence: number}>}
   */
  async extractCardName(imageData) {
    const ocrResult = await this.extractText(imageData)
    const cardName = this.parseCardName(ocrResult.text)
    
    return {
      cardName,
      allText: ocrResult.text,
      confidence: ocrResult.confidence,
      engine: ocrResult.engine,
      processingTime: ocrResult.processingTime
    }
  }

  /**
   * Parse card name from raw OCR text
   * This logic is engine-agnostic
   * @param {string} text - Raw OCR text
   * @returns {string} - Cleaned card name
   */
  parseCardName(text) {
    if (!text || typeof text !== 'string') {
      return ''
    }

    console.log('Parsing card name from OCR text:', { originalText: text })

    // Clean up the text
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
    
    console.log('Text lines after cleanup:', lines)

    // MTG card name parsing logic
    for (let line of lines) {
      // Skip lines that look like mana costs (contain {})
      if (line.includes('{') && line.includes('}')) {
        continue
      }

      // Skip lines that are too short (likely not card names)
      if (line.length < 3) {
        continue
      }

      // Skip lines with only numbers or symbols
      if (/^[0-9\W]+$/.test(line)) {
        continue
      }

      // Skip lines that are mostly numbers (OCR errors)
      if (/\d/.test(line) && line.replace(/[^0-9]/g, '').length > line.replace(/[^a-zA-Z]/g, '').length) {
        continue
      }

      // Skip common non-name text patterns
      const skipPatterns = [
        /^\d+\/\d+$/, // Power/toughness like "2/2"
        /^creature/i, // Type line starting with "creature"
        /^instant/i, // Type line starting with "instant"
        /^sorcery/i, // Type line starting with "sorcery"
        /^enchantment/i, // Type line starting with "enchantment"
        /^artifact/i, // Type line starting with "artifact"
        /^planeswalker/i, // Type line starting with "planeswalker"
        /^land/i, // Type line starting with "land"
        /^legendary/i, // Type line starting with "legendary"
        /^basic/i, // Type line starting with "basic"
        /^\d+$/, // Just numbers (CMC)
        /^tap:/i, // Ability text starting with "tap:"
        /^add/i, // Ability text starting with "add"
        /^when/i, // Ability text starting with "when"
        /^if/i, // Ability text starting with "if"
        /^enter/i, // Ability text starting with "enter"
        /^destroy/i, // Ability text starting with "destroy"
        /^target/i, // Ability text starting with "target"
        /^you may/i, // Ability text starting with "you may"
      ]

      if (skipPatterns.some(pattern => pattern.test(line))) {
        continue
      }

      // Clean the line more aggressively
      let cardName = line
        .replace(/[{}]/g, '') // Remove mana symbols
        .replace(/\d/g, '') // Remove ALL numbers (MTG card names never have digits)
        .replace(/[^a-zA-Z\s,''-]/g, '') // Keep only letters, spaces, commas, apostrophes, hyphens
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '') // Remove leading/trailing non-letters
        .trim()

      // If we have a reasonable card name, return it
      if (cardName.length >= 3 && /[a-zA-Z]/.test(cardName)) {
        console.log('Found card name:', { originalLine: line, cleanedName: cardName })
        return cardName
      }
    }

    // Fallback: return the first non-empty line, aggressively cleaned
    if (lines.length > 0) {
      let fallback = lines[0]
        .replace(/[{}]/g, '') // Remove mana symbols
        .replace(/\d/g, '') // Remove ALL numbers
        .replace(/[^a-zA-Z\s,''-]/g, '') // Keep only letters, spaces, commas, apostrophes, hyphens
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '') // Remove leading/trailing non-letters
        .trim()
      
      if (fallback.length >= 3) {
        return fallback
      }
    }

    return ''
  }

  /**
   * Get OCR engine information
   * @returns {Object} Engine info
   */
  getEngineInfo() {
    return {
      name: OCR_ENGINE,
      engine: this.engine.constructor.name,
      version: this.engine.getVersion ? this.engine.getVersion() : 'unknown'
    }
  }
}

// Export singleton instance
export const ocrService = new OCRService()
