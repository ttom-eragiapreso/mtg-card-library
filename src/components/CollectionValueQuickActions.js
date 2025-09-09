'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PricingProgressModal from './PricingProgressModal'
import { updateCollectionPricing } from '@/lib/pricing-actions'

export default function CollectionValueQuickActions() {
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false)
  const router = useRouter()

  const handleUpdateAllPrices = () => {
    setIsProgressModalOpen(true)
  }

  const handleStartPricingUpdate = async () => {
    try {
      const result = await updateCollectionPricing({ forceUpdate: false })
      if (result.success) {
        // Refresh the page to show updated data after completion
        setTimeout(() => {
          router.refresh()
        }, 2000)
      }
      return result
    } catch (error) {
      console.error('Error updating pricing:', error)
      throw error
    }
  }

  const handleCloseProgressModal = () => {
    setIsProgressModalOpen(false)
  }

  const handleExportReport = () => {
    // TODO: Implement export functionality
    alert('Export feature coming soon!')
  }

  const handleViewFullCollection = () => {
    router.push('/collection')
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={handleUpdateAllPrices}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-3 px-4 rounded-lg border border-blue-200 transition-colors flex items-center justify-center gap-2"
          >
            <span>🔄</span> Update All Prices
          </button>
          <button 
            onClick={handleExportReport}
            className="bg-green-50 hover:bg-green-100 text-green-700 font-semibold py-3 px-4 rounded-lg border border-green-200 transition-colors flex items-center justify-center gap-2"
          >
            <span>📈</span> Export Price Report
          </button>
          <button 
            onClick={handleViewFullCollection}
            className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold py-3 px-4 rounded-lg border border-purple-200 transition-colors flex items-center justify-center gap-2"
          >
            <span>📋</span> View Full Collection
          </button>
        </div>
      </div>

      {/* Progress Modal */}
      <PricingProgressModal
        isOpen={isProgressModalOpen}
        onClose={handleCloseProgressModal}
        onStart={handleStartPricingUpdate}
        title="Updating All Collection Prices"
      />
    </>
  )
}
