'use client'

import { useState, useEffect, useCallback } from 'react'
import { useImageCache } from '@/contexts/ImageCacheContext'

export function useImageLoader(imageUrl) {
  const {
    getImageStatus,
    markImageAsLoaded,
    markImageAsError,
    subscribeToImage,
    preloadImage
  } = useImageCache()

  // Get initial status from cache
  const initialStatus = getImageStatus(imageUrl)
  const [imageState, setImageState] = useState(initialStatus)

  // Subscribe to changes for this image URL
  useEffect(() => {
    if (!imageUrl) {
      setImageState({ loaded: false, error: false, loading: false })
      return
    }

    // Update state with current cache status
    const currentStatus = getImageStatus(imageUrl)
    setImageState(currentStatus)

    // If image is not loaded and not errored, preload it aggressively
    if (!currentStatus.loaded && !currentStatus.error) {
      preloadImage(imageUrl)
    }

    // Subscribe to future changes
    const unsubscribe = subscribeToImage(imageUrl, (success) => {
      setImageState({
        loaded: success,
        error: !success,
        loading: false
      })
    })

    return unsubscribe
  }, [imageUrl, getImageStatus, subscribeToImage, preloadImage])

  const handleImageLoad = useCallback(() => {
    if (imageUrl) {
      markImageAsLoaded(imageUrl)
    }
  }, [imageUrl, markImageAsLoaded])

  const handleImageError = useCallback(() => {
    if (imageUrl) {
      markImageAsError(imageUrl)
    }
  }, [imageUrl, markImageAsError])

  return {
    imageLoaded: imageState.loaded,
    imageError: imageState.error,
    imageLoading: imageState.loading,
    handleImageLoad,
    handleImageError
  }
}

// Alternative hook that handles multiple image URLs (for fallback scenarios)
export function useImageLoaderWithFallback(imageUrls = []) {
  const imageCache = useImageCache()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageState, setImageState] = useState({
    loaded: false,
    error: false,
    loading: true
  })

  const currentImageUrl = imageUrls[currentImageIndex] || null

  // Subscribe to the current image
  useEffect(() => {
    if (!currentImageUrl) {
      setImageState({ loaded: false, error: false, loading: false })
      return
    }

    // Check cache first
    const cachedStatus = imageCache.getImageStatus(currentImageUrl)
    if (cachedStatus.loaded) {
      setImageState(cachedStatus)
      return
    } else if (cachedStatus.error) {
      // Try next image in fallback list
      if (currentImageIndex < imageUrls.length - 1) {
        setCurrentImageIndex(prev => prev + 1)
        return
      } else {
        setImageState(cachedStatus)
        return
      }
    }

    // Image is loading, subscribe to changes and preload
    setImageState({ loaded: false, error: false, loading: true })
    imageCache.preloadImage(currentImageUrl)
    
    const unsubscribe = imageCache.subscribeToImage(currentImageUrl, (success) => {
      if (success) {
        setImageState({
          loaded: true,
          error: false,
          loading: false
        })
      } else {
        // Try next image in fallback list
        if (currentImageIndex < imageUrls.length - 1) {
          setCurrentImageIndex(prev => prev + 1)
        } else {
          setImageState({
            loaded: false,
            error: true,
            loading: false
          })
        }
      }
    })

    return unsubscribe
  }, [currentImageUrl, currentImageIndex, imageUrls.length, imageCache])

  // Reset to first image when imageUrls change
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [imageUrls])

  const handleImageLoad = useCallback(() => {
    if (currentImageUrl) {
      imageCache.markImageAsLoaded(currentImageUrl)
    }
  }, [currentImageUrl, imageCache])

  const handleImageError = useCallback(() => {
    if (currentImageUrl) {
      imageCache.markImageAsError(currentImageUrl)
      // The subscription will handle moving to next image
    }
  }, [currentImageUrl, imageCache])

  return {
    currentImageUrl,
    imageLoaded: imageState.loaded,
    imageError: imageState.error,
    imageLoading: imageState.loading,
    handleImageLoad,
    handleImageError,
    hasMoreFallbacks: currentImageIndex < imageUrls.length - 1
  }
}
