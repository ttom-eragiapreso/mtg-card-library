'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function ImageModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  altText,
  cardName 
}) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'auto'
    }
  }, [isOpen, onClose])

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

  console.log('ImageModal rendering:', { isOpen, imageUrl, cardName })

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-4xl max-h-full bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all duration-200 shadow-lg"
          aria-label="Close modal"
        >
          <XMarkIcon className="w-6 h-6 text-gray-700" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <h2 className="text-xl font-bold truncate pr-12">{cardName || altText}</h2>
        </div>

        {/* Image container */}
        <div className="flex items-center justify-center bg-gray-50 min-h-[400px] max-h-[80vh] overflow-auto">
          {imageUrl && (
            <div className="relative">
              {/* Loading spinner */}
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              
              {/* Image */}
              <img
                src={imageUrl}
                alt={altText}
                className={`max-w-full max-h-[70vh] object-contain transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>
          )}

          {/* Error state */}
          {(imageError || !imageUrl) && (
            <div className="text-center p-8">
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

        {/* Footer with instructions */}
        <div className="bg-gray-100 px-4 py-3 text-sm text-gray-600 text-center">
          Click outside the image or press ESC to close
        </div>
      </div>
    </div>
  )
}
