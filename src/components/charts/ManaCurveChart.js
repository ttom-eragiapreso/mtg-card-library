'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function ManaCurveChart({ manaCurve, onCmcClick }) {
  if (!manaCurve || Object.keys(manaCurve).length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No mana curve data available
      </div>
    )
  }

  // Create array of CMC values from 0 to 10+ with their counts
  const data = []
  for (let i = 0; i <= 10; i++) {
    const count = manaCurve[i] || 0
    if (i <= 9 || count > 0) { // Only show 10+ if there are cards
      data.push({
        cmc: i === 10 ? '10+' : i.toString(),
        count: count,
        fill: count > 0 ? '#3B82F6' : '#E5E7EB'
      })
    }
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const count = payload[0].value
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">
            CMC {label}: <span className="text-blue-600">{count} cards</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-full">
      <style>{`
        .recharts-wrapper {
          outline: none !important;
        }
        .recharts-wrapper * {
          outline: none !important;
        }
        .recharts-rectangle {
          outline: none !important;
        }
        .recharts-rectangle:focus {
          outline: none !important;
        }
      `}</style>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 10,
            left: 10,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="cmc" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6B7280' }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="count" 
            radius={[2, 2, 0, 0]}
            fill="#3B82F6"
            style={{ cursor: onCmcClick ? 'pointer' : 'default' }}
            onClick={(data, index) => {
              if (onCmcClick && data && data.payload) {
                const cmcValue = data.payload.cmc === '10+' ? 10 : parseInt(data.payload.cmc)
                onCmcClick(cmcValue, data.payload.cmc, data.payload.count)
              }
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
