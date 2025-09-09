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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg mb-4">Error loading collection data</div>
          <p className="text-gray-600">
            {valueResult.error || statsResult.error || topCardsResult.error}
          </p>
        </div>
      </div>
    )
  }

  const { value } = valueResult
  const { stats } = statsResult
  const { cards: topCards } = topCardsResult

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Collection Value</h1>
          <p className="text-gray-600">Track your collection's market value and pricing trends</p>
        </div>
        
        <PricingControls currency={currency} />
      </div>

      {/* Collection Value Summary */}
      <div className="mb-8">
        <CollectionValueSummary value={value} />
      </div>

      {/* Pricing Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span>💎</span>
            Most Valuable Cards
          </h2>
          <TopValuedCardsGrid cards={topCards} currency={currency} />
        </div>
      )}

      {/* Quick Actions */}
      <CollectionValueQuickActions />

      {/* Pricing Disclaimer */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-xs text-gray-600 text-center">
          <strong>Disclaimer:</strong> Prices are sourced from Scryfall and major retailers. 
          Market values fluctuate and actual selling prices may vary. 
          Pricing data is provided for informational purposes only.
        </p>
      </div>
    </div>
  )
}
