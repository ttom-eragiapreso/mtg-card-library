'use client'

import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import MTGCard from './MTGCard'
import Input from './ui/Input'
import Select from './ui/Select'

export default function CardSearch({ 
  onAddToCollection,
  userCollection = [],
  initialQuery = '',
  className = ''
}) {
  const [searchTerm, setSearchTerm] = useState(initialQuery)
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')
  const [selectedVersions, setSelectedVersions] = useState([])
  const [showVersions, setShowVersions] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('English')

  const searchCards = async (term) => {
    if (!term.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    setError('')

    try {
      let endpoint, queryParams
      
      if (selectedLanguage === 'English') {
        // Use regular search for English
        endpoint = 'search'
        queryParams = `name=${encodeURIComponent(term)}`
      } else {
        // Use language search endpoint for other languages
        endpoint = 'language-search'
        queryParams = `name=${encodeURIComponent(term)}&language=${encodeURIComponent(selectedLanguage)}`
      }
      
      const response = await fetch(`/api/cards/${endpoint}?${queryParams}`)
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
  }, [searchTerm, selectedLanguage])

  // Group cards by name to show unique cards first
  const groupedResults = searchResults.reduce((acc, card) => {
    const name = card.name
    if (!acc[name]) {
      acc[name] = []
    }
    acc[name].push(card)
    return acc
  }, {})

  const uniqueCards = Object.entries(groupedResults).map(([_name, cards]) => {
    // Return the first card of each name group
    return cards[0]
  })

  return (
    <div className={`w-full ${className}`}>
      {/* Search Input */}
      <div className="w-full">
        <div className="card card-compact bg-base-100 shadow-xl border border-base-200">
          <div className="card-body">
            <div className="form-control w-full">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Search for Magic cards by name..."
                    className="w-full input-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    variant="bordered"
                  />
                </div>
                <button 
                  className="btn btn-primary btn-lg"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <MagnifyingGlassIcon className="w-5 h-5" />
                  )}
                </button>
                {searchTerm && (
                  <button
                    className="btn btn-ghost btn-square btn-lg"
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
              
              {/* Search Options */}
              <div className="divider divider-start text-base-content/60">Language Options</div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Search Language:</span>
                </label>
                <Select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  variant="bordered"
                  className="w-full max-w-xs"
                >
                  <option value="English">🇺🇸 English</option>
                  <option value="Spanish">🇪🇸 Spanish</option>
                  <option value="French">🇫🇷 French</option>
                  <option value="German">🇩🇪 German</option>
                  <option value="Italian">🇮🇹 Italian</option>
                  <option value="Portuguese">🇵🇹 Portuguese</option>
                  <option value="Japanese">🇯🇵 Japanese</option>
                  <option value="Chinese Simplified">🇨🇳 Chinese Simplified</option>
                  <option value="Chinese Traditional">🇹🇼 Chinese Traditional</option>
                  <option value="Korean">🇰🇷 Korean</option>
                  <option value="Russian">🇷🇺 Russian</option>
                </Select>
              </div>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="alert alert-error mt-4">
            <span className="font-medium">{error}</span>
          </div>
        )}
      </div>

      {/* Versions Modal */}
      <div className={`modal ${showVersions ? 'modal-open' : ''}`}>
        <div className="modal-box w-11/12 max-w-6xl h-fit max-h-[90vh]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-base-content">
              All Versions of {selectedVersions[0]?.name}
            </h3>
            <button 
              className="btn btn-sm btn-circle btn-ghost"
              onClick={() => setShowVersions(false)}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          
          <div className="divider"></div>
          
          <div className="overflow-y-auto max-h-[60vh]">
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
          
          <div className="modal-action">
            <button 
              className="btn btn-primary"
              onClick={() => setShowVersions(false)}
            >
              Close
            </button>
          </div>
        </div>
        <div className="modal-backdrop" onClick={() => setShowVersions(false)}>
          <button>close</button>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-2xl font-bold text-base-content">
              Search Results
            </h3>
            <div className="badge badge-primary badge-lg">
              {searchResults.length} cards
            </div>
          </div>
          
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
                    className="badge badge-info absolute top-3 right-3 hover:badge-info-focus transition-colors cursor-pointer"
                    onClick={() => showAllVersions(card.name)}
                  >
                    {groupedResults[card.name].length} versions
                  </button>
                ) : (
                  /* Single version - show add button */
                  <div className="absolute top-3 right-3">
                    <button
                      className={`btn btn-sm ${
                        isCardInCollection(card)
                          ? 'btn-success btn-disabled' 
                          : 'btn-primary'
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

      {/* No Results */}
      {searchTerm && !isSearching && searchResults.length === 0 && !error && (
        <div className="hero min-h-64 bg-base-100 rounded-box mt-8">
          <div className="hero-content text-center">
            <div className="max-w-md">
              <div className="text-6xl mb-4 opacity-50">🔍</div>
              <h2 className="text-2xl font-bold text-base-content mb-2">
                No cards found
              </h2>
              <p className="text-base-content/70 mb-4">
                No results for "{searchTerm}" in {selectedLanguage}
              </p>
              <div className="alert alert-info">
                <div className="flex-col items-start">
                  <div className="font-semibold">Try:</div>
                  <ul className="text-sm mt-1 text-left">
                    <li>• Checking your spelling</li>
                    <li>• Using fewer words</li>
                    <li>• Trying a different language</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
