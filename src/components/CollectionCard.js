'use client'

import { useState, useEffect, useMemo } from 'react'
import { useModal } from './ModalProvider'
import { useImageLoaderWithFallback } from '@/hooks/useImageLoader'
import { TrashIcon, InformationCircleIcon, RectangleStackIcon, CheckIcon } from '@heroicons/react/24/outline'
import { getUserDecks, addCardToDeck } from '@/lib/deck-actions'

export default function CollectionCard({ 
  collectionItem, 
  onRemove,
  viewMode = 'grid',
  className = ''
}) {
  const [showDetails, setShowDetails] = useState(false)
  const [showAddToDeck, setShowAddToDeck] = useState(false)
  const [decks, setDecks] = useState([])
  const [loadingDecks, setLoadingDecks] = useState(false)
  const [addingToDeck, setAddingToDeck] = useState(null)
  const [notification, setNotification] = useState(null)
  const { showImageModal } = useModal()
  
  // After migration, card data is directly in collectionItem
  const card = collectionItem

  // Build image fallback URLs
  const imageUrls = useMemo(() => {
    const sources = []
    
    if (card.imageUrl) {
      sources.push(card.imageUrl)
    }
    
    if (card.multiverseid) {
      sources.push(`https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${card.multiverseid}&type=card`)
      sources.push(`http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${card.multiverseid}&type=card`)
    }
    
    if (card.set && card.number) {
      const setCode = card.set.toLowerCase()
      const cardNumber = card.number.toLowerCase().replace(/[^a-z0-9]/g, '')
      sources.push(`https://api.scryfall.com/cards/${setCode}/${cardNumber}?format=image`)
    }
    
    return sources
  }, [card.imageUrl, card.multiverseid, card.set, card.number])

  // Use global image cache
  const {
    currentImageUrl: imageUrl,
    imageLoaded,
    imageError, 
    imageLoading,
    handleImageLoad,
    handleImageError
  } = useImageLoaderWithFallback(imageUrls)

  // Load user's decks when Add to Deck is opened
  useEffect(() => {
    const loadDecks = async () => {
      if (showAddToDeck && !loadingDecks) {
        setLoadingDecks(true)
        try {
          // Pass the current card to check which decks already contain it
          const result = await getUserDecks(card)
          if (result.success) {
            setDecks(result.decks)
          } else {
            console.error('Failed to load decks:', result.error)
          }
        } catch (error) {
          console.error('Error loading decks:', error)
        } finally {
          setLoadingDecks(false)
        }
      }
    }

    loadDecks()
  }, [showAddToDeck, card])


  const handleImageClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (imageUrl) {
      showImageModal({
        imageUrl,
        altText: card.name,
        cardName: card.name
      })
    }
  }

  const handleRemove = () => {
    if (onRemove) {
      onRemove(collectionItem)
    }
  }

  const handleAddToDeck = async (deckId) => {
    setAddingToDeck(deckId)
    try {
      const result = await addCardToDeck(deckId, card, 1, 'mainboard')
      if (result.success) {
        setNotification({ type: 'success', message: 'Card added to deck successfully' })
        setShowAddToDeck(false)
        setTimeout(() => setNotification(null), 3000)
      } else {
        setNotification({ type: 'error', message: result.error || 'Failed to add card to deck' })
        setTimeout(() => setNotification(null), 3000)
      }
    } catch (error) {
      console.error('Error adding card to deck:', error)
      setNotification({ type: 'error', message: 'An error occurred while adding the card to deck' })
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setAddingToDeck(null)
    }
  }

  const handleModalBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowAddToDeck(false)
    }
  }

  const getSetDisplayName = (card) => {
    // Use setName if available, otherwise fall back to set code
    return card.setName || card.set || 'Unknown Set'
  }

  if (viewMode === 'list') {
    return (
      <div className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 ${className}`}>
        <div className="p-4">
          <div className="flex items-start gap-4">
            {/* Compact Card Image */}
            <div className="flex-shrink-0">
              <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden relative">
                {imageUrl && (
                  <>
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    <img
                      src={imageUrl}
                      alt={card.name}
                      className={`w-full h-full object-cover transition-opacity duration-200 cursor-pointer hover:brightness-110 ${
                        imageLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                      onClick={handleImageClick}
                      title="Click to view larger image"
                    />
                  </>
                )}
                {(!imageUrl || imageError) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                    <div className="text-xs text-gray-500 text-center p-1">
                      No Image
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Card Basic Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-lg mb-2 truncate">{card.name}</h3>
              <div className="flex items-center gap-4 mb-2">
                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded-md">
                  {getSetDisplayName(card)}
                </span>
                <span className="text-sm text-gray-600">
                  Qty: {collectionItem.quantity || 1}
                </span>
                {collectionItem.condition && (
                  <span className="text-sm text-gray-600">
                    {collectionItem.condition}
                  </span>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex-shrink-0 flex gap-2">
              <button
                className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                onClick={() => setShowAddToDeck(true)}
                title="Add to deck"
              >
                <RectangleStackIcon className="w-5 h-5" />
              </button>
              <button
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                onClick={() => setShowDetails(!showDetails)}
                title={showDetails ? "Hide details" : "Show details"}
              >
                <InformationCircleIcon className="w-5 h-5" />
              </button>
              <button
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                onClick={handleRemove}
                title="Remove from collection"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 group ${className}`}>
      {/* Full Card Image */}
      <div className="p-6 pb-4">
        <div className="relative w-full max-w-xs mx-auto">
          {imageUrl && (
            <>
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <img
                src={imageUrl}
                alt={card.name}
                className={`rounded-lg w-full transition-opacity duration-300 cursor-pointer hover:brightness-110 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                onClick={handleImageClick}
                title="Click to view larger image"
              />
            </>
          )}
          {(!imageUrl || imageError) && (
            <div className="bg-gray-200 rounded-lg w-full aspect-[5/7] flex items-center justify-center">
              <div className="text-center p-4">
                <div className="text-gray-500 text-lg mb-2">📄</div>
                <div className="text-gray-600 text-sm font-medium">{card.name}</div>
                <div className="text-gray-500 text-xs mt-1">Image not available</div>
              </div>
            </div>
          )}
          
          {/* Collection Info Overlay removed */}

          {/* Action Buttons - Show on hover */}
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              className="p-2 bg-white/90 backdrop-blur-sm text-gray-600 hover:text-purple-600 rounded-lg shadow-md transition-colors"
              onClick={() => setShowAddToDeck(true)}
              title="Add to deck"
            >
              <RectangleStackIcon className="w-4 h-4" />
            </button>
            <button
              className="p-2 bg-white/90 backdrop-blur-sm text-gray-600 hover:text-blue-600 rounded-lg shadow-md transition-colors"
              onClick={() => setShowDetails(!showDetails)}
              title={showDetails ? "Hide details" : "Show details"}
            >
              <InformationCircleIcon className="w-4 h-4" />
            </button>
            <button
              className="p-2 bg-white/90 backdrop-blur-sm text-gray-600 hover:text-red-600 rounded-lg shadow-md transition-colors"
              onClick={handleRemove}
              title="Remove from collection"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Minimal Card Info */}
      <div className="px-6 pb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{card.name}</h2>
        <div className="flex items-center justify-between mb-3">
          <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded-md">
            {getSetDisplayName(card)}
          </span>
        </div>
        
        {/* Add to Deck Button */}
        <div className="mb-3">
          <button
            onClick={() => setShowAddToDeck(true)}
            className="w-full py-2 px-4 bg-purple-50 text-purple-700 rounded-lg font-medium hover:bg-purple-100 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <RectangleStackIcon className="w-4 h-4" />
            Add to Deck
          </button>
        </div>
        
        {/* Show Details Section */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            <div className="text-sm text-gray-700">
              <strong>Type:</strong> {card.type}
            </div>
            {card.manaCost && (
              <div className="text-sm text-gray-700">
                <strong>Mana Cost:</strong> {card.manaCost}
              </div>
            )}
            {card.cmc !== undefined && (
              <div className="text-sm text-gray-700">
                <strong>CMC:</strong> {card.cmc}
              </div>
            )}
            {card.rarity && (
              <div className="text-sm text-gray-700">
                <strong>Rarity:</strong> {card.rarity}
              </div>
            )}
            {card.text && (
              <div className="text-sm text-gray-700">
                <strong>Text:</strong> 
                <div className="bg-gray-50 rounded-lg p-3 mt-1 text-xs">
                  {card.text}
                </div>
              </div>
            )}
            {(card.power || card.toughness) && (
              <div className="text-sm text-gray-700">
                <strong>Power/Toughness:</strong> {card.power}/{card.toughness}
              </div>
            )}
            {card.loyalty && (
              <div className="text-sm text-gray-700">
                <strong>Loyalty:</strong> {card.loyalty}
              </div>
            )}
            {card.artist && (
              <div className="text-sm text-gray-700">
                <strong>Artist:</strong> {card.artist}
              </div>
            )}
            {card.multiverseid && (
              <div className="text-sm text-gray-500">
                <strong>Multiverse ID:</strong> {card.multiverseid}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Add to Deck Modal */}
      {showAddToDeck && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={handleModalBackdropClick}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Add to Deck</h2>
                <button
                  onClick={() => setShowAddToDeck(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={card.name}
                      className="w-12 h-16 object-cover rounded border"
                      onError={(e) => {
                        const nextSrc = card.imageSources?.[1]
                        if (nextSrc && e.target.src !== nextSrc) {
                          e.target.src = nextSrc
                        }
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{card.name}</h3>
                    <p className="text-sm text-gray-600">{card.type}</p>
                  </div>
                </div>
              </div>

              {loadingDecks ? (
                <div className="flex items-center justify-center py-8">
                  <div className="loading loading-spinner loading-md"></div>
                </div>
              ) : decks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🎲</div>
                  <p className="text-gray-600 mb-4">No decks found</p>
                  <button
                    onClick={() => {
                      setShowAddToDeck(false)
                      window.location.href = '/collection/decks'
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Create your first deck
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-700 mb-4">Select a deck to add this card to:</p>
                  {decks.map((deck) => (
                    <button
                      key={deck.id}
                      onClick={() => handleAddToDeck(deck.id)}
                      disabled={addingToDeck === deck.id}
                      className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 disabled:bg-gray-100 rounded-lg transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{deck.name}</h4>
                            {deck.containsCard && (
                              <div className="flex items-center justify-center w-5 h-5 bg-green-100 rounded-full">
                                <CheckIcon className="w-3 h-3 text-green-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="capitalize">{deck.format}</span>
                            <span>•</span>
                            <span>{deck.cards?.length || 0} cards</span>
                          </div>
                        </div>
                      </div>
                      {addingToDeck === deck.id ? (
                        <div className="loading loading-spinner loading-sm"></div>
                      ) : (
                        <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right duration-300">
          <div className={`px-4 py-3 rounded-lg shadow-lg font-medium text-white ${
            notification.type === 'success' 
              ? 'bg-green-600' 
              : 'bg-red-600'
          }`}>
            {notification.message}
          </div>
        </div>
      )}
    </div>
  )
}
