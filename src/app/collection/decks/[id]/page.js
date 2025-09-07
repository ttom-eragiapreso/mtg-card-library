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
  PhotoIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import ManaCurveChart from '@/components/charts/ManaCurveChart'
import ColorPieChart from '@/components/charts/ColorPieChart'
import TypePieChart from '@/components/charts/TypePieChart'
import BasicLandsAdder from '@/components/BasicLandsAdder'
import { useModal } from '@/components/ModalProvider'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

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
  
  // Advanced Filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filterBy, setFilterBy] = useState('all') // all, creatures, spells, artifacts, etc.
  const [sortBy, setSortBy] = useState('name') // name, type, cmc, etc.
  const [cmcValue, setCmcValue] = useState('')
  const [cmcMode, setCmcMode] = useState('exact') // exact, gte, lte
  const [selectedColors, setSelectedColors] = useState([]) // Array of selected color letters: W, U, B, R, G
  
  // Set Filter
  const [selectedSet, setSelectedSet] = useState('') // Selected set code
  
  // Card modal for chart interactions
  const [showCardModal, setShowCardModal] = useState(false)
  const [modalCards, setModalCards] = useState([])
  const [modalTitle, setModalTitle] = useState('')

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
  
  // Filter deck cards based on criteria (for chart modals)
  const filterDeckCards = (criteria) => {
    if (!deck?.cards) return []
    
    let filtered = deck.cards.filter(deckCard => deckCard.cardData)
    
    if (criteria.color) {
      if (criteria.color === 'C') {
        // Colorless cards
        filtered = filtered.filter(deckCard => {
          const colors = deckCard.cardData.colors || []
          return colors.length === 0
        })
      } else {
        // Cards with specific color
        filtered = filtered.filter(deckCard => {
          const colors = deckCard.cardData.colors || []
          return colors.includes(criteria.color)
        })
      }
    }
    
    if (criteria.type) {
      filtered = filtered.filter(deckCard => {
        const types = deckCard.cardData.types || []
        return types.some(type => type.toLowerCase() === criteria.type.toLowerCase())
      })
    }
    
    if (criteria.cmc !== undefined) {
      if (criteria.cmc >= 10) {
        filtered = filtered.filter(deckCard => parseInt(deckCard.cardData.cmc || 0) >= 10)
      } else {
        filtered = filtered.filter(deckCard => parseInt(deckCard.cardData.cmc || 0) === criteria.cmc)
      }
    }
    
    return filtered
  }
  
  // Modal handlers
  const openCardModal = (cards, title) => {
    setModalCards(cards)
    setModalTitle(title)
    setShowCardModal(true)
  }
  
  const closeCardModal = () => {
    setShowCardModal(false)
    setModalCards([])
    setModalTitle('')
  }
  
  // Chart click handlers
  const handleColorClick = (colorKey, displayName, count) => {
    const cards = filterDeckCards({ color: colorKey })
    openCardModal(cards, `${displayName} Cards (${count})`)
  }
  
  const handleTypeClick = (typeKey, displayName, count) => {
    const cards = filterDeckCards({ type: typeKey })
    openCardModal(cards, `${displayName} (${count})`)
  }
  
  const handleCmcClick = (cmcValue, displayCmc, count) => {
    const cards = filterDeckCards({ cmc: cmcValue })
    const title = cmcValue >= 10 ? `CMC 10+ Cards (${count})` : `CMC ${cmcValue} Cards (${count})`
    openCardModal(cards, title)
  }
  
  const handleAdvancedFiltersBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowAdvancedFilters(false)
    }
  }

  // Filter and sort deck cards based on all criteria
  const filteredCards = deck?.cards?.filter(deckCard => {
    const cardData = deckCard.cardData
    if (!cardData) return false
    
    // Apply search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase()
      const matchesName = cardData.name?.toLowerCase().includes(searchLower)
      const matchesType = cardData.type?.toLowerCase().includes(searchLower)
      const matchesText = cardData.text?.toLowerCase().includes(searchLower)
      if (!matchesName && !matchesType && !matchesText) return false
    }
    
    // Apply type filter
    if (filterBy !== 'all') {
      const types = cardData.types || []
      const hasType = types.some(type => type.toLowerCase() === filterBy.toLowerCase())
      if (!hasType) return false
    }
    
    // Apply CMC filter
    if (cmcValue !== '') {
      const targetCmc = parseInt(cmcValue)
      if (!isNaN(targetCmc)) {
        const itemCmc = parseInt(cardData.cmc) || 0
        switch (cmcMode) {
          case 'exact':
            if (itemCmc !== targetCmc) return false
            break
          case 'gte':
            if (itemCmc < targetCmc) return false
            break
          case 'lte':
            if (itemCmc > targetCmc) return false
            break
        }
      }
    }
    
    // Apply color filter
    if (selectedColors.length > 0) {
      const cardColorIdentity = cardData.colorIdentity || cardData.colors || []
      // Check if card has ALL of the selected colors (AND logic)
      const hasAllColors = selectedColors.every(color => cardColorIdentity.includes(color))
      if (!hasAllColors) return false
    }
    
    // Apply set filter
    if (selectedSet !== '') {
      if (cardData.set !== selectedSet) return false
    }
    
    return true
  }).sort((a, b) => {
    const cardA = a.cardData
    const cardB = b.cardData
    
    switch (sortBy) {
      case 'name':
        return (cardA?.name || '').localeCompare(cardB?.name || '')
      case 'type':
        return (cardA?.type || '').localeCompare(cardB?.type || '')
      case 'cmc': {
        const aCmc = parseInt(cardA?.cmc) || 0
        const bCmc = parseInt(cardB?.cmc) || 0
        return aCmc - bCmc
      }
      case 'rarity': {
        const rarityOrder = { 'common': 1, 'uncommon': 2, 'rare': 3, 'mythic rare': 4 }
        return (rarityOrder[cardA?.rarity?.toLowerCase()] || 0) - (rarityOrder[cardB?.rarity?.toLowerCase()] || 0)
      }
      case 'quantity':
        return b.quantity - a.quantity
      default:
        return (cardA?.name || '').localeCompare(cardB?.name || '')
    }
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
                <ManaCurveChart 
                  manaCurve={analytics.manaCurve}
                  onCmcClick={handleCmcClick} 
                />
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
                  onColorClick={handleColorClick}
                />
              </div>
            </div>

            {/* Type Distribution */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Card Types
              </h3>
              <div className="h-48">
                <TypePieChart 
                  typeDistribution={analytics.typeDistribution}
                  onTypeClick={handleTypeClick}
                />
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
              
              <div className="flex gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Search deck cards..."
                    className="w-full"
                    leftIcon={MagnifyingGlassIcon}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* Advanced Filters Button */}
                <button
                  onClick={() => setShowAdvancedFilters(true)}
                  className="relative flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 border border-gray-300 flex-shrink-0"
                >
                  <FunnelIcon className="w-5 h-5" />
                  <span className="ml-2 hidden sm:inline">Filters</span>
                  {(() => {
                    // Calculate active filters count
                    let activeFilters = 0
                    if (filterBy !== 'all') activeFilters++
                    if (cmcValue !== '') activeFilters++
                    if (selectedColors.length > 0) activeFilters++
                    if (selectedSet !== '') activeFilters++
                    
                    return activeFilters > 0 ? (
                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {activeFilters}
                      </span>
                    ) : null
                  })()} 
                </button>
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
      
      {/* Advanced Filters Modal */}
      {showAdvancedFilters && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={handleAdvancedFiltersBackdropClick}
        >
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

                {/* Set Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Set
                  </label>
                  <Select
                    className="w-full"
                    value={selectedSet}
                    onChange={(e) => setSelectedSet(e.target.value)}
                  >
                    <option value="">All Sets</option>
                    {/* Generate unique sets from deck cards */}
                    {deck?.cards
                      ?.filter(deckCard => deckCard.cardData)
                      .reduce((uniqueSets, deckCard) => {
                        const card = deckCard.cardData
                        if (card.set && !uniqueSets.some(s => s.code === card.set)) {
                          uniqueSets.push({
                            code: card.set,
                            name: card.setName || card.set
                          })
                        }
                        return uniqueSets
                      }, [])
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(set => (
                        <option key={set.code} value={set.code}>
                          {set.name}
                        </option>
                      ))
                    }
                  </Select>
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
                    <option value="name">Name</option>
                    <option value="type">Type</option>
                    <option value="cmc">Mana Cost</option>
                    <option value="rarity">Rarity</option>
                    <option value="quantity">Quantity</option>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setFilterBy('all')
                    setSortBy('name')
                    setCmcValue('')
                    setCmcMode('exact')
                    setSelectedColors([])
                    setSelectedSet('')
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
      
      {/* Card Modal */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeCardModal}></div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:p-6 w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {modalTitle}
                </h3>
                <button
                  onClick={closeCardModal}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto">
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {modalCards.map((deckCard, index) => {
                    const cardData = deckCard.cardData
                    const imageUrl = getCardImageUrl(deckCard)
                    
                    return (
                      <div key={`${deckCard.collectionCardId}-${index}`} className="relative group">
                        <div className="aspect-[2.5/3.5] rounded-lg overflow-hidden bg-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={cardData?.name}
                              className="w-full h-full object-cover cursor-pointer"
                              loading="lazy"
                              onClick={(e) => handleCardImageClick(deckCard, e)}
                              onError={(e) => {
                                // Hide image if it fails to load
                                e.target.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <div className="text-center p-2">
                                <div className="text-xs font-semibold text-gray-700 mb-1 line-clamp-2">
                                  {cardData?.name || 'Unknown Card'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {cardData?.set || 'Unknown Set'}
                                </div>
                                <div className="text-xs text-blue-600 font-medium mt-1">
                                  {deckCard.quantity}x
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Hover tooltip */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-b-lg">
                          <div className="font-semibold truncate">{cardData?.name}</div>
                          <div className="text-gray-300 truncate">{cardData?.set}</div>
                          <div className="text-blue-300">{deckCard.quantity}x</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {modalCards.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No cards found for this filter.
                  </div>
                )}
              </div>

              <div className="mt-5 sm:mt-6 flex justify-end">
                <button
                  type="button"
                  className="inline-flex justify-center w-full sm:w-auto rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                  onClick={closeCardModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
