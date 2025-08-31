'use client'

import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/react/24/outline'
import MTGCard from './MTGCard'

const rarities = ['Common', 'Uncommon', 'Rare', 'Mythic Rare']
const colors = [
  { name: 'White', code: 'W', color: 'bg-yellow-100 text-yellow-800' },
  { name: 'Blue', code: 'U', color: 'bg-blue-500 text-white' },
  { name: 'Black', code: 'B', color: 'bg-gray-800 text-white' },
  { name: 'Red', code: 'R', color: 'bg-red-500 text-white' },
  { name: 'Green', code: 'G', color: 'bg-green-500 text-white' }
]

export default function AdvancedCardSearch({ 
  onAddToCollection,
  userCollection = [],
  className = ''
}) {
  const [filters, setFilters] = useState({
    name: '',
    foreignName: '',
    colors: [],
    types: [],
    subtypes: [],
    rarity: '',
    minCmc: '',
    maxCmc: '',
    set: ''
  })
  
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Available options (would be fetched from API in real implementation)
  const typeOptions = [
    'Creature', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Land', 'Planeswalker'
  ]

  const searchCards = async (abortController) => {
    // Don't search if no meaningful filters are set
    if (!filters.name && !filters.foreignName && !filters.colors.length && !filters.types.length && 
        !filters.subtypes.length && !filters.rarity && !filters.minCmc && 
        !filters.maxCmc && !filters.set) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    setError('')

    try {
      const searchParams = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '' && (Array.isArray(value) ? value.length > 0 : true)) {
          if (Array.isArray(value)) {
            searchParams.append(key, value.join(','))
          } else {
            searchParams.append(key, value)
          }
        }
      })

      const response = await fetch(`/api/cards/advanced-search?${searchParams}`, {
        signal: abortController?.signal
      })
      
      // Check if request was aborted
      if (abortController?.signal.aborted) {
        return
      }
      
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      // Only update results if the request wasn't aborted
      if (!abortController?.signal.aborted) {
        setSearchResults(data.cards || [])
      }
    } catch (error) {
      // Ignore abort errors
      if (error.name === 'AbortError') {
        return
      }
      
      console.error('Advanced search error:', error)
      setError(error.message)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleColorToggle = (colorCode) => {
    setFilters(prev => ({
      ...prev,
      colors: prev.colors.includes(colorCode)
        ? prev.colors.filter(c => c !== colorCode)
        : [...prev.colors, colorCode]
    }))
  }

  const handleArrayToggle = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }))
  }

  const clearFilters = () => {
    setFilters({
      name: '',
      foreignName: '',
      colors: [],
      types: [],
      subtypes: [],
      rarity: '',
      minCmc: '',
      maxCmc: '',
      set: ''
    })
    setSearchResults([])
    setError('')
  }

  const isCardInCollection = (card) => {
    return userCollection.some(collectionCard => 
      collectionCard.multiverseid === card.multiverseid ||
      (collectionCard.cardId === card.id && card.id)
    )
  }

  useEffect(() => {
    // Create AbortController for this search request
    const abortController = typeof window !== 'undefined' && window.AbortController ? new window.AbortController() : null
    
    const timeoutId = setTimeout(() => {
      searchCards(abortController)
    }, 500) // Debounce search

    return () => {
      // Cancel the timeout
      clearTimeout(timeoutId)
      // Abort any ongoing request
      if (abortController) {
        abortController.abort()
      }
    }
  }, [filters])

  return (
    <div className={`w-full ${className}`}>
      {/* Search Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Advanced Card Search</h2>
        <button
          className="btn btn-outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Search Filters */}
      <div className={`collapse ${showFilters ? 'collapse-open' : ''}`}>
        <div className="collapse-content">
          <div className="card bg-base-100 shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Card Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Card Name (English)</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter English card name"
                  className="input input-bordered"
                  value={filters.name}
                  onChange={(e) => handleFilterChange('name', e.target.value)}
                />
              </div>

              {/* Foreign Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Foreign Name</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter card name in any language"
                  className="input input-bordered"
                  value={filters.foreignName}
                  onChange={(e) => handleFilterChange('foreignName', e.target.value)}
                />
                <label className="label">
                  <span className="label-text-alt text-gray-500">
                    Search by Italian, German, French, Spanish, Japanese, etc.
                  </span>
                </label>
              </div>

              {/* Colors */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Colors</span>
                </label>
                <div className="flex gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.code}
                      className={`btn btn-sm ${
                        filters.colors.includes(color.code)
                          ? `${color.color}`
                          : 'btn-outline'
                      }`}
                      onClick={() => handleColorToggle(color.code)}
                    >
                      {color.code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rarity */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Rarity</span>
                </label>
                <select
                  className="select select-bordered"
                  value={filters.rarity}
                  onChange={(e) => handleFilterChange('rarity', e.target.value)}
                >
                  <option value="">Any Rarity</option>
                  {rarities.map((rarity) => (
                    <option key={rarity} value={rarity}>
                      {rarity}
                    </option>
                  ))}
                </select>
              </div>

              {/* Converted Mana Cost */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Mana Cost</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="input input-bordered flex-1"
                    min="0"
                    max="20"
                    value={filters.minCmc}
                    onChange={(e) => handleFilterChange('minCmc', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="input input-bordered flex-1"
                    min="0"
                    max="20"
                    value={filters.maxCmc}
                    onChange={(e) => handleFilterChange('maxCmc', e.target.value)}
                  />
                </div>
              </div>

              {/* Types */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Card Types</span>
                </label>
                <div className="flex flex-wrap gap-1">
                  {typeOptions.map((type) => (
                    <button
                      key={type}
                      className={`btn btn-xs ${
                        filters.types.includes(type)
                          ? 'btn-primary'
                          : 'btn-outline'
                      }`}
                      onClick={() => handleArrayToggle('types', type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Set */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Set Code</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., DOM, RNA, WAR"
                  className="input input-bordered"
                  value={filters.set}
                  onChange={(e) => handleFilterChange('set', e.target.value)}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between items-center mt-6">
              <button
                className="btn btn-outline"
                onClick={clearFilters}
              >
                <XMarkIcon className="w-4 h-4 mr-2" />
                Clear All Filters
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  className={`btn btn-primary ${isSearching ? 'loading' : ''}`}
                  onClick={() => searchCards()}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                  )}
                  Search Cards
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Search Results ({searchResults.length} cards found)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((card) => (
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
      )}

      {/* No Results Message */}
      {!isSearching && searchResults.length === 0 && !error && (
        Object.values(filters).some(f => 
          Array.isArray(f) ? f.length > 0 : f !== ''
        ) && (
          <div className="text-center py-8 text-gray-500">
            No cards found matching your search criteria.
          </div>
        )
      )}
    </div>
  )
}
