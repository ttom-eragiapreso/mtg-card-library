'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { MagnifyingGlassIcon, FolderIcon, CameraIcon } from '@heroicons/react/24/outline'

export default function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Don't show navbar on auth pages
  if (pathname?.startsWith('/auth/')) {
    return null;
  }

  return (
    <>
      {/* Modern Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <div className="text-2xl font-bold">
                  <span className="text-2xl">🃏</span>
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ml-2">
                    MTG
                  </span>
                  <span className="text-gray-900 ml-1">Library</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {session && (
                <>
                  <Link 
                    href="/search" 
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      pathname === '/search' 
                        ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <MagnifyingGlassIcon className="h-4 w-4" />
                    <span>Search</span>
                  </Link>
                  <Link 
                    href="/collection" 
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      pathname === '/collection' 
                        ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <FolderIcon className="h-4 w-4" />
                    <span>Collection</span>
                  </Link>
                  <Link 
                    href="/scan" 
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      pathname === '/scan' 
                        ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <CameraIcon className="h-4 w-4" />
                    <span>Scan</span>
                  </Link>
                </>
              )}
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Auth Section */}
              {status === 'loading' ? (
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : session ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full ring-2 ring-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
                      {session.user?.image ? (
                        <img
                          src={session.user.image}
                          alt={session.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-gray-600">
                          {session.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium text-gray-900">{session.user.name}</div>
                      <div className="text-xs text-gray-500">{session.user.email}</div>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Profile Dropdown */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="font-semibold text-gray-900">{session.user.name}</div>
                        <div className="text-sm text-gray-500">{session.user.email}</div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link 
                          href="/profile" 
                          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile
                        </Link>
                        
                        <div className="border-t border-gray-100 mt-2 pt-2">
                          <button 
                            onClick={() => {
                              handleSignOut();
                              setProfileDropdownOpen(false);
                            }}
                            className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link 
                    href="/auth/signin" 
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/auth/signin" 
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div 
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" 
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          <div className="fixed top-16 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-xl">
            <div className="px-4 py-6 space-y-4">
              {session ? (
                <>
                  <Link 
                    href="/search" 
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      pathname === '/search' 
                        ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MagnifyingGlassIcon className="w-5 h-5" />
                    <span className="font-medium">Search Cards</span>
                  </Link>
                  
                  <Link 
                    href="/collection" 
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      pathname === '/collection' 
                        ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FolderIcon className="w-5 h-5" />
                    <span className="font-medium">My Collection</span>
                  </Link>
                  
                  <Link 
                    href="/scan" 
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      pathname === '/scan' 
                        ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <CameraIcon className="w-5 h-5" />
                    <span className="font-medium">Scan Cards</span>
                  </Link>
                  
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <button 
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors w-full"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <Link 
                    href="/auth/signin" 
                    className="block px-4 py-3 text-center text-gray-600 hover:text-gray-900 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/auth/signin" 
                    className="block px-4 py-3 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
