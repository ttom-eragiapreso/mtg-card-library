'use client'

import { createContext, useContext, useState } from 'react'
import ImageModal from './ImageModal'

const ModalContext = createContext()

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within ModalProvider')
  }
  return context
}

export default function ModalProvider({ children }) {
  const [imageModalData, setImageModalData] = useState({
    isOpen: false,
    imageUrl: null,
    altText: '',
    cardName: ''
  })

  const showImageModal = ({ imageUrl, altText, cardName }) => {
    console.log('ModalProvider: showImageModal called', { imageUrl, altText, cardName })
    setImageModalData({
      isOpen: true,
      imageUrl,
      altText,
      cardName
    })
  }

  const hideImageModal = () => {
    console.log('ModalProvider: hideImageModal called')
    setImageModalData({
      isOpen: false,
      imageUrl: null,
      altText: '',
      cardName: ''
    })
  }

  return (
    <ModalContext.Provider value={{ showImageModal, hideImageModal }}>
      {children}
      {/* Global Modal Container */}
      <div id="modal-root">
        <ImageModal
          isOpen={imageModalData.isOpen}
          onClose={hideImageModal}
          imageUrl={imageModalData.imageUrl}
          altText={imageModalData.altText}
          cardName={imageModalData.cardName}
        />
      </div>
    </ModalContext.Provider>
  )
}
