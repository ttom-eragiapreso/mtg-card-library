import { NextResponse } from 'next/server'
import { searchCardsWithFilters } from '@/lib/mtg-api'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      name: searchParams.get('name'),
      colors: searchParams.get('colors')?.split(',').filter(Boolean),
      types: searchParams.get('types')?.split(',').filter(Boolean),
      subtypes: searchParams.get('subtypes')?.split(',').filter(Boolean),
      rarity: searchParams.get('rarity'),
      set: searchParams.get('set'),
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '50')
    }

    // Handle CMC range
    const minCmc = searchParams.get('minCmc')
    const maxCmc = searchParams.get('maxCmc')
    
    if (minCmc && maxCmc) {
      // For range queries, we'll need to handle this specially
      // The MTG API doesn't support range queries directly
      // We'll search without CMC first, then filter results
      filters.needsCmcFilter = { min: parseInt(minCmc), max: parseInt(maxCmc) }
    } else if (minCmc) {
      filters.cmc = parseInt(minCmc)
    } else if (maxCmc) {
      filters.cmc = parseInt(maxCmc)
    }

    const result = await searchCardsWithFilters(filters)
    
    // Apply CMC range filtering if needed
    let filteredCards = result.cards
    if (filters.needsCmcFilter) {
      const { min, max } = filters.needsCmcFilter
      filteredCards = result.cards.filter(card => {
        const cmc = card.cmc || 0
        return cmc >= min && cmc <= max
      })
    }
    
    return NextResponse.json({
      cards: filteredCards,
      totalCount: filteredCards.length,
      currentPage: result.currentPage,
      pageSize: result.pageSize
    })
  } catch (error) {
    console.error('Advanced search API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
