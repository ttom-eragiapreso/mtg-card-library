'use client'

export default function ManaCurveChart({ manaCurve }) {
  if (!manaCurve || Object.keys(manaCurve).length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No mana curve data available
      </div>
    )
  }

  // Get the maximum count for scaling
  const maxCount = Math.max(...Object.values(manaCurve))
  
  // Create array of CMC values from 0 to 10+ with their counts
  const cmcData = []
  for (let i = 0; i <= 10; i++) {
    cmcData.push({
      cmc: i === 10 ? '10+' : i.toString(),
      count: manaCurve[i] || 0
    })
  }

  return (
    <div className="w-full h-full flex items-end justify-between gap-1 px-2 py-4">
      {cmcData.map(({ cmc, count }) => {
        const heightPercent = maxCount > 0 ? (count / maxCount) * 100 : 0
        const hasCount = count > 0
        
        return (
          <div key={cmc} className="flex flex-col items-center flex-1 min-w-0">
            {/* Bar */}
            <div className="relative w-full flex flex-col justify-end" style={{ height: '140px' }}>
              {hasCount && (
                <>
                  {/* Count label on top of bar */}
                  <div className="text-center text-xs font-semibold text-gray-700 mb-1">
                    {count}
                  </div>
                  {/* Bar */}
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm transition-all duration-300 hover:from-blue-600 hover:to-blue-500"
                    style={{ 
                      height: `${Math.max(heightPercent, 8)}%`, // Minimum height for visibility
                      minHeight: hasCount ? '8px' : '0px'
                    }}
                  />
                </>
              )}
            </div>
            
            {/* CMC Label */}
            <div className="text-xs font-medium text-gray-600 mt-2 text-center">
              {cmc}
            </div>
          </div>
        )
      })}
    </div>
  )
}
