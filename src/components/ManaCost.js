'use client'

import ManaSymbol from './ManaSymbol'
import { parseManaSymbols } from '@/lib/mtg-api'

export default function ManaCost({ manaCost, size = 'sm', className = '' }) {
  if (!manaCost) return null

  const symbols = parseManaSymbols(manaCost)
  
  if (symbols.length === 0) return null

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {symbols.map((symbol, index) => (
        <ManaSymbol 
          key={`${symbol}-${index}`} 
          symbol={symbol} 
          size={size}
        />
      ))}
    </div>
  )
}
