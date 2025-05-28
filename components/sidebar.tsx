"use client";

import Link from "next/link";
import { useState } from "react";
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
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({
    Pengguna: true,
    Klien: true,
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    Cookies.remove("token");
    router.push("/auth/sign-in");
  };

  const toggleMenu = (label: string) => {
    if (isMinimized) return; // Prevent toggle when minimized
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const toggleSidebar = () => {
    setIsMinimized(!isMinimized);
    // Close all menus when minimizing
    if (!isMinimized) {
      setOpenMenus({});
    } else {
      // Restore default open menus when expanding
      setOpenMenus({
        Pengguna: true,
        Klien: true,
      });
    }
  };

  const menuItems = [
    { 
      label: "Dashboard", 
      href: "/dashboard",
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
      href: "#",
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
      href: "#",
      icon: FileText
    },
    { 
      label: "Master Data", 
      href: "#",
      icon: Database
    },
    { 
      label: "Logout", 
      onClick: handleLogout,
      icon: LogOut
    },
  ];

  const filteredItems = menuItems.filter((item) => {
    if (isMinimized) return true; // Show all items when minimized (only icons)
    const matchLabel = item.label.toLowerCase().includes(search.toLowerCase());
    const matchChild = item.children?.some((child) =>
      child.label.toLowerCase().includes(search.toLowerCase())
    );
    return matchLabel || matchChild;
  });

  return (
    <>
      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 shadow-lg z-40 transform transition-all duration-300 ease-in-out flex flex-col ${
          isMinimized ? 'w-16' : 'w-72'
        }`}
      >
        {/* Header */}
        <div className={`border-b border-gray-100 transition-all duration-300 ${
          isMinimized ? 'p-2' : 'p-6'
        }`}>
          {/* Minimize/Expand Button */}
          <div className={`flex ${isMinimized ? 'justify-center mb-4' : 'justify-between items-center mb-4'}`}>
            {!isMinimized && <h2 className="text-xl font-bold text-gray-900">Menu</h2>}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2 text-sm text-gray-600"
              title={isMinimized ? "Expand menu" : "Minimize menu"}
            >
              {isMinimized ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span>Minimize menu</span>
                </>
              )}
            </button>
          </div>
          
          {/* Search Bar - Hidden when minimized */}
          {!isMinimized && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari menu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50"
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
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
                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  
                  {isOpen && filteredChildren.length > 0 && (
                    <div className="ml-8 space-y-1">
                      {filteredChildren.map((child, cIdx) => {
                        const ChildIcon = child.icon;
                        return (
                          <Link href={child.href} key={cIdx}>
                            <div
                              className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                                pathname === child.href
                                  ? "bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-500"
                                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                              }`}
                            >
                              <ChildIcon className="w-4 h-4" />
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

            // Minimized view or items with children in minimized state
            if (isMinimized) {
              if (item.children) {
                // For parent items with children in minimized state, show only icon
                return (
                  <div
                    key={index}
                    className="flex justify-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 cursor-pointer"
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
                    className="w-full flex justify-center p-3 text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200"
                    title={item.label}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              }

              return (
                <Link href={item.href} key={index}>
                  <div
                    className={`flex justify-center p-3 rounded-lg transition-all duration-200 ${
                      pathname === item.href
                        ? "bg-blue-50 text-blue-700 border-l-2 border-blue-500"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </Link>
              );
            }

            // Full view for regular items
            if (item.onClick) {
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <Link href={item.href || "#"} key={index}>
                <div
                  className={`flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    pathname === item.href
                      ? "bg-blue-50 text-blue-700 border-l-2 border-blue-500"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content offset */}
      <div className={`transition-all duration-300 ${isMinimized ? 'ml-16' : 'ml-72'}`}>
        {/* Your main content goes here */}
      </div>
    </>
  );
}