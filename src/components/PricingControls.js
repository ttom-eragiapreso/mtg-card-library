'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { updateCollectionPricing } from '@/lib/pricing-actions'
import PricingProgressModal from './PricingProgressModal'

export default function PricingControls({ currency = 'usd' }) {
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleCurrencyChange = (newCurrency) => {
    const params = new URLSearchParams(searchParams)
    params.set('currency', newCurrency)
    router.push(`?${params.toString()}`)
  }

  const handleUpdatePricing = () => {
    setIsProgressModalOpen(true)
  }

  const handleStartPricingUpdate = async (onProgress) => {
    try {
      const result = await updateCollectionPricing({ forceUpdate: false }, onProgress)
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

  return (
    <>
      <div className="flex items-center gap-4">
        {/* Currency Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Currency:</label>
          <select
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="usd">USD ($)</option>
            <option value="eur">EUR (€)</option>
          </select>
        </div>

        {/* Update Button */}
        <button
          onClick={handleUpdatePricing}
          className="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg"
        >
          <span>🔄</span>
          Update Prices
        </button>
      </div>
      
      {/* Progress Modal */}
      <PricingProgressModal
        isOpen={isProgressModalOpen}
        onClose={handleCloseProgressModal}
        onStart={handleStartPricingUpdate}
        title="Updating Collection Prices"
      />
    </>
  )
}
