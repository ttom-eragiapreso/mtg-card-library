'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { getUserDecks, createDeck, deleteDeck } from '@/lib/deck-actions'
import { PlusIcon, TrashIcon, EyeIcon, PencilIcon } from '@heroicons/react/24/outline'
import Navigation from '@/components/Navigation'
import Link from 'next/link'

export default function DecksPage() {
  const { data: session, status } = useSession()
  const [decks, setDecks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Create deck form data
  const [newDeckData, setNewDeckData] = useState({
    name: '',
    description: '',
    format: 'casual'
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

  // Load decks
  useEffect(() => {
    const loadDecks = async () => {
      if (!session) return
      
      setIsLoading(true)
      try {
        const result = await getUserDecks()
        if (result.success) {
          setDecks(result.decks)
        } else {
          setError(result.error || 'Failed to load decks')
        }
      } catch (error) {
        console.error('Error loading decks:', error)
        setError('Failed to load decks')
      } finally {
        setIsLoading(false)
      }
    }

    loadDecks()
  }, [session])

  const handleCreateDeck = async (e) => {
    e.preventDefault()
    if (!newDeckData.name.trim()) {
      setNotification({ type: 'error', message: 'Deck name is required' })
      setTimeout(() => setNotification(null), 3000)
      return
    }

    setIsCreating(true)
    try {
      const result = await createDeck(newDeckData)
      if (result.success) {
        setDecks(prev => [...prev, result.deck])
        setShowCreateModal(false)
        setNewDeckData({ name: '', description: '', format: 'casual' })
        setNotification({ type: 'success', message: 'Deck created successfully' })
        setTimeout(() => setNotification(null), 3000)
      } else {
        setNotification({ type: 'error', message: result.error || 'Failed to create deck' })
        setTimeout(() => setNotification(null), 3000)
      }
    } catch (error) {
      console.error('Error creating deck:', error)
      setNotification({ type: 'error', message: 'An error occurred while creating the deck' })
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteDeck = async (deckId, deckName) => {
    if (!window.confirm(`Are you sure you want to delete "${deckName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const result = await deleteDeck(deckId)
      if (result.success) {
        setDecks(prev => prev.filter(deck => deck.id !== deckId))
        setNotification({ type: 'success', message: 'Deck deleted successfully' })
        setTimeout(() => setNotification(null), 3000)
      } else {
        setNotification({ type: 'error', message: result.error || 'Failed to delete deck' })
        setTimeout(() => setNotification(null), 3000)
      }
    } catch (error) {
      console.error('Error deleting deck:', error)
      setNotification({ type: 'error', message: 'An error occurred while deleting the deck' })
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const formatOptions = [
    { value: 'casual', label: 'Casual' },
    { value: 'commander', label: 'Commander' },
    { value: 'standard', label: 'Standard' },
    { value: 'modern', label: 'Modern' },
    { value: 'legacy', label: 'Legacy' },
    { value: 'vintage', label: 'Vintage' },
    { value: 'pioneer', label: 'Pioneer' },
    { value: 'historic', label: 'Historic' },
    { value: 'pauper', label: 'Pauper' },
    { value: 'limited', label: 'Limited' }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="loading loading-spinner loading-lg mb-4"></div>
              <p className="text-gray-600">Loading your decks...</p>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
              🎲 Your Decks
            </h1>
            <p className="text-gray-600">Build and manage your Magic: The Gathering decks</p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create New Deck
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="text-sm text-gray-500">
            <Link href="/collection" className="hover:text-gray-700">Collection</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Decks</span>
          </nav>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && decks.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎲</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              No decks yet
            </h3>
            <p className="text-gray-600 mb-8">
              Create your first deck to start organizing your collection
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Your First Deck
            </button>
          </div>
        )}

        {/* Decks Grid */}
        {decks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {decks.map((deck) => (
              <div key={deck.id} className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden aspect-[5/7]">
                {/* Full Cover Image or Placeholder */}
                <div className="absolute inset-0">
                  {deck.coverCard ? (
                    <img
                      src={deck.coverCard.imageUrl || deck.coverCard.imageSources?.[0]}
                      alt={deck.coverCard.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Try next image source if available
                        const nextSrc = deck.coverCard.imageSources?.[1]
                        if (nextSrc && e.target.src !== nextSrc) {
                          e.target.src = nextSrc
                        } else {
                          // Show placeholder if no image works
                          e.target.parentElement.innerHTML = `
                            <div class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <div class="text-center p-4">
                                <div class="text-4xl mb-2">🎲</div>
                                <div class="text-gray-600 font-medium">${deck.name}</div>
                                <div class="text-gray-500 text-sm capitalize">${deck.format}</div>
                              </div>
                            </div>
                          `
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <div className="text-center p-4">
                        <div className="text-4xl mb-2">🎲</div>
                        <div className="text-gray-600 font-medium">{deck.name}</div>
                        <div className="text-gray-500 text-sm capitalize">{deck.format}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-75 transition-all duration-300">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-between text-white">
                    {/* Top Section - Deck Info */}
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg truncate">
                            {deck.name}
                          </h3>
                          <p className="text-sm text-gray-200 capitalize">
                            {deck.format}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteDeck(deck.id, deck.name)}
                          className="p-2 text-gray-300 hover:text-red-400 transition-colors duration-200"
                          title="Delete deck"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {deck.description && (
                        <p className="text-sm text-gray-200 mb-4 line-clamp-2">
                          {deck.description}
                        </p>
                      )}

                      {/* Deck Stats */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Cards:</span>
                          <span className="font-medium">{deck.cards?.length || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Created:</span>
                          <span className="font-medium">
                            {new Date(deck.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {deck.lastPlayedAt && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Last played:</span>
                            <span className="font-medium">
                              {new Date(deck.lastPlayedAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Always Visible View Deck Button */}
                <div className="absolute bottom-4 left-4 right-4">
                  <Link href={`/collection/decks/${deck.id}`}>
                    <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-lg">
                      View Deck
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Count */}
        {decks.length > 0 && (
          <div className="text-center mt-8 text-gray-600">
            {decks.length} deck{decks.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Create Deck Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <form onSubmit={handleCreateDeck}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Create New Deck</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setNewDeckData({ name: '', description: '', format: 'casual' })
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Deck Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deck Name *
                    </label>
                    <input
                      type="text"
                      value={newDeckData.name}
                      onChange={(e) => setNewDeckData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter deck name"
                      required
                    />
                  </div>

                  {/* Format */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Format
                    </label>
                    <select
                      value={newDeckData.format}
                      onChange={(e) => setNewDeckData(prev => ({ ...prev, format: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {formatOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newDeckData.description}
                      onChange={(e) => setNewDeckData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Optional deck description"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 px-6 pb-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewDeckData({ name: '', description: '', format: 'casual' })
                  }}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newDeckData.name.trim()}
                  className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors duration-200"
                >
                  {isCreating ? (
                    <div className="flex items-center justify-center">
                      <div className="loading loading-spinner loading-sm mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    'Create Deck'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
