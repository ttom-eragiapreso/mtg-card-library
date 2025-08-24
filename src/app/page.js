'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Navigation from '@/components/Navigation'
import CardSearch from '@/components/CardSearch'
import CameraScanner from '@/components/CameraScanner'
import { CameraIcon, MagnifyingGlassIcon, SparklesIcon, CollectionIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { addCardToCollection } from '@/lib/collection-actions'

export default function Home() {
  const { data: session } = useSession()
  const [showScanner, setShowScanner] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [notification, setNotification] = useState(null)

  const handleAddToCollection = async (card) => {
    if (!session) return
    
    try {
      const result = await addCardToCollection(card)
      if (result.success) {
        setNotification({ type: 'success', message: 'Card added to collection!' })
        setTimeout(() => setNotification(null), 3000)
      } else {
        setNotification({ type: 'error', message: result.error || 'Failed to add card' })
        setTimeout(() => setNotification(null), 3000)
      }
    } catch (error) {
      console.error('Error adding card:', error)
      setNotification({ type: 'error', message: 'An error occurred while adding the card' })
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleCardDetected = async (cardName) => {
    setShowScanner(false)
    setShowSearch(true)
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Navigation />
        
        {/* Hero Section */}
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="mb-12">
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
                Welcome to 
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  MTG Library
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
                Start building your Magic: The Gathering collection
              </p>
            </div>
            
            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MagnifyingGlassIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">🔍 Search for Cards</h3>
                <p className="text-gray-700 leading-relaxed">
                  Use the search feature to find any Magic: The Gathering card by name. Browse through different printings and versions.
                </p>
              </div>
              
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <CameraIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">📱 Scan Physical Cards</h3>
                <p className="text-gray-700 leading-relaxed">
                  On mobile devices, use your camera to scan physical cards and automatically add them to your collection.
                </p>
              </div>
              
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <ChartBarIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">📚 Manage Your Collection</h3>
                <p className="text-gray-700 leading-relaxed">
                  Track quantities, conditions, and notes for each card. Filter and search through your personal library.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Camera Scanner Modal */}
      {showScanner && (
        <CameraScanner
          onCardDetected={handleCardDetected}
          onClose={() => setShowScanner(false)}
        />
      )}
      
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
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Welcome to MTG Library
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Start building your Magic: The Gathering collection
          </p>
          
          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              className={`px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-3 ${
                showSearch 
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
              }`}
              onClick={() => setShowSearch(!showSearch)}
            >
              <MagnifyingGlassIcon className="w-6 h-6" />
              <span>{showSearch ? 'Hide Search' : 'Search Cards'}</span>
            </button>
            
            <button
              className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-purple-300 hover:text-purple-700 transition-all duration-200 flex items-center justify-center space-x-3"
              onClick={() => setShowScanner(true)}
            >
              <CameraIcon className="w-6 h-6" />
              <span>Scan Card</span>
            </button>
          </div>
        </div>

        {/* Search Interface */}
        {showSearch && (
          <div className="mb-12">
            <CardSearch
              onAddToCollection={handleAddToCollection}
              className="max-w-6xl mx-auto"
            />
          </div>
        )}

        {/* Getting Started Guide */}
        {!showSearch && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Getting Started</h2>
                
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <MagnifyingGlassIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">1. Search for Cards</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Use the search feature to find any Magic: The Gathering card by name. Browse through different printings and versions.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <CameraIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">2. Scan Physical Cards</h3>
                  <p className="text-gray-700 leading-relaxed">
                    On mobile devices, use your camera to scan physical cards and automatically add them to your collection.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl">📚</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">3. Manage Your Collection</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Track quantities, conditions, and notes for each card. Filter and search through your personal library.
                  </p>
                </div>
              </div>
              
              <div className="text-center mt-12">
                <button
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
                  onClick={() => setShowSearch(true)}
                >
                  Start Searching Cards
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
