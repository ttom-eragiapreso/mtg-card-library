'use client'

import React, { createContext, useContext, useCallback, useRef } from 'react'

const ImageCacheContext = createContext(null)

export function ImageCacheProvider({ children }) {
  // Use ref instead of state to avoid re-renders when cache updates
  const cacheRef = useRef(new Map())
  const listenerRef = useRef(new Map())

  const isImageLoaded = useCallback((imageUrl) => {
    if (!imageUrl) return false
    return cacheRef.current.has(imageUrl)
  }, [])

  const markImageAsLoaded = useCallback((imageUrl) => {
    if (!imageUrl) return
    
    cacheRef.current.set(imageUrl, true)
    
    // Notify all listeners for this URL
    const listeners = listenerRef.current.get(imageUrl)
    if (listeners) {
      listeners.forEach(callback => callback(true))
    }
  }, [])

  const markImageAsError = useCallback((imageUrl) => {
    if (!imageUrl) return
    
    cacheRef.current.set(imageUrl, false)
    
    // Notify all listeners for this URL
    const listeners = listenerRef.current.get(imageUrl)
    if (listeners) {
      listeners.forEach(callback => callback(false))
    }
  }, [])

  const subscribeToImage = useCallback((imageUrl, callback) => {
    if (!imageUrl) return () => {}
    
    // Add callback to listeners
    if (!listenerRef.current.has(imageUrl)) {
      listenerRef.current.set(imageUrl, new Set())
    }
    listenerRef.current.get(imageUrl).add(callback)
    
    // Return cleanup function
    return () => {
      const listeners = listenerRef.current.get(imageUrl)
      if (listeners) {
        listeners.delete(callback)
        if (listeners.size === 0) {
          listenerRef.current.delete(imageUrl)
        }
      }
    }
  }, [])

  const getImageStatus = useCallback((imageUrl) => {
    if (!imageUrl) return { loaded: false, error: false, loading: false }
    
    const cached = cacheRef.current.get(imageUrl)
    if (cached === true) {
      return { loaded: true, error: false, loading: false }
    } else if (cached === false) {
      return { loaded: false, error: true, loading: false }
    } else {
      return { loaded: false, error: false, loading: true }
    }
  }, [])

  const preloadImage = useCallback((imageUrl) => {
    if (!imageUrl || cacheRef.current.has(imageUrl)) {
      return Promise.resolve(cacheRef.current.get(imageUrl))
    }
    
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        markImageAsLoaded(imageUrl)
        resolve(true)
      }
      img.onerror = () => {
        markImageAsError(imageUrl)
        resolve(false)
      }
      img.src = imageUrl
    })
  }, [markImageAsLoaded, markImageAsError])

  const clearCache = useCallback(() => {
    cacheRef.current.clear()
    listenerRef.current.clear()
  }, [])

  const getCacheSize = useCallback(() => {
    return cacheRef.current.size
  }, [])

  const value = {
    isImageLoaded,
    markImageAsLoaded,
    markImageAsError,
    subscribeToImage,
    getImageStatus,
    preloadImage,
    clearCache,
    getCacheSize
  }

  return (
    <ImageCacheContext.Provider value={value}>
      {children}
    </ImageCacheContext.Provider>
  )
}

export function useImageCache() {
  const context = useContext(ImageCacheContext)
  if (!context) {
    throw new Error('useImageCache must be used within an ImageCacheProvider')
  }
  return context
}
