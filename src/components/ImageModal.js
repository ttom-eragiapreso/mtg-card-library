'use client'

import { useState, useEffect } from 'react'

export default function ImageModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  altText,
  cardName 
}) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  // Reset image states when modal opens with new image
  useEffect(() => {
    if (isOpen && imageUrl) {
      setImageLoaded(false)
      setImageError(false)
    }
  }, [isOpen, imageUrl])

  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(false)
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-4xl max-h-full overflow-hidden">
        {/* Image container */}
        <div className="flex items-center justify-center min-h-[400px] max-h-[90vh] overflow-auto">
          {imageUrl && (
            <div className="relative">
              {/* Loading spinner */}
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              
              {/* Image */}
              <img
                src={imageUrl}
                alt={altText}
                className={`max-w-full max-h-[90vh] object-contain transition-opacity duration-300 rounded-lg shadow-2xl ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>
          )}

          {/* Error state */}
          {(imageError || !imageUrl) && (
            <div className="text-center p-8 bg-white rounded-lg shadow-2xl">
              <div className="text-gray-400 text-4xl mb-4">📄</div>
              <div className="text-gray-600 text-lg font-medium mb-2">
                {cardName || 'Card Image'}
              </div>
              <div className="text-gray-500">
                {imageError ? 'Failed to load image' : 'No image available'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
