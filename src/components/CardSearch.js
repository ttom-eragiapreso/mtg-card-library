'use client'

import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import MTGCard from './MTGCard'

export default function CardSearch({ 
  onCardSelect, 
  onAddToCollection,
  userCollection = [],
  className = ''
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')
  const [selectedVersions, setSelectedVersions] = useState([])
  const [showVersions, setShowVersions] = useState(false)

  const searchCards = async (term) => {
    if (!term.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    setError('')

    try {
      const response = await fetch(`/api/cards/search?name=${encodeURIComponent(term)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      setSearchResults(data.cards || [])
    } catch (error) {
      console.error('Search error:', error)
      setError(error.message)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const showAllVersions = async (cardName) => {
    setIsSearching(true)
    setError('')

    try {
      const response = await fetch(`/api/cards/versions?name=${encodeURIComponent(cardName)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch versions')
      }

      setSelectedVersions(data.cards || [])
      setShowVersions(true)
    } catch (error) {
      console.error('Versions fetch error:', error)
      setError(error.message)
    } finally {
      setIsSearching(false)
    }
  }

  const isCardInCollection = (card) => {
    return userCollection.some(collectionCard => 
      collectionCard.multiverseid === card.multiverseid ||
      (collectionCard.cardId === card.id && card.id)
    )
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchCards(searchTerm)
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Group cards by name to show unique cards first
  const groupedResults = searchResults.reduce((acc, card) => {
    const name = card.name
    if (!acc[name]) {
      acc[name] = []
    }
    acc[name].push(card)
    return acc
  }, {})

  const uniqueCards = Object.entries(groupedResults).map(([name, cards]) => {
    // Return the first card of each name group
    return cards[0]
  })

  return (
    <div className={`w-full ${className}`}>
      {/* Search Input */}
      <div className="w-full">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search for Magic cards by name..."
                className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              disabled={isSearching}
            >
              {isSearching ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <MagnifyingGlassIcon className="w-5 h-5" />
              )}
            </button>
            {searchTerm && (
              <button
                className="px-4 py-3 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setSearchTerm('')
                  setSearchResults([])
                  setError('')
                }}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <span className="font-medium">{error}</span>
          </div>
        )}
      </div>

      {/* Versions Modal */}
      {showVersions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setShowVersions(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-6xl max-h-[90vh] mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">
                All Versions of {selectedVersions[0]?.name}
              </h3>
              <button 
                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setShowVersions(false)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedVersions.map((card) => (
                  <MTGCard
                    key={card.multiverseid || card.id}
                    card={card}
                    variant="compact"
                    onAddToCollection={onAddToCollection}
                    isInCollection={isCardInCollection(card)}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-end p-6 border-t border-gray-200">
              <button 
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
                onClick={() => setShowVersions(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Search Results ({searchResults.length} cards found)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uniqueCards.map((card) => (
              <div key={card.name} className="relative">
                <MTGCard
                  card={card}
                  variant="compact"
                  showAddButton={false}
                  onAddToCollection={onAddToCollection}
                  isInCollection={isCardInCollection(card)}
                />
                
                {/* Show all versions button */}
                {groupedResults[card.name].length > 1 ? (
                  <button
                    className="absolute top-3 right-3 px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                    onClick={() => showAllVersions(card.name)}
                  >
                    {groupedResults[card.name].length} versions
                  </button>
                ) : (
                  /* Single version - show add button */
                  <div className="absolute top-3 right-3">
                    <button
                      className={`px-3 py-1 text-xs rounded-md font-semibold transition-all duration-200 flex items-center justify-center ${
                        isCardInCollection(card)
                          ? 'bg-green-600 text-white' 
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                      }`}
                      onClick={() => onAddToCollection(card)}
                      disabled={isCardInCollection(card)}
                    >
                      {isCardInCollection(card) ? (
                        <>✓ Added</>
                      ) : (
                        <>+ Add</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {searchTerm && !isSearching && searchResults.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <p className="text-lg font-medium text-gray-900 mb-2">
            No cards found for "{searchTerm}"
          </p>
          <p className="text-gray-600">
            Try adjusting your search terms or check the spelling
          </p>
        </div>
      )}
    </div>
  )
}
