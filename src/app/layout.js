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
    <html lang="en" data-theme="fantasy" className="fantasy">
      <body className="antialiased fantasy" style={{ colorScheme: 'light' }}>
        <Providers session={session}>
          {children}
        </Providers>
        <script dangerouslySetInnerHTML={{
          __html: `
            // Force theme consistency
            document.documentElement.setAttribute('data-theme', 'fantasy');
            document.documentElement.className = 'fantasy';
            document.body.className = 'antialiased fantasy';
          `
        }} />
      </body>
    </html>
  );
}
