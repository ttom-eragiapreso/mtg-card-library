'use client'

import { useEffect, useState } from 'react'

export default function PricingProgressModal({ 
  isOpen, 
  onClose, 
  onStart,
  title = "Updating Collection Prices"
}) {
  const [progress, setProgress] = useState({ progress: 0, message: 'Initializing...', stage: 'idle' })
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState(null)
  const [canClose, setCanClose] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setProgress({ progress: 0, message: 'Initializing...', stage: 'idle' })
      setIsProcessing(false)
      setResults(null)
      setCanClose(false)
    }
  }, [isOpen])

  const handleStart = async () => {
    if (isProcessing) return
    
    setIsProcessing(true)
    setCanClose(false)
    setProgress({ progress: 0, message: 'Starting price updates...', stage: 'initializing' })
    
    try {
      const result = await onStart((progressData) => {
        setProgress(progressData)
      })
      
      setResults(result)
      if (result.success) {
        setProgress(prev => ({ 
          ...prev, 
          stage: 'complete',
          progress: 100
        }))
      } else {
        setProgress({
          stage: 'error',
          message: result.error || 'Update failed',
          progress: 0
        })
      }
    } catch (error) {
      setProgress({
        stage: 'error',
        message: error.message || 'An unexpected error occurred',
        progress: 0
      })
      setResults({ success: false, error: error.message })
    } finally {
      setIsProcessing(false)
      setCanClose(true)
    }
  }

  const handleClose = () => {
    if (!canClose && isProcessing) {
      // Show confirmation if trying to close during processing
      if (!window.confirm('Pricing update is in progress. Are you sure you want to close? This may interrupt the update.')) {
        return
      }
    }
    
    onClose()
  }

  const getStageIcon = (stage) => {
    switch (stage) {
      case 'initializing': return '🚀'
      case 'analyzing': return '🔍'
      case 'fetching': return '📡'
      case 'updating': return '💾'
      case 'finalizing': return '✨'
      case 'complete': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      default: return '⏳'
    }
  }

  const getProgressBarColor = () => {
    switch (progress.stage) {
      case 'complete': return 'progress-success'
      case 'error': return 'progress-error'
      case 'warning': return 'progress-warning'
      default: return 'progress-primary'
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl">{title}</h3>
          <button 
            className={`btn btn-sm btn-circle btn-ghost ${!canClose && isProcessing ? 'opacity-50' : ''}`}
            onClick={handleClose}
            disabled={!canClose && isProcessing}
          >
            ✕
          </button>
        </div>

        {/* Progress Section */}
        <div className="space-y-6">
          {/* Current Status */}
          <div className="bg-base-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{getStageIcon(progress.stage)}</span>
              <div className="flex-1">
                <div className="font-semibold text-lg capitalize">
                  {progress.stage === 'idle' ? 'Ready to Start' : progress.stage}
                </div>
                <div className="text-sm text-base-content/70">
                  {progress.message}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full">
              <progress className={`progress ${getProgressBarColor()} w-full h-3`} 
                        value={progress.progress} 
                        max="100">
              </progress>
              <div className="flex justify-between text-xs text-base-content/60 mt-1">
                <span>Progress</span>
                <span>{Math.round(progress.progress)}%</span>
              </div>
            </div>

            {/* Batch Progress (if available) */}
            {progress.batch && progress.totalBatches && (
              <div className="mt-3 text-sm text-base-content/70">
                Batch {progress.batch} of {progress.totalBatches}
                {progress.total && ` • ${progress.total} cards total`}
              </div>
            )}
          </div>

          {/* Warning Messages */}
          {progress.stage === 'warning' && (
            <div className="alert alert-warning">
              <span>{progress.message}</span>
            </div>
          )}

          {/* Error Messages */}
          {progress.stage === 'error' && (
            <div className="alert alert-error">
              <span>{progress.message}</span>
            </div>
          )}

          {/* Results Summary */}
          {results && results.success && (
            <div className="bg-success/10 border border-success/20 rounded-lg p-4">
              <h4 className="font-semibold text-success mb-2 flex items-center gap-2">
                <span>🎉</span> Update Complete!
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Updated:</span> {results.updated} cards
                </div>
                {results.total && (
                  <div>
                    <span className="font-medium">Total:</span> {results.total} cards
                  </div>
                )}
                {results.skipped > 0 && (
                  <div>
                    <span className="font-medium">Skipped:</span> {results.skipped} cards
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Important Notice */}
          {!isProcessing && progress.stage === 'idle' && (
            <div className="alert alert-info">
              <div>
                <h4 className="font-semibold">Before You Start:</h4>
                <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
                  <li>This process may take several minutes for large collections</li>
                  <li>Please keep this window open during the update</li>
                  <li>Avoid refreshing or navigating away from the page</li>
                  <li>Price data is fetched from Scryfall API with rate limiting</li>
                </ul>
              </div>
            </div>
          )}

          {/* Processing Warning */}
          {isProcessing && (
            <div className="alert alert-warning">
              <div>
                <h4 className="font-semibold">⚠️ Process in Progress</h4>
                <p className="text-sm">
                  Do not close this window or navigate away. The pricing update is actively running
                  and interrupting it may require starting over.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="modal-action">
          {!isProcessing && progress.stage === 'idle' && (
            <button 
              className="btn btn-primary"
              onClick={handleStart}
            >
              <span>🚀</span>
              Start Price Update
            </button>
          )}
          
          {isProcessing && (
            <button className="btn btn-disabled">
              <span className="loading loading-spinner loading-sm"></span>
              Processing...
            </button>
          )}
          
          {canClose && (
            <button 
              className="btn btn-outline"
              onClick={handleClose}
            >
              {progress.stage === 'complete' ? 'Done' : 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Standalone hook for easier usage
export function usePricingProgress() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const startPricingUpdate = (updateFunction) => {
    return new Promise((resolve, reject) => {
      setIsModalOpen(true)
      
      const handleStart = async (onProgress) => {
        try {
          const result = await updateFunction(onProgress)
          resolve(result)
          return result
        } catch (error) {
          reject(error)
          throw error
        }
      }
      
      return handleStart
    })
  }
  
  const closeModal = () => {
    setIsModalOpen(false)
  }
  
  return {
    isModalOpen,
    startPricingUpdate,
    closeModal,
    PricingProgressModal: (props) => (
      <PricingProgressModal
        {...props}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    )
  }
}
