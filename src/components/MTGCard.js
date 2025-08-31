'use client'

import { useState } from 'react'
import ManaCost from './ManaCost'
import { useModal } from './ModalProvider'
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
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const { showImageModal } = useModal()

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
    // Priority order for image sources
    const imageSources = []
    
    // 1. Direct imageUrl from MTG API
    if (card.imageUrl && !imageError) {
      imageSources.push(card.imageUrl)
    }
    
    // 2. Gatherer images using multiverseid
    if (card.multiverseid) {
      imageSources.push(`https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${card.multiverseid}&type=card`)
    }
    
    // 3. Alternative Gatherer URL format
    if (card.multiverseid) {
      imageSources.push(`http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${card.multiverseid}&type=card`)
    }
    
    // 4. Scryfall API fallback (if we have set and number)
    if (card.set && card.number) {
      const setCode = card.set.toLowerCase()
      const cardNumber = card.number.toLowerCase().replace(/[^a-z0-9]/g, '')
      imageSources.push(`https://api.scryfall.com/cards/${setCode}/${cardNumber}?format=image`)
    }
    
    // Return first available source
    return imageSources[0] || null
  }
  
  const handleImageLoad = () => {
    setImageLoaded(true)
    setImageLoading(false)
    setImageError(false)
  }
  
  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
    setImageLoaded(false)
  }

  const handleImageClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Image clicked!', { imageUrl, imageLoaded })
    if (imageUrl) {
      console.log('Showing modal with provider')
      showImageModal({
        imageUrl,
        altText: card.name,
        cardName: card.name
      })
    }
  }

  const imageUrl = getImageUrl()

  if (variant === 'compact') {
    return (
      <div className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 ${className}`}>
        <div className="p-4">
          <div className="flex items-start gap-4">
            {/* Compact Card Image */}
            <div className="flex-shrink-0">
              <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden relative">
                {imageUrl && (
                  <>
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    <img
                      src={imageUrl}
                      alt={card.name}
                      className={`w-full h-full object-cover transition-opacity duration-200 cursor-pointer hover:brightness-110 ${
                        imageLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                      onClick={handleImageClick}
                      title="Click to view larger image"
                    />
                  </>
                )}
                {(!imageUrl || imageError) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                    <div className="text-xs text-gray-500 text-center p-1">
                      No Image
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Card Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-lg mb-2 truncate">{card.name}</h3>
              <div className="flex items-center gap-3 mb-2">
                <ManaCost manaCost={card.manaCost} size="xs" />
                {card.cmc !== undefined && (
                  <span className="text-sm font-medium text-gray-700">CMC: {card.cmc}</span>
                )}
              </div>
              <p className="text-gray-800 font-medium mb-3 text-sm">
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
            
            {/* Add Button */}
            {showAddButton && (
              <div className="flex-shrink-0">
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
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 ${className}`}>
      {/* Full Card Image */}
      <div className="p-6 pb-4">
        <div className="relative w-full max-w-xs mx-auto">
          {imageUrl && (
            <>
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <img
                src={imageUrl}
                alt={card.name}
                className={`rounded-lg w-full transition-opacity duration-300 cursor-pointer hover:brightness-110 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                onClick={handleImageClick}
                title="Click to view larger image"
              />
            </>
          )}
          {(!imageUrl || imageError) && (
            <div className="bg-gray-200 rounded-lg w-full aspect-[5/7] flex items-center justify-center">
              <div className="text-center p-4">
                <div className="text-gray-500 text-lg mb-2">📄</div>
                <div className="text-gray-600 text-sm font-medium">{card.name}</div>
                <div className="text-gray-500 text-xs mt-1">Image not available</div>
              </div>
            </div>
          )}
        </div>
      </div>
      
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

        {/* Foreign Names */}
        {card.foreignNames && card.foreignNames.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Other Languages:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {card.foreignNames.slice(0, 6).map((foreign, index) => (
                <div key={index} className="flex justify-between">
                  <span className="font-medium text-gray-600">
                    {foreign.language}:
                  </span>
                  <span className="text-gray-800 truncate ml-1" title={foreign.name}>
                    {foreign.name}
                  </span>
                </div>
              ))}
              {card.foreignNames.length > 6 && (
                <div className="col-span-2 text-center text-gray-500 italic">
                  +{card.foreignNames.length - 6} more languages
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
