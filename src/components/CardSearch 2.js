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
      <div className="form-control w-full">
        <div className="input-group">
          <input
            type="text"
            placeholder="Search for Magic cards by name..."
            className="input input-bordered flex-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-square" disabled={isSearching}>
            {isSearching ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <MagnifyingGlassIcon className="w-5 h-5" />
            )}
          </button>
          {searchTerm && (
            <button
              className="btn btn-square"
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
        
        {error && (
          <div className="alert alert-error mt-2">
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Versions Modal */}
      {showVersions && (
        <div className=\"modal modal-open\">
          <div className=\"modal-box max-w-6xl\">
            <h3 className=\"font-bold text-lg mb-4\">
              All Versions of {selectedVersions[0]?.name}
            </h3>
            <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto\">
              {selectedVersions.map((card) => (
                <MTGCard
                  key={card.multiverseid || card.id}
                  card={card}
                  variant=\"compact\"
                  onAddToCollection={onAddToCollection}
                  isInCollection={isCardInCollection(card)}
                />
              ))}
            </div>
            <div className=\"modal-action\">
              <button 
                className=\"btn\"
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
        <div className=\"mt-6\">
          <h3 className=\"text-lg font-semibold mb-4\">
            Search Results ({searchResults.length} cards found)
          </h3>
          
          <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\">
            {uniqueCards.map((card) => (
              <div key={card.name} className=\"relative\">
                <MTGCard
                  card={card}
                  variant=\"compact\"
                  onAddToCollection={onAddToCollection}
                  isInCollection={isCardInCollection(card)}
                />
                
                {/* Show all versions button */}
                {groupedResults[card.name].length > 1 && (
                  <button
                    className=\"btn btn-xs btn-outline absolute top-2 right-2\"
                    onClick={() => showAllVersions(card.name)}
                  >
                    {groupedResults[card.name].length} versions
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {searchTerm && !isSearching && searchResults.length === 0 && !error && (
        <div className=\"text-center py-8 text-gray-500\">
          No cards found for \"{searchTerm}\"
        </div>
      )}
    </div>
  )
}
