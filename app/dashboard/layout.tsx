// app/layout.tsx

import '../globals.css'
import { Inter } from 'next/font/google'
import Sidebar from '@/components/sidebar'
import Navbar from '@/components/navbar'
import { Toaster } from 'sonner'
import { Suspense } from "react";

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Dashboard',
  description: 'Aplikasi dashboard dengan sidebar dan navbar',
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <div className="flex min-h-screen">
          {/* Sidebar selalu tampil */}
          <Sidebar />
          <div className="flex-1">
            {/* Navbar juga selalu tampil */}
            <Navbar />
            {/* Konten halaman */}
            <main className="p-10">
            <Suspense fallback={<div>Loading...</div>}>
              {children}
            </Suspense>
              <Toaster richColors position="top-right" />
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
