'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { useMemo } from 'react'

export default function ColorPieChart({ colorDistribution, colorPercentages }) {
  const data = useMemo(() => {
    // MTG color mapping with authentic Magic colors
    const colorMap = {
      W: { name: 'White', color: '#FFFBD5' }, // Pale cream like Plains
      U: { name: 'Blue', color: '#0E68AB' }, // Deep blue like Islands
      B: { name: 'Black', color: '#2C1810' }, // Dark brown-black like Swamps
      R: { name: 'Red', color: '#D3202A' }, // Fiery red like Mountains
      G: { name: 'Green', color: '#196834' }, // Forest green like Forests
      C: { name: 'Colorless', color: '#D1D5DB' } // Light gray for artifacts
    }

    return Object.entries(colorDistribution)
      .filter(([_, count]) => count > 0)
      .map(([colorKey, count]) => ({
        name: colorMap[colorKey]?.name || colorKey,
        value: count,
        percentage: parseFloat(colorPercentages[colorKey] || 0),
        color: colorMap[colorKey]?.color || '#9CA3AF'
      }))
      .sort((a, b) => b.value - a.value)
  }, [colorDistribution, colorPercentages])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No color data available
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">
            {data.name}: <span className="font-bold">{data.value} cards</span>
          </p>
          <p className="text-xs text-gray-600">
            {data.percentage.toFixed(1)}% of deck
          </p>
        </div>
      )
    }
    return null
  }

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, percentage }) => {
    if (percentage < 8) return null // Only show labels for slices > 8%
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-semibold"
        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
      >
        {`${percentage.toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="w-full h-full chart-container" style={{ userSelect: 'none' }}>
      <style>{`
        .chart-container .recharts-wrapper {
          outline: none !important;
        }
        .chart-container .recharts-wrapper * {
          outline: none !important;
        }
        .chart-container .recharts-pie-sector {
          outline: none !important;
        }
        .chart-container .recharts-pie-sector:focus {
          outline: none !important;
        }
      `}</style>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={70}
            fill="#8884d8"
            dataKey="value"
            stroke="#fff"
            strokeWidth={2}
            style={{ outline: 'none' }}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                style={{ outline: 'none' }}
              />
            ))}
          </Pie>
          <Tooltip 
            content={<CustomTooltip />}
            position={{ x: undefined, y: undefined }}
            allowEscapeViewBox={{ x: false, y: false }}
            offset={10}
          />
          <Legend 
            verticalAlign="middle" 
            align="right"
            layout="vertical"
            iconType="circle"
            wrapperStyle={{ 
              paddingLeft: '20px',
              fontSize: '12px',
              lineHeight: '20px'
            }}
            formatter={(value, entry) => (
              <span style={{ color: '#374151' }}>
                {value} ({entry.payload.value})
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
