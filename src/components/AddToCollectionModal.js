'use client'

import { useState } from 'react'
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline'
import Input from './ui/Input'
import Select from './ui/Select'
import Textarea from './ui/Textarea'

export default function AddToCollectionModal({ 
  card, 
  isOpen, 
  onClose, 
  onConfirm, 
  isAdding = false 
}) {
  const [quantity, setQuantity] = useState(1)
  const [condition, setCondition] = useState('near_mint')
  const [foil, setFoil] = useState(false)
  const [language, setLanguage] = useState('English')
  const [notes, setNotes] = useState('')
  const [acquiredPrice, setAcquiredPrice] = useState('')

  const conditions = [
    { value: 'mint', label: 'Mint (M)' },
    { value: 'near_mint', label: 'Near Mint (NM)' },
    { value: 'excellent', label: 'Excellent (EX)' },
    { value: 'good', label: 'Good (GD)' },
    { value: 'light_played', label: 'Light Played (LP)' },
    { value: 'played', label: 'Played (PL)' },
    { value: 'poor', label: 'Poor (PR)' }
  ]

  const handleConfirm = () => {
    const collectionData = {
      quantity: parseInt(quantity),
      condition,
      foil,
      language,
      notes: notes.trim(),
      acquiredPrice: acquiredPrice ? parseFloat(acquiredPrice) : undefined,
      acquiredDate: new Date()
    }
    
    onConfirm(card, collectionData)
  }

  const handleReset = () => {
    setQuantity(1)
    setCondition('near_mint')
    setFoil(false)
    setLanguage('English')
    setNotes('')
    setAcquiredPrice('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900">
            Add to Collection
          </h3>
          <button 
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={onClose}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Card Info Header */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-20 bg-gray-200 rounded-lg overflow-hidden">
                {card.imageUrl ? (
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                    No Image
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-lg mb-1">{card.name}</h4>
                <p className="text-gray-700 text-sm mb-1">{card.type}</p>
                <div className="flex items-center gap-3 text-sm">
                  <span className="px-2 py-1 bg-white text-gray-800 rounded-md font-medium">
                    {card.set}
                  </span>
                  <span className="text-gray-600">{card.setName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Collection Details Form */}
          <div className="space-y-6">
            {/* Quantity and Foil Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <Input
                  type="number"
                  min="1"
                  max="99"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="flex items-end">
                <label className="flex items-center space-x-3 cursor-pointer bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg px-4 py-3 hover:from-yellow-100 hover:to-amber-100 transition-colors w-full">
                  <input
                    type="checkbox"
                    checked={foil}
                    onChange={(e) => setFoil(e.target.checked)}
                    className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                  />
                  <SparklesIcon className={`w-5 h-5 ${foil ? 'text-yellow-600' : 'text-gray-400'}`} />
                  <span className={`font-medium ${foil ? 'text-yellow-800' : 'text-gray-700'}`}>
                    Foil
                  </span>
                </label>
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition
              </label>
              <Select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full"
              >
                {conditions.map(cond => (
                  <option key={cond.value} value={cond.value}>
                    {cond.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <Select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Italian">Italian</option>
                <option value="Portuguese">Portuguese</option>
                <option value="Japanese">Japanese</option>
                <option value="Chinese Simplified">Chinese Simplified</option>
                <option value="Chinese Traditional">Chinese Traditional</option>
                <option value="Korean">Korean</option>
                <option value="Russian">Russian</option>
              </Select>
            </div>

            {/* Acquired Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Acquired Price (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={acquiredPrice}
                  onChange={(e) => setAcquiredPrice(e.target.value)}
                  className="w-full pl-8"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <Textarea
                rows="3"
                placeholder="Add any notes about this card..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full resize-none"
              />
            </div>
          </div>
        </div>
        
        {/* Modal Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            onClick={handleReset}
          >
            Reset
          </button>
          
          <div className="flex items-center space-x-3">
            <button 
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              onClick={onClose}
              disabled={isAdding}
            >
              Cancel
            </button>
            <button 
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
              onClick={handleConfirm}
              disabled={isAdding}
            >
              {isAdding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <span>Add to Collection</span>
                  {foil && <SparklesIcon className="w-4 h-4 text-yellow-300" />}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
