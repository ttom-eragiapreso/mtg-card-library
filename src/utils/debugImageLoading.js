'use client'

// Debug utility to track image loading behavior
export function debugImageBehavior() {
  if (typeof window === 'undefined') return

  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    console.log('🔍 Page visibility changed:', {
      hidden: document.hidden,
      visibilityState: document.visibilityState,
      timestamp: new Date().toISOString()
    })
  })

  // Track window focus/blur events
  window.addEventListener('focus', () => {
    console.log('🎯 Window focused at:', new Date().toISOString())
  })

  window.addEventListener('blur', () => {
    console.log('😴 Window blurred at:', new Date().toISOString())
  })

  // Track image loading events globally
  const originalImage = window.Image
  window.Image = function(...args) {
    const img = new originalImage(...args)
    
    const originalAddEventListener = img.addEventListener
    img.addEventListener = function(type, listener, ...rest) {
      if (type === 'load' || type === 'error') {
        const wrappedListener = function(event) {
          console.log(`📸 Image ${type}:`, {
            src: img.src,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            timestamp: new Date().toISOString(),
            visibilityState: document.visibilityState
          })
          return listener.call(this, event)
        }
        return originalAddEventListener.call(this, type, wrappedListener, ...rest)
      }
      return originalAddEventListener.call(this, type, listener, ...rest)
    }
    
    return img
  }

  console.log('🚀 Image debugging initialized')
}
