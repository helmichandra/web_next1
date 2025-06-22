"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  ChevronUp, 
  ChevronDown, 
  Search,
  LayoutDashboard,
  Users,
  UserCheck,
  Settings,
  MessageSquare,
  History,
  FileText,
  Database,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Image from 'next/image';

interface SidebarProps {
  onMinimizeChange?: (isMinimized: boolean) => void;
}

export default function Sidebar({ onMinimizeChange }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({
    Pengguna: true,
    Klien: true,
  });

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsMinimized(false);
        setIsMobileOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    Cookies.remove("token");
    router.push("/auth/sign-in");
  };

  const toggleMenu = (label: string) => {
    if (isMinimized && !isMobile) return;
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      const newMinimizedState = !isMinimized;
      setIsMinimized(newMinimizedState);
      
      onMinimizeChange?.(newMinimizedState);
      
      if (!newMinimizedState) {
        setOpenMenus({
          Pengguna: true,
          Klien: true,
        });
      } else {
        setOpenMenus({});
      }
    }
  };

  const closeMobileMenu = () => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  const menuItems = [
    { 
      label: "Dashboard", 
      href: "/dashboard/reminder-dashboard",
      icon: LayoutDashboard
    },
    {
      label: "Pengguna",
      icon: Users,
      children: [{ 
        label: "Manajemen Pengguna", 
        href: "/dashboard/user-page",
        icon: UserCheck
      }],
    },
    {
      label: "Klien",
      icon: Users,
      children: [{ 
        label: "Daftar Klien", 
        href: "/dashboard/client-page",
        icon: UserCheck
      }],
    },
    { 
      label: "Layanan", 
      href: "/dashboard/service-page",
      icon: Settings
    },
    { 
      label: "Pengingat WhatsApp", 
      href: "#",
      icon: MessageSquare
    },
    { 
      label: "Riwayat Layanan", 
      href: "#",
      icon: History
    },
    { 
      label: "Laporan", 
      href: "/dashboard/report-page",
      icon: FileText
    },
    { 
      label: "Master Data", 
      href: "/dashboard/master-list/master-page",
      icon: Database
    },
    { 
      label: "Logout", 
      onClick: handleLogout,
      icon: LogOut
    },
  ];

  const filteredItems = menuItems.filter((item) => {
    if (isMinimized && !isMobile) return true;
    const matchLabel = item.label.toLowerCase().includes(search.toLowerCase());
    const matchChild = item.children?.some((child) =>
      child.label.toLowerCase().includes(search.toLowerCase())
    );
    return matchLabel || matchChild;
  });

  // Mobile overlay
  if (isMobile && isMobileOpen) {
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileMenu}
        />
        
        {/* Mobile Sidebar */}
        <aside className="fixed top-0 left-0 h-full w-80 bg-white z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl md:hidden">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="bg-[#049c94] p-2 rounded-lg shadow-sm">
              <Image 
                src="/media/brand-logos/logo.webp" 
                alt="ResolusiWeb" 
                width={120} 
                height={32} 
                className="object-contain"
                priority
              />
            </div>
            <button
              onClick={closeMobileMenu}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Mobile Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari menu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm 
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white
                  placeholder-gray-400 transition-all duration-200"
              />
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {filteredItems.map((item, index) => {
              const Icon = item.icon;
              
              if (item.children) {
                const isOpen = openMenus[item.label];
                const filteredChildren = item.children.filter((child) =>
                  child.label.toLowerCase().includes(search.toLowerCase())
                );

                if (!item.label.toLowerCase().includes(search.toLowerCase()) && filteredChildren.length === 0) {
                  return null;
                }

                return (
                  <div key={index} className="space-y-1">
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className="w-full flex items-center justify-between px-3 py-3 text-sm font-medium 
                        text-gray-700 rounded-xl hover:bg-gray-50 hover:text-gray-900 
                        transition-all duration-200 group"
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
                        <span>{item.label}</span>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    
                    {isOpen && filteredChildren.length > 0 && (
                      <div className="ml-6 space-y-1 border-l-2 border-gray-100 pl-4">
                        {filteredChildren.map((child, cIdx) => {
                          const ChildIcon = child.icon;
                          return (
                            <Link href={child.href} key={cIdx} onClick={closeMobileMenu}>
                              <div
                                className={`flex items-center space-x-3 px-3 py-2.5 text-sm rounded-lg 
                                  transition-all duration-200 group ${
                                  pathname === child.href
                                    ? "bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-700 font-medium shadow-sm"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                              >
                                <ChildIcon className={`w-4 h-4 ${
                                  pathname === child.href ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                                }`} />
                                <span>{child.label}</span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              if (item.onClick) {
                return (
                  <button
                    key={index}
                    onClick={() => {
                      item.onClick();
                      closeMobileMenu();
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-3 text-sm font-medium 
                      text-gray-700 rounded-xl hover:bg-red-50 hover:text-red-600 
                      transition-all duration-200 group"
                  >
                    <Icon className="w-5 h-5 text-gray-500 group-hover:text-red-500" />
                    <span>{item.label}</span>
                  </button>
                );
              }

              return (
                <Link href={item.href || "#"} key={index} onClick={closeMobileMenu}>
                  <div
                    className={`flex items-center space-x-3 px-3 py-3 text-sm font-medium 
                      rounded-xl transition-all duration-200 group ${
                      pathname === item.href
                        ? "bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-700 shadow-sm"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${
                      pathname === item.href 
                        ? 'text-blue-600' 
                        : 'text-gray-500 group-hover:text-gray-700'
                    }`} />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Footer */}
          <div className="p-4 border-t border-gray-100">
            <div className="text-xs text-gray-400">
              © 2025 ResolusiWeb v1.0
            </div>
          </div>
        </aside>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <>
      {/* Hamburger Button - Fixed at top for mobile */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/60 
            hover:bg-gray-50 transition-all duration-200 md:hidden flex items-center justify-center"
          aria-label="Toggle menu"
        >
          <Menu className="w-4 h-4 text-gray-600" />
        </button>
      )}

      {/* Desktop Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full bg-white/95 backdrop-blur-sm border-r border-gray-200/60 z-40 
          transform transition-all duration-300 ease-in-out flex flex-col shadow-xl hidden md:flex
          ${isMinimized ? 'w-16' : 'w-72'}`}
      >
        {/* Desktop Header */}
        <div className={`flex items-center justify-between p-4 border-b border-gray-100
          ${isMinimized ? 'px-2' : 'px-6'}`}>
          {/* Logo */}
          <div className={`flex items-center transition-all duration-300 
            ${isMinimized ? 'justify-center w-full' : ''}`}>
            {isMinimized ? (
              <div className="bg-[#049c94] p-1.5 rounded-lg shadow-sm">
                <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                  <span className="text-[#049c94] text-xs font-bold">R</span>
                </div>
              </div>
            ) : (
              <div className="bg-[#049c94] p-2 rounded-lg shadow-sm">
                <Image 
                  src="/media/brand-logos/logo.webp" 
                  alt="ResolusiWeb" 
                  width={120} 
                  height={32} 
                  className="object-contain"
                  priority
                />
              </div>
            )}
          </div>

          {!isMinimized && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              title="Minimize sidebar"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
        
        {/* Desktop Search Bar */}
        {!isMinimized && (
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari menu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm 
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white
                  placeholder-gray-400 transition-all duration-200"
              />
            </div>
          </div>
        )}

        {/* Toggle Button for Minimized State */}
        {isMinimized && (
          <div className="p-2 border-b border-gray-100">
            <button
              onClick={toggleSidebar}
              className="w-full p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 
                flex items-center justify-center"
              title="Expand sidebar"
            >
              <Menu className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}

        {/* Desktop Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
          {filteredItems.map((item, index) => {
            const Icon = item.icon;
            
            if (item.children && !isMinimized) {
              const isOpen = openMenus[item.label];
              const filteredChildren = item.children.filter((child) =>
                child.label.toLowerCase().includes(search.toLowerCase())
              );

              if (!item.label.toLowerCase().includes(search.toLowerCase()) && filteredChildren.length === 0) {
                return null;
              }

              return (
                <div key={index} className="space-y-1">
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className="w-full flex items-center justify-between px-3 py-3 text-sm font-medium 
                      text-gray-700 rounded-xl hover:bg-gray-50 hover:text-gray-900 
                      transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
                      <span>{item.label}</span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  
                  {isOpen && filteredChildren.length > 0 && (
                    <div className="ml-6 space-y-1 border-l-2 border-gray-100 pl-4">
                      {filteredChildren.map((child, cIdx) => {
                        const ChildIcon = child.icon;
                        return (
                          <Link href={child.href} key={cIdx}>
                            <div
                              className={`flex items-center space-x-3 px-3 py-2.5 text-sm rounded-lg 
                                transition-all duration-200 group ${
                                pathname === child.href
                                  ? "bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-700 font-medium shadow-sm"
                                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                              }`}
                            >
                              <ChildIcon className={`w-4 h-4 ${
                                pathname === child.href ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                              }`} />
                              <span>{child.label}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            if (isMinimized) {
              if (item.children) {
                return (
                  <div
                    key={index}
                    className="flex justify-center p-3 text-gray-500 hover:bg-gray-50 hover:text-gray-700
                      rounded-xl transition-all duration-200 cursor-pointer group"
                    title={item.label}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                );
              }

              if (item.onClick) {
                return (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className="w-full flex justify-center p-3 text-gray-500 hover:bg-red-50 
                      hover:text-red-600 rounded-xl transition-all duration-200 group"
                    title={item.label}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              }

              return (
                <Link href={item.href} key={index}>
                  <div
                    className={`flex justify-center p-3 rounded-xl transition-all duration-200 group ${
                      pathname === item.href
                        ? "bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-600 shadow-sm"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </Link>
              );
            }

            if (item.onClick) {
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="w-full flex items-center space-x-3 px-3 py-3 text-sm font-medium 
                    text-gray-700 rounded-xl hover:bg-red-50 hover:text-red-600 
                    transition-all duration-200 group"
                >
                  <Icon className="w-5 h-5 text-gray-500 group-hover:text-red-500" />
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <Link href={item.href || "#"} key={index}>
                <div
                  className={`flex items-center space-x-3 px-3 py-3 text-sm font-medium 
                    rounded-xl transition-all duration-200 group ${
                    pathname === item.href
                      ? "bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-700 shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${
                    pathname === item.href 
                      ? 'text-blue-600' 
                      : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Desktop Footer */}
        <div className={`p-4 border-t border-gray-100 ${isMinimized ? 'px-2' : ''}`}>
          <div className={`text-xs text-gray-400 ${isMinimized ? 'text-center' : ''}`}>
            {isMinimized ? 'v1.0' : '© 2025 ResolusiWeb v1.0'}
          </div>
        </div>
      </aside>
    </>
  );
}