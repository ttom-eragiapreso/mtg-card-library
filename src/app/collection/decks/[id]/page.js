'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useParams } from 'next/navigation'
import { getDeckById, getDeckAnalytics, updateDeck, removeCardFromDeck, addBasicLandsToDeck, setDeckCoverCard } from '@/lib/deck-actions'
import { getUserCollection } from '@/lib/collection-actions'
import { 
  ChartBarIcon, 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  ArrowLeftIcon,
  ChartPieIcon,
  MagnifyingGlassIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import ManaCurveChart from '@/components/charts/ManaCurveChart'
import ColorPieChart from '@/components/charts/ColorPieChart'
import TypePieChart from '@/components/charts/TypePieChart'
import BasicLandsAdder from '@/components/BasicLandsAdder'
import { useModal } from '@/components/ModalProvider'

export default function DeckViewPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const deckId = params.id
  const { showImageModal } = useModal()

  const [deck, setDeck] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [collection, setCollection] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddCardsModal, setShowAddCardsModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isAddingLands, setIsAddingLands] = useState(false)
  const [shouldResetLandsForm, setShouldResetLandsForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [settingCoverCard, setSettingCoverCard] = useState(null)

  // Edit deck form data
  const [editData, setEditData] = useState({
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

  // Load deck data
  useEffect(() => {
    const loadDeckData = async () => {
      if (!session || !deckId) return
      
      setIsLoading(true)
      try {
        // Load deck, analytics, and collection in parallel
        const [deckResult, analyticsResult, collectionResult] = await Promise.all([
          getDeckById(deckId),
          getDeckAnalytics(deckId),
          getUserCollection()
        ])

        if (deckResult.success) {
          setDeck(deckResult.deck)
          setEditData({
            name: deckResult.deck.name,
            description: deckResult.deck.description || '',
            format: deckResult.deck.format
          })
        } else {
          setError(deckResult.error || 'Failed to load deck')
        }

        if (analyticsResult.success) {
          setAnalytics(analyticsResult.analytics)
        }

        if (collectionResult.success) {
          setCollection(collectionResult.collection)
        }
      } catch (error) {
        console.error('Error loading deck data:', error)
        setError('Failed to load deck data')
      } finally {
        setIsLoading(false)
      }
    }

    loadDeckData()
  }, [session, deckId])

  const handleUpdateDeck = async (e) => {
    e.preventDefault()
    if (!editData.name.trim()) {
      setNotification({ type: 'error', message: 'Deck name is required' })
      setTimeout(() => setNotification(null), 3000)
      return
    }

    setIsUpdating(true)
    try {
      const result = await updateDeck(deckId, editData)
      if (result.success) {
        setDeck(prev => ({
          ...prev,
          ...editData
        }))
        setShowEditModal(false)
        setNotification({ type: 'success', message: 'Deck updated successfully' })
        setTimeout(() => setNotification(null), 3000)
      } else {
        setNotification({ type: 'error', message: result.error || 'Failed to update deck' })
        setTimeout(() => setNotification(null), 3000)
      }
    } catch (error) {
      console.error('Error updating deck:', error)
      setNotification({ type: 'error', message: 'An error occurred while updating the deck' })
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemoveCard = async (cardData) => {
    if (!window.confirm(`Remove ${cardData.cardData?.name} from deck?`)) {
      return
    }

    try {
      const result = await removeCardFromDeck(deckId, cardData)
      if (result.success) {
        // Reload deck data
        const [deckResult, analyticsResult] = await Promise.all([
          getDeckById(deckId),
          getDeckAnalytics(deckId)
        ])

        if (deckResult.success) setDeck(deckResult.deck)
        if (analyticsResult.success) setAnalytics(analyticsResult.analytics)

        setNotification({ type: 'success', message: 'Card removed from deck' })
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

  const handleAddBasicLands = async (basicLands) => {
    setIsAddingLands(true)
    try {
      const result = await addBasicLandsToDeck(deckId, basicLands)
      if (result.success) {
        // Reload deck data
        const [deckResult, analyticsResult] = await Promise.all([
          getDeckById(deckId),
          getDeckAnalytics(deckId)
        ])

        if (deckResult.success) setDeck(deckResult.deck)
        if (analyticsResult.success) setAnalytics(analyticsResult.analytics)

        setNotification({ type: 'success', message: result.message })
        setTimeout(() => setNotification(null), 3000)
        
        // Reset the basic lands form
        setShouldResetLandsForm(true)
      } else {
        setNotification({ type: 'error', message: result.error || 'Failed to add basic lands' })
        setTimeout(() => setNotification(null), 3000)
      }
    } catch (error) {
      console.error('Error adding basic lands:', error)
      setNotification({ type: 'error', message: 'An error occurred while adding basic lands' })
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setIsAddingLands(false)
    }
  }

  const handleSetCoverCard = async (deckCard, index) => {
    const cardId = `${deckCard.collectionCardId}-${index}`
    setSettingCoverCard(cardId)
    
    try {
      const cardData = deckCard.cardData
      const result = await setDeckCoverCard(deckId, cardData)
      
      if (result.success) {
        // Reload deck data to get updated cover card
        const deckResult = await getDeckById(deckId)
        if (deckResult.success) {
          setDeck(deckResult.deck)
        }
        
        setNotification({ type: 'success', message: 'Deck cover image updated' })
        setTimeout(() => setNotification(null), 3000)
      } else {
        setNotification({ type: 'error', message: result.error || 'Failed to set cover card' })
        setTimeout(() => setNotification(null), 3000)
      }
    } catch (error) {
      console.error('Error setting cover card:', error)
      setNotification({ type: 'error', message: 'An error occurred while setting the cover card' })
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setSettingCoverCard(null)
    }
  }

  // Helper function to get image URL for a card
  const getCardImageUrl = (deckCard) => {
    const cardData = deckCard.cardData
    if (!cardData) return null

    // For basic lands, we don't have actual images
    if (deckCard.isBasicLand) {
      return null
    }

    // Priority order for image sources
    const imageSources = []
    
    // 1. Use imageSources array if available
    if (cardData.imageSources && cardData.imageSources.length > 0) {
      return cardData.imageSources[0]
    }
    
    // 2. Direct imageUrl from MTG API
    if (cardData.imageUrl) {
      imageSources.push(cardData.imageUrl)
    }
    
    // 3. Gatherer images using multiverseid
    if (cardData.multiverseid) {
      imageSources.push(`https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${cardData.multiverseid}&type=card`)
    }
    
    // 4. Alternative Gatherer URL format
    if (cardData.multiverseid) {
      imageSources.push(`http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${cardData.multiverseid}&type=card`)
    }
    
    // 5. Scryfall API fallback (if we have set and number)
    if (cardData.set && cardData.number) {
      const setCode = cardData.set.toLowerCase()
      const cardNumber = cardData.number.toLowerCase().replace(/[^a-z0-9]/g, '')
      imageSources.push(`https://api.scryfall.com/cards/${setCode}/${cardNumber}?format=image`)
    }
    
    // Return first available source
    return imageSources[0] || null
  }

  // Handle card image click
  const handleCardImageClick = (deckCard, e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const imageUrl = getCardImageUrl(deckCard)
    if (imageUrl && deckCard.cardData) {
      showImageModal({
        imageUrl,
        altText: deckCard.cardData.name,
        cardName: deckCard.cardData.name
      })
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

  const colorLabels = {
    W: 'White',
    U: 'Blue', 
    B: 'Black',
    R: 'Red',
    G: 'Green',
    C: 'Colorless'
  }

  // Filter cards based on search query
  const filteredCards = deck?.cards?.filter(deckCard => {
    if (!searchQuery.trim()) return true
    const cardName = deckCard.cardData?.name || ''
    return cardName.toLowerCase().includes(searchQuery.toLowerCase())
  }) || []

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="loading loading-spinner loading-lg mb-4"></div>
              <p className="text-gray-600">Loading deck...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !deck) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'Deck not found'}
            </h3>
            <Link
              href="/collection/decks"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back to Decks
            </Link>
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
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="text-sm text-gray-500">
            <Link href="/collection" className="hover:text-gray-700">Collection</Link>
            <span className="mx-2">/</span>
            <Link href="/collection/decks" className="hover:text-gray-700">Decks</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{deck.name}</span>
          </nav>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {deck.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span className="capitalize bg-gray-100 px-3 py-1 rounded-full">
                {deck.format}
              </span>
              <span>
                Created {new Date(deck.createdAt).toLocaleDateString()}
              </span>
              {deck.lastPlayedAt && (
                <span>
                  Last played {new Date(deck.lastPlayedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            {deck.description && (
              <p className="text-gray-600 mt-2">{deck.description}</p>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <PencilIcon className="w-4 h-4 mr-2" />
              Edit Deck
            </button>
          </div>
        </div>

        {/* Deck Analytics */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Basic Stats */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <ChartBarIcon className="w-5 h-5 mr-2" />
                Deck Overview
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{analytics.totalCards}</div>
                  <div className="text-sm text-gray-600">Total Cards</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{analytics.uniqueCards}</div>
                  <div className="text-sm text-gray-600">Unique Cards</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg col-span-2">
                  <div className="text-2xl font-bold text-green-600">{analytics.averageCmc}</div>
                  <div className="text-sm text-gray-600">Average CMC</div>
                </div>
              </div>
            </div>

            {/* Mana Curve */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Mana Curve
              </h3>
              <div className="h-48">
                <ManaCurveChart manaCurve={analytics.manaCurve} />
              </div>
            </div>

            {/* Color Distribution */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <ChartPieIcon className="w-5 h-5 mr-2" />
                Color Distribution
              </h3>
              <div className="h-48">
                <ColorPieChart 
                  colorDistribution={analytics.colorDistribution} 
                  colorPercentages={analytics.colorPercentages}
                />
              </div>
            </div>

            {/* Type Distribution */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Card Types
              </h3>
              <div className="h-48">
                <TypePieChart typeDistribution={analytics.typeDistribution} />
              </div>
            </div>
          </div>
        )}

        {/* Basic Lands Adder */}
        <div className="mb-8">
          <BasicLandsAdder 
            onAddLands={handleAddBasicLands}
            isLoading={isAddingLands}
            shouldReset={shouldResetLandsForm}
            onResetComplete={() => setShouldResetLandsForm(false)}
          />
        </div>

        {/* Deck Cards */}
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Cards in Deck ({analytics?.totalCards || deck.cards.reduce((sum, card) => sum + card.quantity, 0)})
                {searchQuery && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({filteredCards.length} {filteredCards.length === 1 ? 'match' : 'matches'})
                  </span>
                )}
              </h3>
              
              {/* Search Input */}
              <div className="relative flex-shrink-0 w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    title="Clear search"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {deck.cards.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🃏</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No cards in deck</h4>
              <p className="text-gray-600 mb-6">Add cards from your collection to build your deck</p>
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No cards found</h4>
              <p className="text-gray-600 mb-6">No cards match your search "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredCards.map((deckCard, index) => (
                <div key={`${deckCard.collectionCardId}-${index}`} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Card Image or Mana Symbol */}
                      <div className="flex-shrink-0">
                        {deckCard.isBasicLand ? (
                          <div className="w-12 h-16 bg-gray-100 rounded border flex items-center justify-center">
                            <i className={`ms ms-${deckCard.cardData.name === 'Plains' ? 'w' :
                                                   deckCard.cardData.name === 'Island' ? 'u' :
                                                   deckCard.cardData.name === 'Swamp' ? 'b' :
                                                   deckCard.cardData.name === 'Mountain' ? 'r' :
                                                   deckCard.cardData.name === 'Forest' ? 'g' : 'c'} ms-cost text-2xl`} 
                               style={{
                                 color: deckCard.cardData.name === 'Plains' ? '#f59e0b' :
                                        deckCard.cardData.name === 'Island' ? '#3b82f6' :
                                        deckCard.cardData.name === 'Swamp' ? '#6b7280' :
                                        deckCard.cardData.name === 'Mountain' ? '#ef4444' :
                                        deckCard.cardData.name === 'Forest' ? '#10b981' : '#6b7280'
                               }}></i>
                          </div>
                        ) : deckCard.cardData?.imageSources?.[0] ? (
                          <img
                            src={deckCard.cardData.imageSources[0]}
                            alt={deckCard.cardData.name}
                            className="w-12 h-16 object-cover rounded border cursor-pointer hover:brightness-110 hover:scale-105 transition-all duration-200"
                            onClick={(e) => handleCardImageClick(deckCard, e)}
                            title={`Click to view ${deckCard.cardData.name} enlarged`}
                            onError={(e) => {
                              // Try next image source
                              const nextSrc = deckCard.cardData.imageSources[1]
                              if (nextSrc && e.target.src !== nextSrc) {
                                e.target.src = nextSrc
                              }
                            }}
                          />
                        ) : getCardImageUrl(deckCard) ? (
                          <img
                            src={getCardImageUrl(deckCard)}
                            alt={deckCard.cardData?.name || 'Card'}
                            className="w-12 h-16 object-cover rounded border cursor-pointer hover:brightness-110 hover:scale-105 transition-all duration-200"
                            onClick={(e) => handleCardImageClick(deckCard, e)}
                            title={`Click to view ${deckCard.cardData?.name} enlarged`}
                            onError={(e) => {
                              // Hide image if it fails to load
                              e.target.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-12 h-16 bg-gray-200 rounded border flex items-center justify-center">
                            <span className="text-xs text-gray-500">No Image</span>
                          </div>
                        )}
                      </div>

                      {/* Card Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900">
                          {deckCard.cardData?.name || 'Unknown Card'}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span>{deckCard.cardData?.type}</span>
                          {deckCard.cardData?.manaCost && (
                            <span>({deckCard.cardData.manaCost})</span>
                          )}
                          <span className="capitalize bg-gray-100 px-2 py-1 rounded">
                            {deckCard.category || 'mainboard'}
                          </span>
                        </div>
                      </div>

                      {/* Quantity */}
                      <div className="text-center">
                        <span className="text-lg font-bold text-gray-900">
                          {deckCard.quantity}x
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSetCoverCard(deckCard, index)}
                        disabled={settingCoverCard !== null}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                        title="Set as deck cover image"
                      >
                        {settingCoverCard === `${deckCard.collectionCardId}-${index}` ? (
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <PhotoIcon className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleRemoveCard(deckCard)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove from deck"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Deck Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <form onSubmit={handleUpdateDeck}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Edit Deck</h2>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
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
                      value={editData.name}
                      onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Format */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Format
                    </label>
                    <select
                      value={editData.format}
                      onChange={(e) => setEditData(prev => ({ ...prev, format: e.target.value }))}
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
                      value={editData.description}
                      onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 px-6 pb-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !editData.name.trim()}
                  className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors duration-200"
                >
                  {isUpdating ? (
                    <div className="flex items-center justify-center">
                      <div className="loading loading-spinner loading-sm mr-2"></div>
                      Updating...
                    </div>
                  ) : (
                    'Save Changes'
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
