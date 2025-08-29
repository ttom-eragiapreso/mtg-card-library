'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline'

export default function AddToCollectionModal({ 
  card, 
  isOpen, 
  onClose, 
  onConfirm, 
  isAdding = false 
}) {
  const [foil, setFoil] = useState(false)

  const handleConfirm = () => {
    const collectionData = {
      quantity: 1,
      condition: 'near_mint',
      foil,
      language: 'English',
      notes: '',
      acquiredPrice: undefined,
      acquiredDate: new Date()
    }
    
    onConfirm(card, collectionData)
  }

  const handleReset = () => {
    setFoil(false)
  }

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFoil(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9998 }}>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900">
            Add to Collection
          </h3>
          <button 
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={onClose}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Card Info Header */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-20 bg-gray-200 rounded-lg overflow-hidden">
                {card?.imageUrl ? (
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                    No Image
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-lg mb-1">{card?.name}</h4>
                <p className="text-gray-700 text-sm mb-1">{card?.type}</p>
                <div className="flex items-center gap-3 text-sm">
                  <span className="px-2 py-1 bg-white text-gray-800 rounded-md font-medium">
                    {card?.set}
                  </span>
                  {card?.setName && (
                    <span className="text-gray-600">{card.setName}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Foil Toggle */}
          <div className="mb-6">
            <label className="flex items-center justify-center space-x-3 cursor-pointer bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg px-6 py-4 hover:from-yellow-100 hover:to-amber-100 transition-colors">
              <input
                type="checkbox"
                checked={foil}
                onChange={(e) => setFoil(e.target.checked)}
                className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 w-5 h-5"
              />
              <SparklesIcon className={`w-6 h-6 ${foil ? 'text-yellow-600' : 'text-gray-400'}`} />
              <span className={`font-semibold text-lg ${foil ? 'text-yellow-800' : 'text-gray-700'}`}>
                Foil Version
              </span>
            </label>
          </div>
        </div>
        
        {/* Modal Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            onClick={handleReset}
          >
            Reset
          </button>
          
          <div className="flex items-center space-x-3">
            <button 
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              onClick={onClose}
              disabled={isAdding}
            >
              Cancel
            </button>
            <button 
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
              onClick={handleConfirm}
              disabled={isAdding}
            >
              {isAdding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <span>Add to Collection</span>
                  {foil && <SparklesIcon className="w-4 h-4 text-yellow-300" />}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
