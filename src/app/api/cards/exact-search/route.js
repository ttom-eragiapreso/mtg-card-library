import { NextResponse } from 'next/server'
import { searchCardsByExactName } from '@/lib/mtg-api'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')

    if (!name) {
      return NextResponse.json(
        { error: 'Card name is required' },
        { status: 400 }
      )
    }

    const result = await searchCardsByExactName(name, page, pageSize)
    
    return NextResponse.json({
      cards: result.cards,
      totalCount: result.totalCount,
      currentPage: result.currentPage,
      pageSize: result.pageSize
    })
  } catch (error) {
    console.error('Card exact search API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
