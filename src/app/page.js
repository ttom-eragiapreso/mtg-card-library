'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import { CameraIcon, MagnifyingGlassIcon, FolderIcon, ChartBarIcon, SparklesIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

export default function Home() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navigation />
      
      {/* Hero Section */}
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-12">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Welcome to 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                MTG Library
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed mb-8">
              {session ? 'Manage your Magic: The Gathering collection with ease' : 'Start building your Magic: The Gathering collection'}
            </p>
            
            {/* Call to Action */}
            {session ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Link 
                  href="/search"
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-3"
                >
                  <MagnifyingGlassIcon className="w-6 h-6" />
                  <span>Search Cards</span>
                </Link>
                
                <Link
                  href="/collection" 
                  className="px-8 py-4 bg-white border-2 border-purple-200 text-purple-700 rounded-xl font-semibold hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 flex items-center justify-center space-x-3"
                >
                  <FolderIcon className="w-6 h-6" />
                  <span>View Collection</span>
                </Link>
              </div>
            ) : (
              <div className="mb-16">
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  <SparklesIcon className="w-6 h-6" />
                  <span>Get Started</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>
              </div>
            )}
          </div>
          
          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link
              href={session ? "/search" : "/auth/signin"}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <MagnifyingGlassIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">🔍 Search for Cards</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Find any Magic: The Gathering card by name, including foreign language support. Browse through different printings and versions.
              </p>
              <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                <span>Start Searching</span>
                <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            
            <Link
              href={session ? "/scan" : "/auth/signin"}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <CameraIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">📱 Scan Physical Cards</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Use your device's camera to scan physical cards and automatically add them to your collection.
              </p>
              <div className="flex items-center text-purple-600 font-medium group-hover:text-purple-700">
                <span>Start Scanning</span>
                <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            
            <Link
              href={session ? "/collection" : "/auth/signin"}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <FolderIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">📚 Manage Collection</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Track quantities, conditions, and notes for each card. Filter and search through your personal library.
              </p>
              <div className="flex items-center text-green-600 font-medium group-hover:text-green-700">
                <span>{session ? 'View Collection' : 'Get Started'}</span>
                <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Features Section (for logged-out users) */}
      {!session && (
        <div className="bg-white py-24">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Everything you need to manage your MTG collection
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Built by collectors, for collectors. Featuring the latest technology for the best experience.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌍</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Multi-language Support</h3>
                <p className="text-gray-600">Search for cards in Italian, German, French, Japanese, and more languages</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Collection Analytics</h3>
                <p className="text-gray-600">Track your collection value, rarity distribution, and growth over time</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
                <p className="text-gray-600">Your collection data is secure and private, accessible only to you</p>
              </div>
            </div>
            
            <div className="text-center mt-16">
              <Link
                href="/auth/signin"
                className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                <SparklesIcon className="w-6 h-6" />
                <span>Start Building Your Collection</span>
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      )}
      
    </div>
  )
}
