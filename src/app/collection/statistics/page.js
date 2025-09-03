'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { getUserCollection } from '@/lib/collection-actions'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import {
  ChartBarIcon,
  ChartPieIcon,
  SparklesIcon,
  CubeIcon,
  PaintBrushIcon,
  ArchiveBoxIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'
import ColorPieChart from '@/components/charts/ColorPieChart'
import TypePieChart from '@/components/charts/TypePieChart'
import ManaCurveChart from '@/components/charts/ManaCurveChart'

export default function CollectionStatisticsPage() {
  const { data: session, status } = useSession()
  const [collection, setCollection] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [statistics, setStatistics] = useState(null)

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

  // Load collection data
  useEffect(() => {
    const loadCollection = async () => {
      if (!session) return

      setIsLoading(true)
      try {
        const result = await getUserCollection()
        if (result.success) {
          setCollection(result.collection)
          calculateStatistics(result.collection)
        } else {
          setError(result.error || 'Failed to load collection')
        }
      } catch (error) {
        console.error('Error loading collection:', error)
        setError('Failed to load collection')
      } finally {
        setIsLoading(false)
      }
    }

    loadCollection()
  }, [session])

  const calculateStatistics = (cards) => {
    if (!cards || cards.length === 0) {
      setStatistics(null)
      return
    }

    // Basic stats
    const totalCards = cards.length
    const uniqueCards = new Set(cards.map(card => card.name)).size

    // Set distribution
    const setDistribution = {}
    const setInfo = {} // Store both code and full name
    cards.forEach(card => {
      const setCode = card.set || 'Unknown'
      const setName = card.setName || setCode
      
      setDistribution[setCode] = (setDistribution[setCode] || 0) + 1
      setInfo[setCode] = {
        code: setCode,
        name: setName,
        count: setDistribution[setCode]
      }
    })

    // Color distribution
    const colorDistribution = {
      W: 0, U: 0, B: 0, R: 0, G: 0, C: 0
    }
    cards.forEach(card => {
      const colors = card.colors || []
      if (colors.length === 0) {
        colorDistribution.C += 1
      } else if (colors.length === 1) {
        if (Object.prototype.hasOwnProperty.call(colorDistribution, colors[0])) {
          colorDistribution[colors[0]] += 1
        }
      } else {
        // For multicolor cards, we could count them separately
        // For now, let's count them based on their primary color
        colors.forEach(color => {
          if (Object.prototype.hasOwnProperty.call(colorDistribution, color)) {
            colorDistribution[color] += 0.5 // Split between colors
          }
        })
      }
    })

    // Type distribution
    const typeDistribution = {
      creature: 0,
      instant: 0,
      sorcery: 0,
      artifact: 0,
      enchantment: 0,
      planeswalker: 0,
      land: 0,
      other: 0
    }

    cards.forEach(card => {
      const types = card.types || []
      let counted = false
      
      for (const type of ['creature', 'instant', 'sorcery', 'artifact', 'enchantment', 'planeswalker', 'land']) {
        if (types.some(cardType => cardType.toLowerCase() === type)) {
          typeDistribution[type] += 1
          counted = true
          break
        }
      }
      
      if (!counted) {
        typeDistribution.other += 1
      }
    })

    // Rarity distribution
    const rarityDistribution = {}
    cards.forEach(card => {
      const rarity = card.rarity || 'Unknown'
      rarityDistribution[rarity] = (rarityDistribution[rarity] || 0) + 1
    })

    // Mana curve
    const manaCurve = {}
    for (let i = 0; i <= 10; i++) {
      manaCurve[i] = 0
    }

    cards.forEach(card => {
      if (card.types && card.types.includes('Land')) return // Skip lands
      const cmc = parseInt(card.cmc) || 0
      const cmcGroup = cmc > 10 ? 10 : cmc
      manaCurve[cmcGroup] += 1
    })

    // Average CMC (excluding lands)
    const nonLandCards = cards.filter(card => !card.types?.includes('Land'))
    const totalCmc = nonLandCards.reduce((sum, card) => sum + (parseInt(card.cmc) || 0), 0)
    const averageCmc = nonLandCards.length > 0 ? (totalCmc / nonLandCards.length).toFixed(2) : 0

    // Most expensive cards (by CMC)
    const expensiveCards = cards
      .filter(card => !card.types?.includes('Land'))
      .sort((a, b) => (parseInt(b.cmc) || 0) - (parseInt(a.cmc) || 0))
      .slice(0, 5)

    // Most common sets with full names
    const topSets = Object.entries(setDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([setCode, count]) => ({
        code: setCode,
        name: setInfo[setCode]?.name || setCode,
        count
      }))

    // Color percentages
    const colorPercentages = {}
    const totalColoredCards = Object.values(colorDistribution).reduce((sum, count) => sum + count, 0)
    
    Object.keys(colorDistribution).forEach(color => {
      colorPercentages[color] = totalColoredCards > 0 
        ? (colorDistribution[color] / totalColoredCards * 100).toFixed(1)
        : 0
    })

    setStatistics({
      totalCards,
      uniqueCards,
      setDistribution,
      colorDistribution,
      colorPercentages,
      typeDistribution,
      rarityDistribution,
      manaCurve,
      averageCmc: parseFloat(averageCmc),
      expensiveCards,
      topSets
    })
  }

  const getRarityColor = (rarity) => {
    switch (rarity?.toLowerCase()) {
      case 'common': return 'text-gray-600 bg-gray-100'
      case 'uncommon': return 'text-gray-700 bg-gray-200'
      case 'rare': return 'text-yellow-700 bg-yellow-100'
      case 'mythic rare': return 'text-orange-700 bg-orange-100'
      default: return 'text-gray-500 bg-gray-50'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="loading loading-spinner loading-lg mb-4"></div>
              <p className="text-gray-600">Loading collection statistics...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !statistics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'No collection data available'}
            </h3>
            <p className="text-gray-600 mb-6">
              {error ? 'There was an error loading your collection statistics.' : 'Add some cards to your collection to see statistics here.'}
            </p>
            <Link
              href="/collection"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back to Collection
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="text-sm text-gray-500">
            <Link href="/collection" className="hover:text-gray-700">Collection</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Statistics</span>
          </nav>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <ChartBarIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Collection Statistics</h1>
          </div>
          <p className="text-gray-600">
            Comprehensive insights and analytics for your MTG card collection
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cards</p>
                <p className="text-3xl font-bold text-blue-600">{statistics.totalCards}</p>
              </div>
              <CubeIcon className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Cards</p>
                <p className="text-3xl font-bold text-purple-600">{statistics.uniqueCards}</p>
              </div>
              <SparklesIcon className="w-12 h-12 text-purple-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average CMC</p>
                <p className="text-3xl font-bold text-green-600">{statistics.averageCmc}</p>
              </div>
              <ArchiveBoxIcon className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Different Sets</p>
                <p className="text-3xl font-bold text-orange-600">{Object.keys(statistics.setDistribution).length}</p>
              </div>
              <CalendarDaysIcon className="w-12 h-12 text-orange-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Color Distribution */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <PaintBrushIcon className="w-6 h-6 text-gray-600" />
              <h3 className="text-xl font-bold text-gray-900">Color Distribution</h3>
            </div>
            <div className="h-64">
              <ColorPieChart 
                colorDistribution={statistics.colorDistribution} 
                colorPercentages={statistics.colorPercentages}
              />
            </div>
          </div>

          {/* Type Distribution */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <ChartPieIcon className="w-6 h-6 text-gray-600" />
              <h3 className="text-xl font-bold text-gray-900">Card Types</h3>
            </div>
            <div className="h-64">
              <TypePieChart typeDistribution={statistics.typeDistribution} />
            </div>
          </div>
        </div>

        {/* Mana Curve */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <ChartBarIcon className="w-6 h-6 text-gray-600" />
            <h3 className="text-xl font-bold text-gray-900">Mana Curve</h3>
          </div>
          <div className="h-64">
            <ManaCurveChart manaCurve={statistics.manaCurve} />
          </div>
        </div>

        {/* Detailed Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Rarity Breakdown */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrophyIcon className="w-6 h-6 text-gray-600" />
              <h3 className="text-xl font-bold text-gray-900">Rarity Breakdown</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(statistics.rarityDistribution)
                .sort(([,a], [,b]) => b - a)
                .map(([rarity, count]) => (
                <div key={rarity} className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRarityColor(rarity)}`}>
                    {rarity}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                      {((count / statistics.totalCards) * 100).toFixed(1)}%
                    </span>
                    <span className="text-lg font-semibold text-gray-900">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Sets */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <ArchiveBoxIcon className="w-6 h-6 text-gray-600" />
              <h3 className="text-xl font-bold text-gray-900">Most Common Sets</h3>
            </div>
            <div className="space-y-3">
              {statistics.topSets.map((setData) => (
                <div key={setData.code} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {setData.name}
                    </div>
                    {setData.name !== setData.code && (
                      <div className="text-xs text-gray-500">
                        {setData.code}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm text-gray-600">
                      {((setData.count / statistics.totalCards) * 100).toFixed(1)}%
                    </span>
                    <span className="text-lg font-semibold text-gray-900">
                      {setData.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Highest CMC Cards */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <CurrencyDollarIcon className="w-6 h-6 text-gray-600" />
            <h3 className="text-xl font-bold text-gray-900">Highest Cost Cards</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {statistics.expensiveCards.map((card, index) => (
              <div key={`${card.name}-${index}`} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate" title={card.name}>
                  {card.name}
                </h4>
                <p className="text-xs text-gray-600 mb-2">{card.set}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{card.type}</span>
                  <span className="text-lg font-bold text-blue-600">
                    {card.cmc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
