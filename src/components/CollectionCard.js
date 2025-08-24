'use client'

import { useState } from 'react'
import { useModal } from './ModalProvider'
import { TrashIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

export default function CollectionCard({ 
  collectionItem, 
  onRemove,
  viewMode = 'grid',
  className = ''
}) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const { showImageModal } = useModal()
  
  const card = collectionItem.card

  const getImageUrl = () => {
    // Priority order for image sources
    const imageSources = []
    
    if (card.imageUrl && !imageError) {
      imageSources.push(card.imageUrl)
    }
    
    if (card.multiverseid) {
      imageSources.push(`https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${card.multiverseid}&type=card`)
    }
    
    if (card.multiverseid) {
      imageSources.push(`http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${card.multiverseid}&type=card`)
    }
    
    if (card.set && card.number) {
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

  const handleImageClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const imageUrl = getImageUrl()
    if (imageUrl) {
      showImageModal({
        imageUrl,
        altText: card.name,
        cardName: card.name
      })
    }
  }

  const handleRemove = () => {
    if (onRemove) {
      onRemove(collectionItem)
    }
  }

  const getSetDisplayName = (card) => {
    // Use setName if available, otherwise fall back to set code
    return card.setName || card.set || 'Unknown Set'
  }

  const imageUrl = getImageUrl()

  if (viewMode === 'list') {
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
            
            {/* Card Basic Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-lg mb-2 truncate">{card.name}</h3>
              <div className="flex items-center gap-4 mb-2">
                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded-md">
                  {getSetDisplayName(card)}
                </span>
                <span className="text-sm text-gray-600">
                  Qty: {collectionItem.quantity || 1}
                </span>
                {collectionItem.condition && (
                  <span className="text-sm text-gray-600">
                    {collectionItem.condition}
                  </span>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex-shrink-0 flex gap-2">
              <button
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                onClick={() => setShowDetails(!showDetails)}
                title={showDetails ? "Hide details" : "Show details"}
              >
                <InformationCircleIcon className="w-5 h-5" />
              </button>
              <button
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                onClick={handleRemove}
                title="Remove from collection"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 group ${className}`}>
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
          
          {/* Collection Info Overlay */}
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-2">
            <div className="text-xs font-semibold text-gray-700">
              Qty: {collectionItem.quantity || 1}
            </div>
            {collectionItem.condition && (
              <div className="text-xs text-gray-600">
                {collectionItem.condition}
              </div>
            )}
          </div>

          {/* Action Buttons - Show on hover */}
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              className="p-2 bg-white/90 backdrop-blur-sm text-gray-600 hover:text-blue-600 rounded-lg shadow-md transition-colors"
              onClick={() => setShowDetails(!showDetails)}
              title={showDetails ? "Hide details" : "Show details"}
            >
              <InformationCircleIcon className="w-4 h-4" />
            </button>
            <button
              className="p-2 bg-white/90 backdrop-blur-sm text-gray-600 hover:text-red-600 rounded-lg shadow-md transition-colors"
              onClick={handleRemove}
              title="Remove from collection"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Minimal Card Info */}
      <div className="px-6 pb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{card.name}</h2>
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded-md">
            {getSetDisplayName(card)}
          </span>
        </div>
        
        {/* Show Details Section */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            <div className="text-sm text-gray-700">
              <strong>Type:</strong> {card.type}
            </div>
            {card.manaCost && (
              <div className="text-sm text-gray-700">
                <strong>Mana Cost:</strong> {card.manaCost}
              </div>
            )}
            {card.cmc !== undefined && (
              <div className="text-sm text-gray-700">
                <strong>CMC:</strong> {card.cmc}
              </div>
            )}
            {card.rarity && (
              <div className="text-sm text-gray-700">
                <strong>Rarity:</strong> {card.rarity}
              </div>
            )}
            {card.text && (
              <div className="text-sm text-gray-700">
                <strong>Text:</strong> 
                <div className="bg-gray-50 rounded-lg p-3 mt-1 text-xs">
                  {card.text}
                </div>
              </div>
            )}
            {(card.power || card.toughness) && (
              <div className="text-sm text-gray-700">
                <strong>Power/Toughness:</strong> {card.power}/{card.toughness}
              </div>
            )}
            {card.loyalty && (
              <div className="text-sm text-gray-700">
                <strong>Loyalty:</strong> {card.loyalty}
              </div>
            )}
            {card.artist && (
              <div className="text-sm text-gray-700">
                <strong>Artist:</strong> {card.artist}
              </div>
            )}
            {card.multiverseid && (
              <div className="text-sm text-gray-500">
                <strong>Multiverse ID:</strong> {card.multiverseid}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
