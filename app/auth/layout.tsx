// app/(auth)/layout.tsx

import "@/app/globals.css"
import { Inter } from "next/font/google"

// Assets
import bgAuth from "@/public/media/images/2600x1200/bg-7.png"
import bgAuthLeft from "@/public/media/app/bg-1.jpg"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Login",
  description: "Halaman masuk",
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={inter.className}>
    <main
      className={`${inter.className} min-h-screen w-full bg-cover bg-center flex items-center justify-center px-4 py-8 fixed`}
      style={{ backgroundImage: `url(${bgAuth.src})` }}
    >
      <div className="w-full max-w-[1154px] bg-white shadow-xl rounded-3xl overflow-hidden flex flex-col md:flex-row h-full md:h-[675px]">
        
        {/* Kolom kiri (gambar) - hanya tampil di md ke atas */}
        <div className="hidden md:flex w-[443px] bg-cover bg-center items-center justify-center" style={{ backgroundImage: `url(${bgAuthLeft.src})` }}>
          {/* Bisa tambah logo atau teks di sini jika ingin */}
        </div>

        {/* Kolom kanan (form login) */}
        <div className="flex-1 flex items-center justify-center bg-white relative z-10 p-6">
          <div className="w-full max-w-[510px] space-y-6">{children}</div>
        </div>
      </div>
    </main>
      </body>
    </html>
  )
}
