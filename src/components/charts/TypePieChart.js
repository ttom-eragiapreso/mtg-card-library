'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { useMemo } from 'react'

export default function TypePieChart({ typeDistribution }) {
  const data = useMemo(() => {
    // Card type color mapping
    const typeMap = {
      creature: { name: 'Creatures', color: '#10B981' },
      instant: { name: 'Instants', color: '#3B82F6' },
      sorcery: { name: 'Sorceries', color: '#8B5CF6' },
      artifact: { name: 'Artifacts', color: '#6B7280' },
      enchantment: { name: 'Enchantments', color: '#F59E0B' },
      planeswalker: { name: 'Planeswalkers', color: '#EF4444' },
      land: { name: 'Lands', color: '#84CC16' },
      other: { name: 'Other', color: '#64748B' }
    }

    const totalCards = Object.values(typeDistribution).reduce((sum, count) => sum + count, 0)

    return Object.entries(typeDistribution)
      .filter(([_, count]) => count > 0)
      .map(([typeKey, count]) => ({
        name: typeMap[typeKey]?.name || typeKey,
        value: count,
        percentage: totalCards > 0 ? (count / totalCards) * 100 : 0,
        color: typeMap[typeKey]?.color || '#64748B'
      }))
      .sort((a, b) => b.value - a.value)
  }, [typeDistribution])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No card type data available
      </div>
    )
  }


  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, percentage }) => {
    if (percentage < 10) return null // Only show labels for slices > 10%
    
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
            formatter={(value, name) => [`${value} cards (${data.find(d => d.name === name)?.percentage?.toFixed(1) || 0}%)`, name]}
            labelStyle={{ color: '#374151' }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
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
