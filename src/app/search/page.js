'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import CardSearch from '@/components/CardSearch'
import AdvancedCardSearch from '@/components/AdvancedCardSearch'
import { addCardToCollection } from '@/lib/collection-actions'
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'

export default function SearchPage() {
  const { data: session, status } = useSession()
  const [searchType, setSearchType] = useState('basic') // 'basic' or 'advanced'
  const [notification, setNotification] = useState(null)

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
          
          {/* Search Type Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-xl p-1 shadow-md">
              <button
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 ${
                  searchType === 'basic'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setSearchType('basic')}
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
                <span>Basic Search</span>
              </button>
              
              <button
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 ${
                  searchType === 'advanced'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setSearchType('advanced')}
              >
                <AdjustmentsHorizontalIcon className="w-5 h-5" />
                <span>Advanced Search</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search Interface */}
        <div className="max-w-6xl mx-auto">
          {searchType === 'basic' ? (
            <CardSearch
              onAddToCollection={handleAddToCollection}
              className="w-full"
            />
          ) : (
            <AdvancedCardSearch
              onAddToCollection={handleAddToCollection}
              userCollection={[]} // TODO: Load user collection for duplicate checking
              className="w-full"
            />
          )}
        </div>

        {/* Search Tips */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Search Tips</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">🌍 Foreign Language Support</h3>
                <ul className="text-gray-700 space-y-2">
                  <li>• Search by Italian names: "Fulmine" finds Lightning Bolt</li>
                  <li>• German names: "Blitzschlag" finds Lightning Bolt</li>
                  <li>• French names: "Éclair" finds Lightning Bolt</li>
                  <li>• Japanese, Chinese, and more languages supported</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">🔍 Search Techniques</h3>
                <ul className="text-gray-700 space-y-2">
                  <li>• Partial names work: "Lightning" finds Lightning Bolt</li>
                  <li>• Use Advanced Search for color, type, and cost filters</li>
                  <li>• Filter by set codes: DOM, RNA, WAR, etc.</li>
                  <li>• Search by mana cost range in Advanced mode</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
