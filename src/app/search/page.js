'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import CardSearch from '@/components/CardSearch'
import AddToCollectionModal from '@/components/AddToCollectionModal'
import { addCardToCollection } from '@/lib/collection-actions'

export default function SearchPage() {
  const { data: session, status } = useSession()
  const [notification, setNotification] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isAddingToCollection, setIsAddingToCollection] = useState(false)

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

  const handleAddToCollection = (card) => {
    if (!session) return
    
    setSelectedCard(card)
    setShowAddModal(true)
  }

  const handleConfirmAddToCollection = async (card, collectionData) => {
    setIsAddingToCollection(true)
    
    try {
      const result = await addCardToCollection(card, collectionData)
      if (result.success) {
        setNotification({ 
          type: 'success', 
          message: `${collectionData.foil ? 'Foil ' : ''}${card.name} added to collection!` 
        })
        setTimeout(() => setNotification(null), 3000)
        setShowAddModal(false)
      } else {
        setNotification({ type: 'error', message: result.error || 'Failed to add card' })
        setTimeout(() => setNotification(null), 3000)
      }
    } catch (error) {
      console.error('Error adding card:', error)
      setNotification({ type: 'error', message: 'An error occurred while adding the card' })
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setIsAddingToCollection(false)
    }
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setSelectedCard(null)
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
            🔍 Search for Cards
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Find Magic: The Gathering cards by name, including foreign language support
          </p>
        </div>

        {/* Search Interface */}
        <div className="max-w-6xl mx-auto">
          <CardSearch
            onAddToCollection={handleAddToCollection}
            className="w-full"
          />
        </div>

      </div>
      
      {/* Add to Collection Modal */}
      <AddToCollectionModal
        card={selectedCard}
        isOpen={showAddModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmAddToCollection}
        isAdding={isAddingToCollection}
      />
    </div>
  )
}
