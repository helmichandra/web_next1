import UserMenu from "./partials/user-menu/user-menu";
import Image from 'next/image';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NavbarProps {
  isMinimized?: boolean;
  onToggleSidebar?: () => void;
}

export default function Navbar({ isMinimized = false }: NavbarProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <header 
      className={`
        fixed top-0 z-30
        flex justify-between items-center 
        h-16 px-4 md:px-6
        bg-white/95 backdrop-blur-md
        border-b border-gray-200/60
        shadow-sm
        transition-all duration-300
        ${isMobile 
          ? 'left-0 right-0 w-full' 
          : `${isMinimized ? 'left-16' : 'left-72'} right-0`
        }
      `}
    >
      {/* Left Section */}
      <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
        {/* Mobile: Logo always visible */}
        {isMobile && (
          <div className="flex items-center ml-12">
            <div className="bg-[#049c94] p-1.5 rounded-lg shadow-sm">
              <Image 
                src="/media/brand-logos/logo.webp" 
                alt="ResolusiWeb" 
                width={80} 
                height={22} 
                className="object-contain"
                priority
              />
            </div>
          </div>
        )}

        {/* Desktop: Logo when sidebar is minimized */}
        {!isMobile && (
          <div 
            className={`
              flex items-center
              transition-all duration-300
              ${isMinimized ? 'opacity-100 scale-100' : 'opacity-0 scale-95 w-0 overflow-hidden'}
            `}
          >
            <div className="bg-[#049c94] p-2 rounded-lg shadow-sm">
              <Image 
                src="/media/brand-logos/logo.webp" 
                alt="ResolusiWeb" 
                width={100} 
                height={28} 
                className="object-contain"
                priority
              />
            </div>
          </div>
        )}

        {/* Page Title - Hidden on mobile */}
        <div className="hidden md:flex flex-col min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 truncate">
            Selamat datang kembali
          </p>
        </div>

        {/* Mobile Page Title - Simplified */}
        <div className="md:hidden flex flex-col min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            Dashboard
          </h1>
        </div>
      </div>



      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile Search Button */}
        {isMobile && (
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
            <Search className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200"></div>

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  );
}