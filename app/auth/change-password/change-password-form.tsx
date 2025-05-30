"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff } from "lucide-react"

export default function ChangePasswordForm() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white-50">
      {/* Logo positioned above the form */}
      <div className="mb-6">
        <div className="bg-[#049c94] p-2 rounded-md">
          <Image 
            src="/media/brand-logos/logo.webp" 
            alt="App Logo" 
            width={220} 
            height={140} 
            className="object-contain"
          />
        </div>
      </div>

      <Card className="w-full max-w-md shadow-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Ganti Kata Sandi</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="current-password">Kata Sandi Saat Ini</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Kata Sandi Saat Ini"
                className="pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="new-password">Kata Sandi Baru</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                placeholder="Kata Sandi Baru"
                className="pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                onClick={() => setShowNewPassword((prev) => !prev)}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="confirm-password">Konfirmasi Kata Sandi</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Konfirmasi Kata Sandi"
                className="pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button className="w-full">Simpan Perubahan</Button>
        </CardContent>

        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          <Link href="/auth/sign-in" className="text-blue-600 hover:underline">
            Kembali ke halaman masuk
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}