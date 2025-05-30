import UserMenu from "./partials/user-menu/user-menu";
import Image from 'next/image';
import { Bell, Search, Menu } from 'lucide-react';

interface NavbarProps {
  isMinimized?: boolean;
  onToggleSidebar?: () => void;
}

export default function Navbar({ isMinimized = false, onToggleSidebar }: NavbarProps) {
  return (
    <header className="
      fixed top-0 right-0 z-30
      flex justify-between items-center 
      h-16 px-6
      bg-white/80 backdrop-blur-md
      border-b border-gray-200/60
      shadow-sm
      transition-all duration-300
    " style={{
      left: isMinimized ? '4rem' : '18rem',
      width: isMinimized ? 'calc(100% - 4rem)' : 'calc(100% - 18rem)'
    }}>
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button 
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>

        {/* Logo (show when sidebar is minimized) */}
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

        {/* Page Title */}
        <div className="flex flex-col min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 truncate">
            Selamat datang kembali
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Search Bar */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Cari..."
            className="
              w-56 pl-10 pr-4 py-2.5
              bg-gray-50 border-0 rounded-xl
              text-sm placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white
              transition-all duration-200
            "
          />
        </div>

        {/* Mobile Search Button */}
        <button className="md:hidden p-2.5 text-gray-600 hover:text-gray-800 
          hover:bg-gray-100 rounded-xl transition-colors duration-200">
          <Search className="w-5 h-5" />
        </button>

        {/* Notification Bell */}
        <button className="
          relative p-2.5
          text-gray-600 hover:text-gray-800 
          hover:bg-gray-100 
          rounded-xl 
          transition-colors duration-200
          group
        ">
          <Bell className="w-5 h-5" />
          {/* Notification dot */}
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full 
            animate-pulse group-hover:animate-none"></span>
        </button>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-200 mx-2"></div>

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  );
}