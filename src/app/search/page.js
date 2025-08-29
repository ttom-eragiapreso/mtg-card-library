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
  const [versionsModalOpen, setVersionsModalOpen] = useState(false)

  // Redirect to sign-in if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="hero">
          <div className="hero-content text-center">
            <div className="loading loading-spinner loading-lg text-primary"></div>
          </div>
        </div>
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
    <div className="min-h-screen bg-base-200">
      <Navigation />
      
      {/* Notification Toast */}
      {notification && (
        <div className="toast toast-top toast-end z-50">
          <div className={`alert ${
            notification.type === 'success' 
              ? 'alert-success' 
              : 'alert-error'
          } shadow-lg`}>
            <span>{notification.message}</span>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12">
        {/* Page Header */}
        <div className="hero bg-base-100 rounded-box mb-6 sm:mb-8">
          <div className="hero-content text-center py-6 sm:py-12 px-4">
            <div className="max-w-2xl w-full">
              <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">🔍</div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-base-content mb-3 sm:mb-4 leading-tight">
                Search for Cards
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-base-content/70 px-2">
                Find Magic: The Gathering cards by name, including foreign language support
              </p>
            </div>
          </div>
        </div>

        {/* Search Interface */}
        <div className="max-w-6xl mx-auto">
          <CardSearch
            onAddToCollection={handleAddToCollection}
            onVersionsModalChange={setVersionsModalOpen}
            forceCloseVersionsModal={showAddModal}
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
