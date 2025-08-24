'use client'

import { useState, useRef, useEffect } from 'react'
import { CameraIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline'

export default function CameraScanner({ 
  onCardDetected, 
  onClose,
  className = ''
}) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState('')
  const [stream, setStream] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)

  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  const startCamera = async () => {
    try {
      setError('')
      setIsScanning(true)

      // Check for camera permission
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const constraints = {
          video: {
            facingMode: isMobile() ? 'environment' : 'user', // Use back camera on mobile
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
        setStream(mediaStream)

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          videoRef.current.play()
        }
      } else {
        throw new Error('Camera not supported by this browser')
      }
    } catch (error) {
      console.error('Camera access error:', error)
      setError(`Camera access failed: ${error.message}`)
      setIsScanning(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsScanning(false)
  }

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsProcessing(true)
    setError('')

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to blob for processing
      canvas.toBlob(async (blob) => {
        try {
          await processImage(blob)
        } catch (error) {
          setError(`Image processing failed: ${error.message}`)
        } finally {
          setIsProcessing(false)
        }
      }, 'image/jpeg', 0.8)

    } catch (error) {
      console.error('Capture error:', error)
      setError(`Failed to capture image: ${error.message}`)
      setIsProcessing(false)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setError('')

    try {
      await processImage(file)
    } catch (error) {
      setError(`File processing failed: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const processImage = async (_imageFile) => {
    // In a real implementation, this would:
    // 1. Send image to an OCR/image recognition service
    // 2. Extract card name from the image
    // 3. Search for the card in the MTG API
    
    // For demo purposes, we'll simulate card detection
    setTimeout(() => {
      // Simulate successful card detection
      const mockCardName = 'Lightning Bolt' // In reality, this would come from image recognition
      
      if (onCardDetected) {
        onCardDetected(mockCardName)
      }
      
      setIsProcessing(false)
    }, 2000)

    // Real implementation would look like:
    /*
    const formData = new FormData()
    formData.append('image', imageFile)

    const response = await fetch('/api/cards/scan', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Image recognition failed')
    }

    if (result.cardName && onCardDetected) {
      onCardDetected(result.cardName)
    } else {
      throw new Error('No card detected in image')
    }
    */
  }

  useEffect(() => {
    return () => {
      stopCamera() // Cleanup on unmount
    }
  }, [])

  return (
    <div className={`fixed inset-0 z-50 bg-black ${className}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-900 text-white">
          <h2 className="text-lg font-semibold">Scan Magic Card</h2>
          <button
            onClick={onClose}
            className="btn btn-sm btn-ghost text-white"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-error m-4">
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Camera View */}
        <div className="flex-1 relative bg-gray-900">
          {!isScanning ? (
            <div className="flex flex-col items-center justify-center h-full text-white p-8">
              <CameraIcon className="w-16 h-16 mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Camera Scanner</h3>
              <p className="text-gray-300 text-center mb-6">
                Point your camera at a Magic: The Gathering card to automatically detect and add it to your collection.
              </p>
              
              <div className="flex flex-col gap-4 w-full max-w-sm">
                <button
                  onClick={startCamera}
                  className="btn btn-primary"
                  disabled={isProcessing}
                >
                  <CameraIcon className="w-5 h-5 mr-2" />
                  Start Camera
                </button>
                
                <div className="divider text-gray-400">OR</div>
                
                <label className="btn btn-outline cursor-pointer">
                  <PhotoIcon className="w-5 h-5 mr-2" />
                  Upload Image
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="relative h-full">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              
              {/* Overlay for card detection area */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-white border-dashed rounded-lg w-64 h-40 flex items-center justify-center">
                  <span className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                    Align card here
                  </span>
                </div>
              </div>

              {/* Processing overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <span className="loading loading-spinner loading-lg mb-4"></span>
                    <p>Processing image...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        {isScanning && (
          <div className="flex items-center justify-center p-6 bg-gray-900">
            <div className="flex items-center gap-4">
              <button
                onClick={stopCamera}
                className="btn btn-outline text-white border-white hover:bg-white hover:text-black"
              >
                Stop Camera
              </button>
              
              <button
                onClick={captureImage}
                className="btn btn-circle btn-primary btn-lg"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <CameraIcon className="w-6 h-6" />
                )}
              </button>
              
              <label className="btn btn-outline text-white border-white hover:bg-white hover:text-black cursor-pointer">
                <PhotoIcon className="w-5 h-5" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                />
              </label>
            </div>
          </div>
        )}

        {/* Hidden canvas for image processing */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />

        {/* Instructions */}
        <div className="p-4 bg-gray-800 text-white text-sm">
          <p className="text-center text-gray-300">
            💡 Tip: Hold your device steady and ensure the card name is clearly visible for best results.
          </p>
        </div>
      </div>
    </div>
  )
}
