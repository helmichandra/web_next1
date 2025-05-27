"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({
    Pengguna: true,
    Klien: true,
  });

  const handleLogout = () => {
    // Hapus token dari localStorage dan cookies
    localStorage.removeItem("token");
    Cookies.remove("token");

    // Redirect ke halaman sign-in
    router.push("/auth/sign-in");
  };

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const menuItems = [
    { label: "Dashboard", href: "/dashboard" },
    {
      label: "Pengguna",
      children: [{ label: "Manajemen Pengguna", href: "/dashboard/user-page" }],
    },
    {
      label: "Klien",
      children: [{ label: "Daftar Klien", href: "/dashboard/client-page" }],
    },
    { label: "Layanan", href: "#" },
    { label: "Pengingat WhatsApp", href: "#" },
    { label: "Riwayat Layanan", href: "#" },
    { label: "Laporan", href: "#" },
    { label: "Master Data", href: "#" },
    { label: "Logout", onClick: handleLogout },
  ];

  const filteredItems = menuItems.filter((item) => {
    const matchLabel = item.label.toLowerCase().includes(search.toLowerCase());
    const matchChild = item.children?.some((child) =>
      child.label.toLowerCase().includes(search.toLowerCase())
    );
    return matchLabel || matchChild;
  });

  return (
    <aside className="w-64 bg-gray-100 border-r p-6 space-y-4 min-h-screen">
      <h2 className="text-xl font-semibold">Menu</h2>

      <input
        type="text"
        placeholder="Cari menu..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded text-sm mb-4"
      />

      <nav className="space-y-2">
        {filteredItems.map((item, index) => {
          if (item.children) {
            const isOpen = openMenus[item.label];
            const filteredChildren = item.children.filter((child) =>
              child.label.toLowerCase().includes(search.toLowerCase())
            );

            if (!item.label.toLowerCase().includes(search.toLowerCase()) && filteredChildren.length === 0) {
              return null;
            }

            return (
              <div key={index}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className="w-full text-left text-sm font-medium p-2 rounded hover:bg-gray-200 flex justify-between items-center"
                >
                  <span>{item.label}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>
                {isOpen && filteredChildren.length > 0 && (
                  <div className="ml-4 space-y-1">
                    {filteredChildren.map((child, cIdx) => (
                      <Link href={child.href} key={cIdx}>
                        <div
                          className={`text-sm p-2 rounded hover:bg-gray-200 ${
                            pathname === child.href ? "bg-gray-300 " : ""
                          }`}
                        >
                          {child.label}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          if (item.onClick) {
            return (
              <div
                key={index}
                onClick={item.onClick}
                className="text-sm font-medium p-2 rounded cursor-pointer hover:bg-gray-200"
              >
                {item.label}
              </div>
            );
          }

          return (
            <Link href={item.href} key={index}>
              <div
                className={`text-sm font-medium p-2 rounded cursor-pointer hover:bg-gray-200 ${
                  pathname === item.href ? "bg-gray-300 font-semibold" : ""
                }`}
              >
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
