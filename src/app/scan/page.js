'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import CameraScanner from '@/components/CameraScanner'
import CardSearch from '@/components/CardSearch'
import { addCardToCollection } from '@/lib/collection-actions'
import { CameraIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline'

export default function ScanPage() {
  const { data: session, status } = useSession()
  const [showScanner, setShowScanner] = useState(false)
  const [detectedCardName, setDetectedCardName] = useState('')
  const [showSearch, setShowSearch] = useState(false)
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

  const handleCardDetected = async (cardName) => {
    setDetectedCardName(cardName)
    setShowScanner(false)
    setShowSearch(true)
    setNotification({ 
      type: 'success', 
      message: `Card detected: ${cardName}` 
    })
    setTimeout(() => setNotification(null), 5000)
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
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
        {/* Page Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            📱 Scan Physical Cards
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
            Use your device's camera to scan Magic: The Gathering cards and add them to your collection
          </p>
        </div>

        {/* Scanner Interface or Instructions */}
        {!showSearch ? (
          <div className="max-w-4xl mx-auto">
            {/* Scanner Button and Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 md:p-12 text-center mb-6 sm:mb-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
                <CameraIcon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
              </div>
              
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Ready to Scan</h2>
              <p className="text-gray-700 text-base sm:text-lg mb-6 sm:mb-8 px-2">
                Point your camera at a Magic: The Gathering card to automatically identify and add it to your collection
              </p>
              
              <button
                className="px-8 sm:px-10 md:px-12 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-base sm:text-lg font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 sm:space-x-3 mx-auto"
                onClick={() => setShowScanner(true)}
              >
                <CameraIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Start Camera</span>
              </button>
            </div>

            {/* How it Works */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
              <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <span className="text-lg sm:text-2xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Position Card</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Hold your device steady and frame the card clearly in the camera viewfinder
                </p>
              </div>
              
              <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <span className="text-lg sm:text-2xl font-bold text-purple-600">2</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Auto-Detect</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Our system will automatically identify the card name from the image
                </p>
              </div>
              
              <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <span className="text-lg sm:text-2xl font-bold text-green-600">3</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Add to Collection</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Review the detected card and add it directly to your collection
                </p>
              </div>
            </div>

            {/* Device Compatibility */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
              <div className="flex items-start space-x-3">
                <DevicePhoneMobileIcon className="w-6 h-6 text-amber-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-amber-800 mb-2">Best Experience on Mobile</h3>
                  <p className="text-amber-700">
                    For optimal scanning results, we recommend using this feature on a mobile device with a good camera. 
                    Make sure to allow camera access when prompted.
                  </p>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">💡 Scanning Tips</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Ensure good lighting</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Keep card flat and unobstructed</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Fill most of the camera frame</span>
                  </li>
                </ul>
                
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Hold device steady</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Clean card surface</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Avoid reflections and glare</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          /* Search Results */
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  {detectedCardName ? `Results for "${detectedCardName}"` : 'Search Results'}
                </h2>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <button
                    className="px-3 sm:px-4 py-2 bg-purple-600 text-white text-sm sm:text-base rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                    onClick={() => {
                      setShowScanner(true)
                      setShowSearch(false)
                    }}
                  >
                    <CameraIcon className="w-4 h-4" />
                    <span>Scan Another</span>
                  </button>
                  
                  <button
                    className="px-3 sm:px-4 py-2 bg-gray-600 text-white text-sm sm:text-base rounded-lg hover:bg-gray-700 transition-colors"
                    onClick={() => {
                      setShowSearch(false)
                      setDetectedCardName('')
                    }}
                  >
                    Back to Scanner
                  </button>
                </div>
              </div>
            </div>

            <CardSearch
              onAddToCollection={handleAddToCollection}
              initialQuery={detectedCardName}
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  )
}
