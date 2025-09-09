'use client'

import { useState } from 'react'
import { formatPrice, getBestPrice, getPricingSummary } from '@/lib/pricing-service'

export default function PriceDisplay({ 
  pricing, 
  foil = false, 
  variant = 'default', 
  currency = 'usd',
  className = '',
  showAllPrices = false 
}) {
  const [showDetails, setShowDetails] = useState(false)

  if (!pricing) {
    return variant === 'compact' ? null : (
      <div className={`text-sm text-gray-400 ${className}`}>
        Price unavailable
      </div>
    )
  }

  const summary = getPricingSummary(pricing, currency)
  
  if (!summary?.hasPrice) {
    return variant === 'compact' ? null : (
      <div className={`text-sm text-gray-400 ${className}`}>
        Price unavailable
      </div>
    )
  }

  const bestPrice = getBestPrice(pricing, foil, currency)
  const currencySymbol = currency.toUpperCase()

  // Compact variant for search results and lists
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {bestPrice && (
          <span className="text-sm font-semibold text-green-600">
            {formatPrice(bestPrice.price, currency)}
          </span>
        )}
        {foil && bestPrice?.type !== 'nonfoil' && (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">
            ✨ Foil
          </span>
        )}
      </div>
    )
  }

  // Price badge variant for minimal display
  if (variant === 'badge') {
    return bestPrice ? (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-green-50 text-green-700 border border-green-200 ${className}`}>
        💰 {formatPrice(bestPrice.price, currency)}
      </span>
    ) : null
  }

  // Default detailed variant
  return (
    <div className={`bg-gray-50 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-700">Market Price</h4>
        {(summary.nonfoil || summary.foil || summary.etched) && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {showDetails ? 'Hide Details' : 'Show All Prices'}
          </button>
        )}
      </div>
      
      {/* Primary price display */}
      <div className="mb-3">
        {bestPrice ? (
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-green-600">
              {formatPrice(bestPrice.price, currency)}
            </span>
            {bestPrice.type !== 'nonfoil' && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                {bestPrice.type === 'foil' ? '✨ Foil' : '🎭 Etched'}
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-500">Price not available</span>
        )}
      </div>

      {/* Price range indicator */}
      {summary.lowest !== summary.highest && (
        <div className="mb-2 text-xs text-gray-600">
          Range: {formatPrice(summary.lowest, currency)} - {formatPrice(summary.highest, currency)}
        </div>
      )}

      {/* Detailed price breakdown */}
      {showDetails && (
        <div className="border-t pt-2 mt-2 space-y-1">
          {summary.nonfoil && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Non-foil:</span>
              <span className="font-medium">{formatPrice(summary.nonfoil, currency)}</span>
            </div>
          )}
          {summary.foil && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 flex items-center gap-1">
                <span>✨</span> Foil:
              </span>
              <span className="font-medium">{formatPrice(summary.foil, currency)}</span>
            </div>
          )}
          {summary.etched && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 flex items-center gap-1">
                <span>🎭</span> Etched:
              </span>
              <span className="font-medium">{formatPrice(summary.etched, currency)}</span>
            </div>
          )}
          {pricing.tix && (
            <div className="flex justify-between items-center text-sm border-t pt-1">
              <span className="text-gray-600">MTGO (TIX):</span>
              <span className="font-medium">{pricing.tix}</span>
            </div>
          )}
        </div>
      )}

      {/* Purchase links */}
      {pricing.purchase_uris && (
        <div className="mt-3 pt-2 border-t">
          <div className="flex gap-2 text-xs">
            {pricing.purchase_uris.tcgplayer && (
              <a 
                href={pricing.purchase_uris.tcgplayer}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                TCGPlayer
              </a>
            )}
            {pricing.purchase_uris.cardmarket && (
              <a 
                href={pricing.purchase_uris.cardmarket}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Cardmarket
              </a>
            )}
            {pricing.purchase_uris.cardhoarder && (
              <a 
                href={pricing.purchase_uris.cardhoarder}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Cardhoarder
              </a>
            )}
          </div>
        </div>
      )}

      {/* Last updated */}
      {pricing.last_updated && (
        <div className="text-xs text-gray-500 mt-2">
          Prices updated: {new Date(pricing.last_updated).toLocaleDateString()}
        </div>
      )}
    </div>
  )
}

// Price trend indicator component
export function PriceTrendIndicator({ trend, className = '' }) {
  if (!trend || trend === 0) return null
  
  const isPositive = trend > 0
  const percentage = Math.abs(trend * 100).toFixed(1)
  
  return (
    <span className={`inline-flex items-center text-xs font-medium ${
      isPositive ? 'text-green-600' : 'text-red-600'
    } ${className}`}>
      <span className="mr-1">
        {isPositive ? '↗️' : '↘️'}
      </span>
      {percentage}%
    </span>
  )
}

// Collection value summary component
export function CollectionValueSummary({ value, className = '' }) {
  if (!value || value.total === 0) {
    return (
      <div className={`text-center py-4 text-gray-500 ${className}`}>
        <div className="text-2xl mb-1">💰</div>
        <div>No collection value calculated</div>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200 ${className}`}>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-700 mb-1">
          {formatPrice(value.total, value.currency.toLowerCase())}
        </div>
        <div className="text-sm text-gray-600 mb-3">
          Total Collection Value ({value.cards} cards)
        </div>
        
        {(value.breakdown.foil > 0 || value.breakdown.nonfoil > 0) && (
          <div className="grid grid-cols-2 gap-3 text-xs">
            {value.breakdown.nonfoil > 0 && (
              <div className="bg-white rounded-lg p-2 border">
                <div className="font-semibold text-gray-700">Non-foil</div>
                <div className="text-green-600">
                  {formatPrice(value.breakdown.nonfoil, value.currency.toLowerCase())}
                </div>
              </div>
            )}
            {value.breakdown.foil > 0 && (
              <div className="bg-white rounded-lg p-2 border border-yellow-200">
                <div className="font-semibold text-gray-700">✨ Foil</div>
                <div className="text-yellow-600">
                  {formatPrice(value.breakdown.foil, value.currency.toLowerCase())}
                </div>
              </div>
            )}
          </div>
        )}
        
        {value.breakdown.unknown > 0 && (
          <div className="text-xs text-gray-500 mt-2">
            {value.breakdown.unknown} cards without pricing data
          </div>
        )}
      </div>
    </div>
  )
}
