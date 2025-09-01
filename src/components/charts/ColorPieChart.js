'use client'

import { useMemo } from 'react'

export default function ColorPieChart({ colorDistribution, colorPercentages }) {
  const colors = useMemo(() => {
    // MTG color mapping with actual Magic colors
    const colorMap = {
      W: { name: 'White', color: '#FFFBD5', stroke: '#FFF2A0' },
      U: { name: 'Blue', color: '#0E68AB', stroke: '#0A5A9A' },
      B: { name: 'Black', color: '#150B00', stroke: '#2A1500' },
      R: { name: 'Red', color: '#D3202A', stroke: '#B91C1C' },
      G: { name: 'Green', color: '#00733E', stroke: '#065F46' },
      C: { name: 'Colorless', color: '#CCCCCC', stroke: '#9CA3AF' }
    }

    return Object.entries(colorDistribution)
      .filter(([_, count]) => count > 0)
      .map(([colorKey, count]) => ({
        key: colorKey,
        name: colorMap[colorKey]?.name || colorKey,
        color: colorMap[colorKey]?.color || '#CCCCCC',
        stroke: colorMap[colorKey]?.stroke || '#9CA3AF',
        count,
        percentage: parseFloat(colorPercentages[colorKey] || 0)
      }))
      .sort((a, b) => b.count - a.count)
  }, [colorDistribution, colorPercentages])

  if (colors.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No color data available
      </div>
    )
  }

  // Calculate angles for pie slices
  let cumulativeAngle = 0
  const slices = colors.map(color => {
    const startAngle = cumulativeAngle
    const angle = (color.percentage / 100) * 360
    cumulativeAngle += angle
    
    return {
      ...color,
      startAngle,
      angle,
      endAngle: startAngle + angle
    }
  })

  // Helper function to create SVG path for pie slice
  const createArcPath = (centerX, centerY, radius, startAngle, endAngle) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle)
    const end = polarToCartesian(centerX, centerY, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

    return [
      'M', centerX, centerY,
      'L', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'Z'
    ].join(' ')
  }

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    }
  }

  const size = 160
  const center = size / 2
  const radius = size / 2 - 10

  return (
    <div className="w-full h-full flex items-center">
      {/* Pie Chart */}
      <div className="flex-1 flex justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices.map((slice, index) => (
            <g key={slice.key}>
              <path
                d={createArcPath(center, center, radius, slice.startAngle, slice.endAngle)}
                fill={slice.color}
                stroke={slice.stroke}
                strokeWidth="2"
                className="transition-all duration-200 hover:brightness-110"
              />
              {/* Add percentage label for larger slices */}
              {slice.percentage >= 10 && (
                <text
                  x={center + (radius * 0.6 * Math.cos((slice.startAngle + slice.angle/2 - 90) * Math.PI / 180))}
                  y={center + (radius * 0.6 * Math.sin((slice.startAngle + slice.angle/2 - 90) * Math.PI / 180))}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-xs font-semibold fill-white"
                  style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.5)' }}
                >
                  {slice.percentage.toFixed(0)}%
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex-1 pl-4">
        <div className="space-y-2">
          {slices.map((slice) => (
            <div key={slice.key} className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-sm border-2"
                style={{
                  backgroundColor: slice.color,
                  borderColor: slice.stroke
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {slice.name}
                </div>
                <div className="text-xs text-gray-600">
                  {slice.count} cards ({slice.percentage.toFixed(1)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
