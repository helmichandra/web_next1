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
  const router = useRouter();

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
      
      // Cek apakah token sudah expired
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
        }, 2000); // beri waktu 2 detik untuk tampilkan toast
      }, 1 * 60 * 1000); // 30 menit
  
      return () => clearTimeout(timeout); 

    } catch (error) {
      console.error('Failed to decode token:', error);
      localStorage.removeItem('token');
      router.push('/auth/sign-in');
    }
  }, [router]);

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