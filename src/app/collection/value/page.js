import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { 
  getCollectionValue, 
  getCollectionPricingStats, 
  getTopValuedCards 
} from '@/lib/pricing-actions'
import { CollectionValueSummary, PriceTrendIndicator } from '@/components/PriceDisplay'
import PricingStatsCard from '@/components/PricingStatsCard'
import TopValuedCardsGrid from '@/components/TopValuedCardsGrid'
import PricingControls from '@/components/PricingControls'
import CollectionValueQuickActions from '@/components/CollectionValueQuickActions'
import Navigation from '@/components/Navigation'

export default async function CollectionValuePage({ searchParams }) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/api/auth/signin')
  }

  const searchParamsData = await searchParams;
  const currency = searchParamsData?.currency || 'usd'

  // Fetch all pricing data
  const [valueResult, statsResult, topCardsResult] = await Promise.all([
    getCollectionValue(currency),
    getCollectionPricingStats(),
    getTopValuedCards(currency, 15)
  ])

  if (!valueResult.success || !statsResult.success || !topCardsResult.success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="text-center py-8 sm:py-12">
          <div className="text-red-600 text-base sm:text-lg mb-4">Error loading collection data</div>
          <p className="text-sm sm:text-base text-gray-600 px-4">
            {valueResult.error || statsResult.error || topCardsResult.error}
          </p>
          </div>
        </div>
      </div>
    )
  }

  const { value } = valueResult
  const { stats } = statsResult
  const { cards: topCards } = topCardsResult

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Collection Value</h1>
          <p className="text-sm sm:text-base text-gray-600">Track your collection's market value and pricing trends</p>
        </div>
        
        <div className="flex justify-center sm:justify-end">
          <PricingControls currency={currency} />
        </div>
      </div>

      {/* Collection Value Summary */}
      <div className="mb-6 sm:mb-8">
        <CollectionValueSummary value={value} />
      </div>

      {/* Pricing Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <PricingStatsCard 
          title="Pricing Coverage"
          value={`${stats.pricingCoverage}%`}
          subtitle={`${stats.cardsWithPricing} of ${stats.totalCards} cards`}
          icon="📊"
        />
        
        <PricingStatsCard 
          title="Stale Pricing"
          value={stats.stalePricing}
          subtitle={stats.stalePricing > 0 ? "cards need price updates" : "all prices current"}
          icon={stats.stalePricing > 0 ? "⚠️" : "✅"}
          variant={stats.stalePricing > 0 ? "warning" : "success"}
        />
        
        <PricingStatsCard 
          title="Last Updated"
          value={stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleDateString() : 'Never'}
          subtitle={stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString() : 'No pricing data'}
          icon="🕐"
        />
      </div>

      {/* Top Valued Cards */}
      {topCards.length > 0 && (
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
            <span className="text-lg sm:text-xl">💎</span>
            <span className="text-center sm:text-left">Most Valuable Cards</span>
          </h2>
          <TopValuedCardsGrid cards={topCards} currency={currency} />
        </div>
      )}

      {/* Quick Actions */}
      <CollectionValueQuickActions />

      {/* Pricing Disclaimer */}
      <div className="mt-6 sm:mt-8 bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
        <p className="text-xs sm:text-sm text-gray-600 text-center leading-relaxed">
          <strong>Disclaimer:</strong> Prices are sourced from Scryfall and major retailers. 
          Market values fluctuate and actual selling prices may vary. 
          Pricing data is provided for informational purposes only.
        </p>
        </div>
      </div>
    </div>
  )
}
