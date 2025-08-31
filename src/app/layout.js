import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import Providers from './providers'
import "./globals.css";

export const metadata = {
  title: "MTG Card Library",
  description: "Your personal Magic: The Gathering card collection manager",
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions)
  
  return (
    <html lang="en" data-theme="fantasy">
      <body className="antialiased">
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
