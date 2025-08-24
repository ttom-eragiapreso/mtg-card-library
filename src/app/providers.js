'use client'

import { SessionProvider } from 'next-auth/react'
import ModalProvider from '@/components/ModalProvider'

export default function Providers({ children, session }) {
  return (
    <SessionProvider session={session}>
      <ModalProvider>
        {children}
      </ModalProvider>
    </SessionProvider>
  )
}
