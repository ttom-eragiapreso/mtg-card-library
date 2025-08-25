'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import CollectionCard from '@/components/CollectionCard'
import { getUserCollection, removeCardFromCollection } from '@/lib/collection-actions'
import { 
  MagnifyingGlassIcon, 
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline'

export default function CollectionPage() {
  const { data: session, status } = useSession()
  const [collection, setCollection] = useState([])
  const [filteredCollection, setFilteredCollection] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState(null)
  
  // Filters and view options
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('dateAdded') // dateAdded, name, set, rarity
  const [filterBy, setFilterBy] = useState('all') // all, creatures, spells, artifacts, etc.
  const [viewMode, setViewMode] = useState('grid') // grid, list
  
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
        item.card?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.card?.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.card?.text?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply type filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(item => {
        const types = item.card?.types || []
        return types.some(type => type.toLowerCase() === filterBy.toLowerCase())
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.card?.name || '').localeCompare(b.card?.name || '')
        case 'set':
          return (a.card?.set || '').localeCompare(b.card?.set || '')
        case 'rarity': {
          const rarityOrder = { 'common': 1, 'uncommon': 2, 'rare': 3, 'mythic rare': 4 }
          return (rarityOrder[a.card?.rarity?.toLowerCase()] || 0) - (rarityOrder[b.card?.rarity?.toLowerCase()] || 0)
        }
        case 'dateAdded':
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      }
    })

    setFilteredCollection(filtered)
  }, [collection, searchQuery, filterBy, sortBy])

  const handleRemoveCard = async (collectionItem) => {
    try {
      const result = await removeCardFromCollection(collectionItem.cardId, collectionItem.multiverseid)
      if (result.success) {
        setCollection(prev => prev.filter(item => item._id !== collectionItem._id))
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
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            📚 Your Collection
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Manage and browse your Magic: The Gathering card collection
          </p>
        </div>

        {/* Collection Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalCards}</div>
            <div className="text-gray-600">Total Cards</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.uniqueCards}</div>
            <div className="text-gray-600">Unique Cards</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              ${stats.totalValue.toFixed(2)}
            </div>
            <div className="text-gray-600">Estimated Value</div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search collection..."
                className="w-full pl-10 pr-4 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter by Type */}
            <div>
              <select
                className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white appearance-none cursor-pointer"
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
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white appearance-none cursor-pointer"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="dateAdded">Date Added</option>
                <option value="name">Name</option>
                <option value="set">Set</option>
                <option value="rarity">Rarity</option>
              </select>
            </div>

            {/* View Mode */}
            <div className="flex bg-gray-100 rounded-xl p-2 border border-gray-200">
              <button
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
                  viewMode === 'grid' 
                    ? 'bg-white shadow-md text-blue-600 border border-blue-100' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                }`}
                onClick={() => setViewMode('grid')}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
                  viewMode === 'list' 
                    ? 'bg-white shadow-md text-blue-600 border border-blue-100' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                }`}
                onClick={() => setViewMode('list')}
              >
                <ListBulletIcon className="w-5 h-5" />
              </button>
            </div>
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
              {searchQuery || filterBy !== 'all' ? 'No cards match your filters' : 'No cards in collection'}
            </h3>
            <p className="text-gray-600 mb-8">
              {searchQuery || filterBy !== 'all' 
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

        {/* Collection Grid/List */}
        {filteredCollection.length > 0 && (
          <div className={`grid gap-4 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {filteredCollection.map((item) => (
              <CollectionCard
                key={item._id}
                collectionItem={item}
                onRemove={handleRemoveCard}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}

        {/* Results Count */}
        {filteredCollection.length > 0 && (
          <div className="text-center mt-8 text-gray-600">
            Showing {filteredCollection.length} of {collection.length} cards
          </div>
        )}
      </div>
    </div>
  )
}
