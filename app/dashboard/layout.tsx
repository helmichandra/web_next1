'use client';

import '../globals.css'
import { Inter } from 'next/font/google'
import Sidebar from '@/components/sidebar'
import Navbar from '@/components/navbar'
import { Toaster } from 'sonner'
import { Suspense, useState, useEffect } from "react";
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface DecodedToken {
  id: string;
  username: string;
  email: string;
  role: string;
  exp: number;
}

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  // Enhanced responsive behavior
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      
      setIsMobile(width < 768);
      
      // Auto-minimize sidebar on mobile and tablet
      if (width < 1024) {
        setIsMinimized(true);
      } else {
        setIsMinimized(false);
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const handleMinimizeChange = (minimized: boolean) => {
    setIsMinimized(minimized);
  };

  const handleToggleSidebar = () => {
    setIsMinimized(!isMinimized);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    
    if (!storedToken) {
        router.push('/auth/sign-in');
        return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(storedToken);
      
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        console.warn('Token has expired');
        localStorage.removeItem('token');
        router.push('/auth/sign-in');
        return;
      }
      
      const timeout = setTimeout(() => {
        toast.warning("Sesi Anda telah habis. Silakan login kembali.");
        localStorage.removeItem('token');
        setTimeout(() => {
          router.push('/auth/sign-in');
        }, 2000);
      }, 60 * 60 * 1000);
  
      return () => clearTimeout(timeout); 

    } catch (error) {
      console.error('Failed to decode token:', error);
      localStorage.removeItem('token');
      router.push('/auth/sign-in');
    }
  }, [router]);

  // Modern loading component with glassmorphism
  const ModernLoader = () => (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="relative">
        {/* Backdrop blur effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-600/20 blur-xl rounded-full"></div>
        
        {/* Main loader */}
        <div className="relative flex flex-col items-center space-y-6 p-8">
          <div className="relative">
            {/* Outer spinning ring */}
            <div className="w-16 h-16 border-4 border-gray-200/30 border-t-blue-500 rounded-full animate-spin"></div>
            {/* Inner pulsing dot */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          
          {/* Loading text with fade animation */}
          <div className="text-center space-y-2">
            <div className="text-gray-700 font-medium animate-pulse">Loading...</div>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <html lang="id">
      <body className={`${inter.className} bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 min-h-screen`}>
        <div className="min-h-screen">
          {/* Sidebar dengan positioning yang lebih sederhana */}
          <div className={`
            fixed top-0 left-0 h-full z-40 transition-transform duration-300 ease-in-out
            ${isMobile && isMinimized ? '-translate-x-full' : 'translate-x-0'}
          `}>
            <Sidebar onMinimizeChange={handleMinimizeChange} />
          </div>
          
          {/* Navbar - Fixed di atas */}
          <div className={`
            fixed top-0 right-0 z-30 transition-all duration-300 ease-in-out
            ${!isMobile ? (isMinimized ? 'left-16' : 'left-72') : 'left-0'}
          `}>
            <Navbar 
              isMinimized={isMinimized} 
              onToggleSidebar={handleToggleSidebar}
            />
          </div>
          
          {/* Main Content Area */}
          <main className={`
            transition-all duration-300 ease-in-out pt-16
            ${!isMobile ? (isMinimized ? 'ml-16' : 'ml-72') : 'ml-0'}
          `}>
            {/* Gradient background overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-50/10 to-purple-50/10 pointer-events-none"></div>
            
            <div className="relative z-10 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)] max-w-7xl mx-auto w-full">
              <Suspense fallback={<ModernLoader />}>
                {children}
              </Suspense>
            </div>
          </main>
        </div>

        {/* Enhanced Mobile Overlay with blur */}
        {isMobile && !isMinimized && (
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 animate-in fade-in duration-200"
            onClick={() => setIsMinimized(true)}
          />
        )}

        {/* Modern Toast Notifications */}
        <Toaster 
          richColors 
          position="top-right" 
          toastOptions={{
            className: 'rounded-2xl shadow-2xl',
            style: {
              backdropFilter: 'blur(16px)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }
          }}
        />
      </body>
    </html>
  )
}