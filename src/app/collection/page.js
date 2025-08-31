'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { getUserCollection, removeCardFromCollection } from '@/lib/collection-actions'
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'
import Navigation from '@/components/Navigation'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import CollectionCard from '@/components/CollectionCard'

export default function CollectionPage() {
  const { data: session, status } = useSession()
  const [collection, setCollection] = useState([])
  const [filteredCollection, setFilteredCollection] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('dateAdded') // dateAdded, name, set, rarity
  const [filterBy, setFilterBy] = useState('all') // all, creatures, spells, artifacts, etc.
  
  // CMC Filters
  const [cmcValue, setCmcValue] = useState('')
  const [cmcMode, setCmcMode] = useState('exact') // exact, gte, lte
  
  // Color Filters
  const [selectedColors, setSelectedColors] = useState([]) // Array of selected color letters: W, U, B, R, G
  
  // Stats
  const [stats, setStats] = useState({
    totalCards: 0,
    uniqueCards: 0,
    totalValue: 0
  })

  // Redirect to sign-in if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  // Load collection data
  useEffect(() => {
    const loadCollection = async () => {
      if (!session) return
      
      setIsLoading(true)
      try {
        const result = await getUserCollection()
        if (result.success) {
          setCollection(result.collection)
          setFilteredCollection(result.collection)
          
          // Calculate stats
          const totalCards = result.collection.reduce((sum, item) => sum + (item.quantity || 1), 0)
          const uniqueCards = result.collection.length
          const totalValue = result.collection.reduce((sum, item) => {
            const price = parseFloat(item.acquiredPrice) || 0
            const quantity = parseInt(item.quantity) || 1
            return sum + (price * quantity)
          }, 0)
          
          setStats({ totalCards, uniqueCards, totalValue })
        } else {
          setError(result.error || 'Failed to load collection')
        }
      } catch (error) {
        console.error('Error loading collection:', error)
        setError('Failed to load collection')
      } finally {
        setIsLoading(false)
      }
    }

    loadCollection()
  }, [session])

  // Filter and sort collection
  useEffect(() => {
    let filtered = [...collection]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.text?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply type filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(item => {
        const types = item.types || []
        return types.some(type => type.toLowerCase() === filterBy.toLowerCase())
      })
    }

    // Apply CMC filter
    if (cmcValue !== '') {
      const targetCmc = parseInt(cmcValue)
      if (!isNaN(targetCmc)) {
        filtered = filtered.filter(item => {
          const itemCmc = parseInt(item.cmc) || 0
          switch (cmcMode) {
            case 'exact':
              return itemCmc === targetCmc
            case 'gte':
              return itemCmc >= targetCmc
            case 'lte':
              return itemCmc <= targetCmc
            default:
              return itemCmc === targetCmc
          }
        })
      }
    }

    // Apply color filter
    if (selectedColors.length > 0) {
      filtered = filtered.filter(item => {
        const cardColorIdentity = item.colorIdentity || []
        // Check if card has ALL of the selected colors (AND logic)
        return selectedColors.every(color => cardColorIdentity.includes(color))
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '')
        case 'set':
          return (a.set || '').localeCompare(b.set || '')
        case 'rarity': {
          const rarityOrder = { 'common': 1, 'uncommon': 2, 'rare': 3, 'mythic rare': 4 }
          return (rarityOrder[a.rarity?.toLowerCase()] || 0) - (rarityOrder[b.rarity?.toLowerCase()] || 0)
        }
        case 'cmc': {
          const aCmc = parseInt(a.cmc) || 0
          const bCmc = parseInt(b.cmc) || 0
          return aCmc - bCmc
        }
        case 'dateAdded':
        default:
          return new Date(b.addedAt || 0) - new Date(a.addedAt || 0)
      }
    })

    setFilteredCollection(filtered)
  }, [collection, searchQuery, filterBy, sortBy, cmcValue, cmcMode, selectedColors])

  const handleRemoveCard = async (collectionItem) => {
    try {
      const result = await removeCardFromCollection(collectionItem.id, collectionItem.multiverseid)
      if (result.success) {
        // Create a unique identifier for filtering
        const itemIdentifier = collectionItem.multiverseid || collectionItem.id
        setCollection(prev => prev.filter(item => {
          const currentIdentifier = item.multiverseid || item.id
          return currentIdentifier !== itemIdentifier
        }))
        setNotification({ type: 'success', message: 'Card removed from collection' })
        setTimeout(() => setNotification(null), 3000)
      } else {
        setNotification({ type: 'error', message: result.error || 'Failed to remove card' })
        setTimeout(() => setNotification(null), 3000)
      }
    } catch (error) {
      console.error('Error removing card:', error)
      setNotification({ type: 'error', message: 'An error occurred while removing the card' })
      setTimeout(() => setNotification(null), 3000)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="loading loading-spinner loading-lg mb-4"></div>
              <p className="text-gray-600">Loading your collection...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right duration-300">
          <div className={`px-6 py-4 rounded-xl shadow-lg font-medium text-white ${
            notification.type === 'success' 
              ? 'bg-green-600' 
              : 'bg-red-600'
          }`}>
            {notification.message}
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
        {/* Page Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 sm:mb-8">
            📚 Your Collection
          </h1>
        </div>

        {/* Collection Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-6 text-center">
            <div className="text-lg sm:text-2xl md:text-3xl font-bold text-blue-600 mb-1 sm:mb-2">{stats.totalCards}</div>
            <div className="text-xs sm:text-sm md:text-base text-gray-600">Total Cards</div>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-6 text-center">
            <div className="text-lg sm:text-2xl md:text-3xl font-bold text-purple-600 mb-1 sm:mb-2">{stats.uniqueCards}</div>
            <div className="text-xs sm:text-sm md:text-base text-gray-600">Unique Cards</div>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-6 text-center">
            <div className="text-lg sm:text-2xl md:text-3xl font-bold text-green-600 mb-1 sm:mb-2">
              ${stats.totalValue.toFixed(2)}
            </div>
            <div className="text-xs sm:text-sm md:text-base text-gray-600">Estimated Value</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-md border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex gap-3">
            {/* Search Input */}
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search collection..."
                className="w-full"
                leftIcon={MagnifyingGlassIcon}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Advanced Filters Button */}
            <button
              onClick={() => setShowAdvancedFilters(true)}
              className="relative flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 border border-gray-300"
            >
              <FunnelIcon className="w-5 h-5" />
              <span className="ml-2 hidden sm:inline">Filters</span>
              {(() => {
                // Calculate active filters count
                let activeFilters = 0
                if (filterBy !== 'all') activeFilters++
                if (cmcValue !== '') activeFilters++
                if (selectedColors.length > 0) activeFilters++
                
                return activeFilters > 0 ? (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilters}
                  </span>
                ) : null
              })()} 
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredCollection.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {searchQuery || filterBy !== 'all' || cmcValue !== '' || selectedColors.length > 0 ? 'No cards match your filters' : 'No cards in collection'}
            </h3>
            <p className="text-gray-600 mb-8">
              {searchQuery || filterBy !== 'all' || cmcValue !== '' || selectedColors.length > 0
                ? 'Try adjusting your search or filter criteria'
                : 'Start building your collection by searching for cards'}
            </p>
            <a
              href="/search"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
              Search for Cards
            </a>
          </div>
        )}

        {/* Collection Grid */}
        {filteredCollection.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCollection.map((item, index) => {
              // Create a unique key using multiverseid, id, or fall back to index
              const uniqueKey = item.multiverseid || item.id || `card-${index}`
              
              return (
                <CollectionCard
                  key={uniqueKey}
                  collectionItem={item}
                  onRemove={handleRemoveCard}
                  viewMode="grid"
                />
              )
            })}
          </div>
        )}

        {/* Results Count */}
        {filteredCollection.length > 0 && (
          <div className="text-center mt-8 text-gray-600">
            Showing {filteredCollection.length} of {collection.length} cards
          </div>
        )}
      </div>

      {/* Advanced Filters Modal */}
      {showAdvancedFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Advanced Filters</h2>
                <button
                  onClick={() => setShowAdvancedFilters(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Filter by Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Type
                  </label>
                  <Select
                    className="w-full"
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="creature">Creatures</option>
                    <option value="instant">Instants</option>
                    <option value="sorcery">Sorceries</option>
                    <option value="artifact">Artifacts</option>
                    <option value="enchantment">Enchantments</option>
                    <option value="planeswalker">Planeswalkers</option>
                    <option value="land">Lands</option>
                  </Select>
                </div>

                {/* Color Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Colors (Color Identity)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { letter: 'W', name: 'White', bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800', symbol: '☀️' },
                      { letter: 'U', name: 'Blue', bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800', symbol: '💧' },
                      { letter: 'B', name: 'Black', bg: 'bg-gray-50', border: 'border-gray-400', text: 'text-gray-800', symbol: '💀' },
                      { letter: 'R', name: 'Red', bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', symbol: '🔥' },
                      { letter: 'G', name: 'Green', bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800', symbol: '🌿' }
                    ].map(color => {
                      const isSelected = selectedColors.includes(color.letter)
                      return (
                        <button
                          key={color.letter}
                          type="button"
                          onClick={() => {
                            setSelectedColors(prev => 
                              isSelected 
                                ? prev.filter(c => c !== color.letter)
                                : [...prev, color.letter]
                            )
                          }}
                          className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all duration-200 ${
                            isSelected
                              ? `${color.bg} ${color.border} ${color.text} shadow-sm`
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                          title={`${color.name} (${color.letter})`}
                        >
                          <span className="text-lg mb-1">{color.symbol}</span>
                          <span className="text-xs font-medium">{color.letter}</span>
                        </button>
                      )
                    })}
                  </div>
                  {selectedColors.length > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      Selected: {selectedColors.join(', ')}
                    </div>
                  )}
                </div>

                {/* CMC Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Converted Mana Cost (CMC)
                  </label>
                  <div className="space-y-3">
                    {/* CMC Value Input */}
                    <Input
                      type="number"
                      placeholder="Enter CMC value"
                      className="w-full [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&[type=number]]:[-moz-appearance:textfield]"
                      value={cmcValue}
                      onChange={(e) => setCmcValue(e.target.value)}
                      min="0"
                      max="20"
                    />
                    
                    {/* CMC Mode Toggle */}
                    {cmcValue !== '' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCmcMode('exact')}
                          className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                            cmcMode === 'exact'
                              ? 'bg-blue-100 text-blue-700 border border-blue-300'
                              : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          Exact ({cmcValue})
                        </button>
                        <button
                          onClick={() => setCmcMode('gte')}
                          className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                            cmcMode === 'gte'
                              ? 'bg-green-100 text-green-700 border border-green-300'
                              : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          ≥ {cmcValue}
                        </button>
                        <button
                          onClick={() => setCmcMode('lte')}
                          className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                            cmcMode === 'lte'
                              ? 'bg-purple-100 text-purple-700 border border-purple-300'
                              : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          ≤ {cmcValue}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <Select
                    className="w-full"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="dateAdded">Date Added</option>
                    <option value="name">Name</option>
                    <option value="set">Set</option>
                    <option value="rarity">Rarity</option>
                    <option value="cmc">Mana Cost</option>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setFilterBy('all')
                    setSortBy('dateAdded')
                    setCmcValue('')
                    setCmcMode('exact')
                    setSelectedColors([])
                    setSearchQuery('')
                  }}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  Clear All Filters
                </button>
                <button
                  onClick={() => setShowAdvancedFilters(false)}
                  className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
