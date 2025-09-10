'use client'

import { useState } from 'react'
import { useModal } from './ModalProvider'
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline'

export default function DeckCard({ 
  deckCard, 
  onRemove,
  onAddCard,
  className = ''
}) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const { showImageModal } = useModal()
  
  const card = deckCard.cardData

  // Get image URL with fallback logic
  const getImageUrl = () => {
    // For basic lands, we don't have actual images
    if (deckCard.isBasicLand) {
      return null
    }
    
    // Priority order for image sources
    const imageSources = []
    
    // Use imageSources array if available
    if (card?.imageSources && card.imageSources.length > 0) {
      imageSources.push(...card.imageSources)
    }
    
    // Direct imageUrl from MTG API
    if (card?.imageUrl && !imageError) {
      imageSources.push(card.imageUrl)
    }
    
    // Gatherer images using multiverseid
    if (card?.multiverseid) {
      imageSources.push(`https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${card.multiverseid}&type=card`)
      imageSources.push(`http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${card.multiverseid}&type=card`)
    }
    
    // Scryfall API fallback (if we have set and number)
    if (card?.set && card?.number) {
      const setCode = card.set.toLowerCase()
      const cardNumber = card.number.toLowerCase().replace(/[^a-z0-9]/g, '')
      imageSources.push(`https://api.scryfall.com/cards/${setCode}/${cardNumber}?format=image`)
    }
    
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

  const imageUrl = getImageUrl()

  const handleImageClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (imageUrl && card) {
      showImageModal({
        imageUrl,
        altText: card.name,
        cardName: card.name
      })
    }
  }

  // Basic land display
  if (deckCard.isBasicLand) {
    return (
      <div className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 ${className}`}>
        {/* Basic Land Icon */}
        <div className="relative aspect-[2.5/3.5] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <i className={`ms ms-${card?.name === 'Plains' ? 'w' :
                               card?.name === 'Island' ? 'u' :
                               card?.name === 'Swamp' ? 'b' :
                               card?.name === 'Mountain' ? 'r' :
                               card?.name === 'Forest' ? 'g' : 'c'} ms-cost`} 
             style={{
               fontSize: '4rem',
               color: card?.name === 'Plains' ? '#f59e0b' :
                      card?.name === 'Island' ? '#3b82f6' :
                      card?.name === 'Swamp' ? '#6b7280' :
                      card?.name === 'Mountain' ? '#ef4444' :
                      card?.name === 'Forest' ? '#10b981' : '#6b7280'
             }}></i>
          <div className="absolute bottom-2 left-2 right-2 text-center bg-black bg-opacity-60 text-white text-sm py-1 rounded">
            {card?.name}
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="p-3 bg-gray-50">
          <div className="flex items-center justify-center gap-3">
            {/* Minus Button */}
            {onRemove && (
              <button
                onClick={onRemove}
                className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 transition-colors flex items-center justify-center"
                title="Remove one copy"
              >
                <MinusIcon className="w-4 h-4" />
              </button>
            )}
            
            {/* Quantity Display */}
            <span className="text-lg font-bold text-gray-900 min-w-[3rem] text-center">
              {deckCard.quantity}x
            </span>
            
            {/* Plus Button */}
            {onAddCard && (
              <button
                onClick={onAddCard}
                className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 text-green-600 hover:text-green-700 transition-colors flex items-center justify-center"
                title="Add one more copy"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 ${className}`}>
      {/* Card Image */}
      <div className="relative aspect-[2.5/3.5] bg-gray-200">
        {imageUrl ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="loading loading-spinner loading-md"></div>
              </div>
            )}
            <img
              src={imageUrl}
              alt={card?.name || 'Magic card'}
              className={`w-full h-full object-cover cursor-pointer transition-all duration-200 hover:scale-105 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              onClick={handleImageClick}
            />
          </>
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <div className="text-center p-4">
              <div className="text-sm font-medium text-gray-700 mb-1">
                {card?.name || 'Unknown Card'}
              </div>
              <div className="text-xs text-gray-500">
                {card?.set || 'Unknown Set'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quantity Controls */}
      <div className="p-3 bg-gray-50">
        <div className="flex items-center justify-center gap-3">
          {/* Minus Button */}
          {onRemove && (
            <button
              onClick={onRemove}
              className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 transition-colors flex items-center justify-center"
              title="Remove one copy"
            >
              <MinusIcon className="w-4 h-4" />
            </button>
          )}
          
          {/* Quantity Display */}
          <span className="text-lg font-bold text-gray-900 min-w-[3rem] text-center">
            {deckCard.quantity}x
          </span>
          
          {/* Plus Button */}
          {onAddCard && (
            <button
              onClick={onAddCard}
              className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 text-green-600 hover:text-green-700 transition-colors flex items-center justify-center"
              title="Add one more copy"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
