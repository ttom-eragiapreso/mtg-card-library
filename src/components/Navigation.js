'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useRef } from 'react'
import { MagnifyingGlassIcon, FolderIcon, CameraIcon } from '@heroicons/react/24/outline'

export default function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const dropdownRef = useRef(null);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  // Don't show navbar on auth pages
  if (pathname?.startsWith('/auth/')) {
    return null;
  }

  return (
    <>
      {/* DaisyUI Navbar */}
      <div className="navbar bg-base-100 border-b border-base-200 sticky top-0 z-50 shadow-sm backdrop-blur-md">
        <div className="navbar-start">
          {/* Mobile Drawer Toggle */}
          <div className="dropdown lg:hidden">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              {session && (
                <>
                  <li>
                    <Link href="/search" className={`flex items-center gap-2 ${
                      pathname === '/search' ? 'active' : ''
                    }`}>
                      <MagnifyingGlassIcon className="h-4 w-4" />
                      Search
                    </Link>
                  </li>
                  <li>
                    <Link href="/collection" className={`flex items-center gap-2 ${
                      pathname === '/collection' ? 'active' : ''
                    }`}>
                      <FolderIcon className="h-4 w-4" />
                      Collection
                    </Link>
                  </li>
                  <li>
                    <Link href="/scan" className={`flex items-center gap-2 ${
                      pathname === '/scan' ? 'active' : ''
                    }`}>
                      <CameraIcon className="h-4 w-4" />
                      Scan
                    </Link>
                  </li>
                  <div className="divider my-2"></div>
                  <li>
                    <button onClick={handleSignOut} className="text-error">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
          
          {/* Logo */}
          <Link href="/" className="btn btn-ghost text-xl normal-case">
            <span className="text-2xl">🎴</span>
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent ml-2">
              MTG
            </span>
            <span className="text-base-content ml-1">Library</span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <div className="navbar-center hidden lg:flex">
          {session && (
            <ul className="menu menu-horizontal px-1 gap-1">
              <li>
                <Link href="/search" className={`flex items-center gap-2 ${
                  pathname === '/search' ? 'bg-primary/10 text-primary' : ''
                }`}>
                  <MagnifyingGlassIcon className="h-4 w-4" />
                  Search
                </Link>
              </li>
              <li>
                <Link href="/collection" className={`flex items-center gap-2 ${
                  pathname === '/collection' ? 'bg-primary/10 text-primary' : ''
                }`}>
                  <FolderIcon className="h-4 w-4" />
                  Collection
                </Link>
              </li>
              <li>
                <Link href="/scan" className={`flex items-center gap-2 ${
                  pathname === '/scan' ? 'bg-primary/10 text-primary' : ''
                }`}>
                  <CameraIcon className="h-4 w-4" />
                  Scan
                </Link>
              </li>
            </ul>
          )}
        </div>
        
        <div className="navbar-end">
          {/* Auth Section */}
          {status === 'loading' ? (
            <span className="loading loading-spinner loading-md text-primary"></span>
          ) : session ? (
            <div className="dropdown dropdown-end" ref={dropdownRef}>
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                <div className="w-8 rounded-full">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="avatar placeholder">
                      <div className="bg-neutral-focus text-neutral-content rounded-full w-8">
                        <span className="text-sm">
                          {session.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-64">
                <li className="menu-title">
                  <span className="text-base-content font-semibold">{session.user.name}</span>
                  <span className="text-base-content/70 text-xs">{session.user.email}</span>
                </li>
                <div className="divider my-2"></div>
                <li>
                  <Link href="/profile">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>
                </li>
                <div className="divider my-2"></div>
                <li>
                  <button 
                    onClick={handleSignOut}
                    className="text-error"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href="/auth/signin" className="btn btn-ghost">
                Sign In
              </Link>
              <Link href="/auth/signin" className="btn btn-primary">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
