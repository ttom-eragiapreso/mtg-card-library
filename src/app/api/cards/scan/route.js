import { NextResponse } from 'next/server'
import { ocrService } from '@/lib/ocr-service'
import { searchCardsByExactName, searchCardsByName } from '@/lib/mtg-api'

export async function POST(request) {
  try {
    console.log('Card scan request received')

    // Check if request has file data
    const formData = await request.formData()
    const imageFile = formData.get('image')

    if (!imageFile || !imageFile.size) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image.' },
        { status: 400 }
      )
    }

    // Validate file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { error: 'Image file too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    console.log(`Processing image: ${imageFile.name}, size: ${imageFile.size} bytes`)

    // Convert file to buffer for OCR processing
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract card name using OCR
    console.log('Starting OCR processing...')
    const ocrResult = await ocrService.extractCardName(buffer)
    
    console.log(`OCR Result:`, {
      cardName: ocrResult.cardName,
      confidence: ocrResult.confidence,
      engine: ocrResult.engine,
      processingTime: ocrResult.processingTime
    })

    // If no card name extracted, return OCR result for debugging
    if (!ocrResult.cardName || ocrResult.cardName.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Could not extract card name from image',
        debug: {
          allText: ocrResult.allText,
          confidence: ocrResult.confidence,
          engine: ocrResult.engine,
          processingTime: ocrResult.processingTime
        }
      })
    }

    // Search for cards using the extracted name
    console.log(`Searching for card: "${ocrResult.cardName}"`)
    
    let searchResults = []
    let searchMethod = 'none'

    try {
      // Try exact name search first
      console.log('Trying exact name search...')
      const exactResults = await searchCardsByExactName(ocrResult.cardName, 1, 20)
      if (exactResults.cards && exactResults.cards.length > 0) {
        searchResults = exactResults.cards
        searchMethod = 'exact'
        console.log(`Found ${searchResults.length} exact matches`)
      }
    } catch (exactError) {
      console.warn('Exact search failed:', exactError.message)
    }

    // If no exact matches, try fuzzy search
    if (searchResults.length === 0) {
      try {
        console.log('Trying fuzzy name search...')
        const fuzzyResults = await searchCardsByName(ocrResult.cardName, 1, 20)
        if (fuzzyResults.cards && fuzzyResults.cards.length > 0) {
          searchResults = fuzzyResults.cards
          searchMethod = 'fuzzy'
          console.log(`Found ${searchResults.length} fuzzy matches`)
        }
      } catch (fuzzyError) {
        console.warn('Fuzzy search failed:', fuzzyError.message)
      }
    }

    // Return results
    const response = {
      success: true,
      cardName: ocrResult.cardName,
      searchMethod,
      cards: searchResults,
      totalCards: searchResults.length,
      confidence: ocrResult.confidence,
      ocr: {
        engine: ocrResult.engine,
        processingTime: ocrResult.processingTime,
        allText: ocrResult.allText // For debugging
      }
    }

    console.log(`Scan complete: found ${searchResults.length} cards using ${searchMethod} search`)
    
    return NextResponse.json(response)

  } catch (error) {
    console.error('Card scan API error:', error)
    
    // Return different error messages based on error type
    let errorMessage = 'An error occurred while processing the image'
    let statusCode = 500

    if (error.message.includes('OCR processing failed')) {
      errorMessage = 'Failed to extract text from image. Please try a clearer photo.'
      statusCode = 400
    } else if (error.message.includes('Rate limit exceeded')) {
      errorMessage = 'Too many requests. Please wait a moment and try again.'
      statusCode = 429
    }

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: statusCode }
    )
  }
}

// GET endpoint for testing OCR service status
export async function GET() {
  try {
    const engineInfo = ocrService.getEngineInfo()
    
    return NextResponse.json({
      status: 'available',
      ocr: engineInfo,
      endpoints: {
        scan: 'POST /api/cards/scan',
        description: 'Upload image file as form data with key "image"'
      }
    })
  } catch (error) {
    console.error('OCR service status check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unavailable',
        error: error.message,
        ocr: null
      },
      { status: 500 }
    )
  }
}
