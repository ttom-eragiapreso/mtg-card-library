'use client'

import { SessionProvider } from 'next-auth/react'
import ModalProvider from '@/components/ModalProvider'
import { ImageCacheProvider } from '@/contexts/ImageCacheContext'

export default function Providers({ children, session }) {
  return (
    <SessionProvider session={session}>
      <ImageCacheProvider>
        <ModalProvider>
          {children}
        </ModalProvider>
      </ImageCacheProvider>
    </SessionProvider>
  )
}
