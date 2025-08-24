import { NextResponse } from 'next/server'
import { getAllVersionsOfCard } from '@/lib/mtg-api'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')

    if (!name) {
      return NextResponse.json(
        { error: 'Card name is required' },
        { status: 400 }
      )
    }

    const cards = await getAllVersionsOfCard(name)
    
    return NextResponse.json({
      cards,
      count: cards.length
    })
  } catch (error) {
    console.error('Card versions API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
