import { NextResponse } from 'next/server'
import { searchCardsByLanguage } from '@/lib/mtg-api'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    const language = searchParams.get('language') || 'English'
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')

    if (!name) {
      return NextResponse.json(
        { error: 'Card name is required' },
        { status: 400 }
      )
    }

    const result = await searchCardsByLanguage(name, language, page, pageSize)
    
    return NextResponse.json({
      cards: result.cards,
      totalCount: result.totalCount,
      currentPage: result.currentPage,
      pageSize: result.pageSize,
      language: language
    })
  } catch (error) {
    console.error('Language search API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
