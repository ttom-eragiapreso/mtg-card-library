'use client'

import { useState } from 'react'
import ManaCost from './ManaCost'
import { PlusIcon, CheckIcon } from '@heroicons/react/24/outline'

export default function MTGCard({ 
  card, 
  variant = 'default', 
  showAddButton = true,
  onAddToCollection,
  isInCollection = false,
  className = ''
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleAddToCollection = async () => {
    if (!onAddToCollection || isInCollection || isAdding) return
    
    setIsAdding(true)
    try {
      await onAddToCollection(card)
    } catch (error) {
      console.error('Error adding to collection:', error)
    } finally {
      setIsAdding(false)
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

  const getImageUrl = () => {
    // Try different image sources
    if (card.imageUrl && !imageError) return card.imageUrl
    
    // Fallback to Gatherer images using multiverseid
    if (card.multiverseid && !imageError) {
      return `https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${card.multiverseid}&type=card`
    }
    
    return null
  }

  const imageUrl = getImageUrl()

  if (variant === 'compact') {
    return (
      <div className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 ${className}`}>
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg mb-2">{card.name}</h3>
              <div className="flex items-center gap-3 mb-2">
                <ManaCost manaCost={card.manaCost} size="xs" />
                {card.cmc !== undefined && (
                  <span className="text-sm font-medium text-gray-700">CMC: {card.cmc}</span>
                )}
              </div>
              <p className="text-gray-800 font-medium mb-3">
                {card.type}
              </p>
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-md">
                  {card.set}
                </span>
                <span className={`text-sm font-semibold ${getRarityColor(card.rarity)}`}>
                  {card.rarity}
                </span>
              </div>
            </div>
            {showAddButton && (
              <button
                className={`px-3 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center ${
                  isInCollection 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                } ${isAdding ? 'opacity-50' : ''}`}
                onClick={handleAddToCollection}
                disabled={isInCollection || isAdding}
              >
                {isAdding ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : isInCollection ? (
                  <CheckIcon className="w-4 h-4" />
                ) : (
                  <PlusIcon className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 ${className}`}>
      {imageUrl && (
        <div className="p-6 pb-4">
          <img
            src={imageUrl}
            alt={card.name}
            className="rounded-lg w-full max-w-xs mx-auto"
            onError={() => setImageError(true)}
            onLoad={() => setImageError(false)}
          />
        </div>
      )}
      
      <div className="px-6 pb-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{card.name}</h2>
          {showAddButton && (
            <button
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 ${
                isInCollection 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
              } ${isAdding ? 'opacity-50' : ''}`}
              onClick={handleAddToCollection}
              disabled={isInCollection || isAdding}
            >
              {isAdding ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : isInCollection ? (
                <>
                  <CheckIcon className="w-4 h-4" />
                  <span>In Collection</span>
                </>
              ) : (
                <>
                  <PlusIcon className="w-4 h-4" />
                  <span>Add to Collection</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 mb-3">
          <ManaCost manaCost={card.manaCost} />
          {card.cmc !== undefined && (
            <span className="text-sm font-medium text-gray-700">CMC: {card.cmc}</span>
          )}
        </div>

        <p className="font-bold text-gray-800 text-lg mb-3">{card.type}</p>

        {card.text && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-gray-800 whitespace-pre-line leading-relaxed">
              {card.text}
            </p>
          </div>
        )}

        {(card.power || card.toughness) && (
          <div className="mb-3">
            <span className="text-lg font-bold text-gray-900">
              {card.power}/{card.toughness}
            </span>
          </div>
        )}

        {card.loyalty && (
          <div className="mb-3">
            <span className="text-lg font-bold text-gray-900">Loyalty: {card.loyalty}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded-md">
              {card.set}
            </span>
            <span className={`text-sm font-semibold ${getRarityColor(card.rarity)}`}>
              {card.rarity}
            </span>
          </div>
          
          {card.artist && (
            <span className="text-sm text-gray-600">
              Art by {card.artist}
            </span>
          )}
        </div>

        {card.number && (
          <div className="text-sm text-gray-500 mt-3 pt-2 border-t border-gray-100">
            #{card.number}
            {card.multiverseid && ` • Multiverse ID: ${card.multiverseid}`}
          </div>
        )}
      </div>
    </div>
  )
}
