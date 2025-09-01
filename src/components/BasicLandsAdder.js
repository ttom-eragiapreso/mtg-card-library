'use client'

import { useState, useEffect } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'

const BASIC_LANDS = [
  {
    name: 'Plains',
    color: 'W',
    symbol: 'W',
    keyruneClass: 'ms ms-w',
    bgColor: 'bg-yellow-100',
    hoverColor: 'hover:bg-yellow-200',
    textColor: 'text-yellow-900'
  },
  {
    name: 'Island', 
    color: 'U',
    symbol: 'U',
    keyruneClass: 'ms ms-u',
    bgColor: 'bg-blue-100',
    hoverColor: 'hover:bg-blue-200',
    textColor: 'text-blue-900'
  },
  {
    name: 'Swamp',
    color: 'B', 
    symbol: 'B',
    keyruneClass: 'ms ms-b',
    bgColor: 'bg-gray-100',
    hoverColor: 'hover:bg-gray-200',
    textColor: 'text-gray-900'
  },
  {
    name: 'Mountain',
    color: 'R',
    symbol: 'R',
    keyruneClass: 'ms ms-r',
    bgColor: 'bg-red-100',
    hoverColor: 'hover:bg-red-200',
    textColor: 'text-red-900'
  },
  {
    name: 'Forest',
    color: 'G',
    symbol: 'G',
    keyruneClass: 'ms ms-g',
    bgColor: 'bg-green-100',
    hoverColor: 'hover:bg-green-200',
    textColor: 'text-green-900'
  }
]

// Helper function to get slider colors
const getSliderColor = (color) => {
  const colors = {
    'W': '#f59e0b', // Yellow for Plains
    'U': '#3b82f6', // Blue for Island
    'B': '#6b7280', // Gray for Swamp
    'R': '#ef4444', // Red for Mountain
    'G': '#10b981'  // Green for Forest
  }
  return colors[color] || '#d1d5db'
}

export default function BasicLandsAdder({ onAddLands, isLoading = false, shouldReset = false, onResetComplete }) {
  const [quantities, setQuantities] = useState({
    Plains: 0,
    Island: 0,
    Swamp: 0,
    Mountain: 0,
    Forest: 0
  })

  const updateQuantity = (landName, change) => {
    setQuantities(prev => ({
      ...prev,
      [landName]: Math.max(0, prev[landName] + change)
    }))
  }

  const setQuantity = (landName, value) => {
    const numValue = Math.max(0, parseInt(value) || 0)
    setQuantities(prev => ({
      ...prev,
      [landName]: numValue
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const landsToAdd = Object.entries(quantities)
      .filter(([_, quantity]) => quantity > 0)
      .map(([landName, quantity]) => ({
        landName,
        quantity
      }))

    if (landsToAdd.length > 0) {
      onAddLands(landsToAdd)
    }
  }

  const totalLands = Object.values(quantities).reduce((sum, qty) => sum + qty, 0)

  // Reset quantities when requested
  useEffect(() => {
    if (shouldReset) {
      setQuantities({
        Plains: 0,
        Island: 0,
        Swamp: 0,
        Mountain: 0,
        Forest: 0
      })
      onResetComplete?.()
    }
  }, [shouldReset, onResetComplete])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Quick Add Basic Lands</h3>
          {totalLands > 0 && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {totalLands} selected
            </span>
          )}
        </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {BASIC_LANDS.map((land) => (
            <div
              key={land.name}
              className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 bg-gray-50 min-w-[100px]"
            >
              <div className={`w-6 h-6 rounded-full ${land.bgColor} flex items-center justify-center border border-gray-300 flex-shrink-0`}>
                <i className={`${land.keyruneClass} ms-cost ${land.textColor}`} style={{fontSize: '14px'}}></i>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={quantities[land.name]}
                  onChange={(e) => setQuantity(land.name, e.target.value)}
                  className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer slider-${land.color.toLowerCase()}`}
                  style={{
                    background: quantities[land.name] > 0 
                      ? `linear-gradient(to right, ${getSliderColor(land.color)} 0%, ${getSliderColor(land.color)} ${(quantities[land.name] / 20) * 100}%, #d1d5db ${(quantities[land.name] / 20) * 100}%, #d1d5db 100%)`
                      : '#d1d5db'
                  }}
                />
                <span className="text-xs font-medium text-gray-600 w-4 text-center">
                  {quantities[land.name] > 0 ? quantities[land.name] : ''}
                </span>
              </div>
            </div>
          ))}
        </div>

        <style jsx>{`
          .slider-w::-webkit-slider-thumb {
            appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #f59e0b;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            cursor: pointer;
          }
          .slider-u::-webkit-slider-thumb {
            appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #3b82f6;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            cursor: pointer;
          }
          .slider-b::-webkit-slider-thumb {
            appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #6b7280;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            cursor: pointer;
          }
          .slider-r::-webkit-slider-thumb {
            appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #ef4444;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            cursor: pointer;
          }
          .slider-g::-webkit-slider-thumb {
            appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #10b981;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            cursor: pointer;
          }
          input[type="range"]::-moz-range-thumb {
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: var(--thumb-color);
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            cursor: pointer;
            border: none;
          }
        `}</style>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={totalLands === 0 || isLoading}
            className="px-2.5 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            {isLoading ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Adding...
              </>
            ) : (
              <>
                <PlusIcon className="w-3 h-3" />
                Add
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
