'use client'

import { formatPrice } from '@/lib/pricing-service'
import Image from 'next/image'
import { useState } from 'react'

export default function TopValuedCardsGrid({ cards, currency = 'usd', className = '' }) {
  if (!cards || cards.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-4">💰</div>
        <div>No valued cards found</div>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {cards.map((card, index) => (
        <TopValuedCard
          key={`${card.id || card.multiverseid}-${index}`}
          card={card}
          currency={currency}
          rank={index + 1}
        />
      ))}
    </div>
  )
}

function TopValuedCard({ card, currency, rank }) {
  const [imageError, setImageError] = useState(false)
  
  const getRankEmoji = (rank) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈' 
      case 3: return '🥉'
      default: return `#${rank}`
    }
  }

  const getRarityColor = (rarity) => {
    if (!rarity) return 'text-gray-500'
    
    switch (rarity.toLowerCase()) {
      case 'common': return 'text-gray-600'
      case 'uncommon': return 'text-gray-400'
      case 'rare': return 'text-yellow-500'
      case 'mythic rare': return 'text-orange-500'
      default: return 'text-gray-500'
    }
  }
  
  // Get the best image URL for the card
  const getCardImageUrl = (card) => {
    // First try the main image URL
    if (card.imageUrl) return card.imageUrl
    
    // Try image sources if available
    if (card.imageSources && card.imageSources.length > 0) {
      return card.imageSources[0]
    }
    
    // Fallback to Gatherer if we have multiverseid
    if (card.multiverseid) {
      return `https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${card.multiverseid}&type=card`
    }
    
    // Try to construct Scryfall URL if we have set and collector number
    if (card.set && card.number) {
      return `https://api.scryfall.com/cards/${card.set.toLowerCase()}/${card.number}?format=image`
    }
    
    return null
  }
  
  const imageUrl = getCardImageUrl(card)

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden group">
      {/* Rank Badge */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-2 relative">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">
            {getRankEmoji(rank)}
          </span>
          <div className="flex items-center gap-2">
            {card.foil && (
              <span className="text-xs bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full font-medium">
                ✨ Foil
              </span>
            )}
            <span className="text-xs opacity-90 font-medium">
              {card.quantity > 1 ? `${card.quantity}x` : '1x'}
            </span>
          </div>
        </div>
      </div>

      {/* Card Image */}
      <div className="relative aspect-[5/7] bg-gray-100">
        {imageUrl && !imageError ? (
          <Image
            src={imageUrl}
            alt={card.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-center text-gray-400">
              <div className="text-3xl mb-2">🃏</div>
              <div className="text-xs font-medium">No Image</div>
            </div>
          </div>
        )}
        
        {/* Total Value Overlay */}
        <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-lg text-sm font-bold shadow-md">
          {formatPrice(card.totalValue, currency)}
        </div>
      </div>

      <div className="p-4">
        {/* Card Info */}
        <div className="mb-3">
          <h3 className="font-bold text-gray-900 text-base mb-1 line-clamp-2" title={card.name}>
            {card.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
              {card.set}
            </span>
            <span className={`font-semibold text-xs ${getRarityColor(card.rarity)}`}>
              {card.rarity}
            </span>
          </div>
        </div>

        {/* Pricing Info */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Unit Price:</span>
            <span className="font-semibold text-green-600">
              {formatPrice(card.unitPrice, currency)}
            </span>
          </div>
          
          {card.quantity > 1 && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">× {card.quantity}:</span>
              <span className="font-bold text-green-700">
                {formatPrice(card.totalValue, currency)}
              </span>
            </div>
          )}
        </div>

        {/* Collection Info */}
        {card.condition && card.condition !== 'near_mint' && (
          <div className="mt-3 pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              Condition: <span className="capitalize">{card.condition.replace('_', ' ')}</span>
            </div>
          </div>
        )}

        {/* Purchase links if available */}
        {card.pricing?.purchase_uris && (
          <div className="mt-3 pt-2 border-t border-gray-100">
            <div className="flex gap-2">
              {card.pricing.purchase_uris.tcgplayer && (
                <a 
                  href={card.pricing.purchase_uris.tcgplayer}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Buy
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
