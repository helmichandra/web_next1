'use client';

import '../globals.css'
import { Inter } from 'next/font/google'
import Sidebar from '@/components/sidebar'
import Navbar from '@/components/navbar'
import { Toaster } from 'sonner'
import { Suspense, useState, useEffect } from "react";

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsMinimized(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMinimizeChange = (minimized: boolean) => {
    setIsMinimized(minimized);
  };

  const handleToggleSidebar = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <html lang="id">
      <body className={`${inter.className} bg-gray-50`}>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <Sidebar onMinimizeChange={handleMinimizeChange} />
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Navbar - Fixed positioning handled within component */}
            <Navbar 
              isMinimized={isMinimized} 
              onToggleSidebar={handleToggleSidebar}
            />
            
            {/* Page Content */}
            <main className={`
              flex-1 p-6 
              transition-all duration-300
              ${isMinimized ? 'ml-16' : 'ml-72'}
              mt-16
              min-h-screen
              overflow-auto
            `}>
              <div className="max-w-7xl mx-auto">
                <Suspense fallback={
                  <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 
                        rounded-full animate-spin"></div>
                      <div className="text-gray-500 text-sm">Loading...</div>
                    </div>
                  </div>
                }>
                  {children}
                </Suspense>
              </div>
            </main>
          </div>
        </div>

        {/* Mobile Overlay */}
        {isMobile && !isMinimized && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsMinimized(true)}
          />
        )}

        {/* Toast Notifications */}
        <Toaster 
          richColors 
          position="top-right" 
          toastOptions={{
            className: 'rounded-xl',
            style: {
              backdropFilter: 'blur(12px)',
            }
          }}
        />
      </body>
    </html>
  )
}