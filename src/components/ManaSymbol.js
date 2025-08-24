'use client'

export default function ManaSymbol({ symbol, size = 'sm' }) {
  const sizeClasses = {
    xs: 'w-3 h-3 text-xs',
    sm: 'w-4 h-4 text-xs',
    md: 'w-6 h-6 text-sm',
    lg: 'w-8 h-8 text-base'
  }

  const getSymbolStyle = (symbol) => {
    // Convert symbol to uppercase for consistency
    const sym = symbol.toUpperCase()
    
    // Colored mana
    if (sym === 'W') return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    if (sym === 'U') return 'bg-blue-500 text-white'
    if (sym === 'B') return 'bg-gray-800 text-white'
    if (sym === 'R') return 'bg-red-500 text-white'
    if (sym === 'G') return 'bg-green-500 text-white'
    
    // Hybrid mana (simplified - would need more complex logic for actual hybrid symbols)
    if (sym.includes('/')) return 'bg-gradient-to-r from-red-500 to-blue-500 text-white'
    
    // Generic/colorless mana (numbers)
    if (!isNaN(sym)) return 'bg-gray-300 text-gray-700 border border-gray-400'
    
    // Special symbols
    if (sym === 'X') return 'bg-gray-300 text-gray-700 border border-gray-400'
    if (sym === 'C') return 'bg-gray-200 text-gray-600 border border-gray-300'
    
    // Default
    return 'bg-gray-300 text-gray-700'
  }

  const baseClasses = `inline-flex items-center justify-center rounded-full font-bold ${sizeClasses[size]}`
  const symbolClasses = getSymbolStyle(symbol)

  return (
    <span 
      className={`${baseClasses} ${symbolClasses}`}
      title={`Mana symbol: ${symbol}`}
    >
      {symbol}
    </span>
  )
}
