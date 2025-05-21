// app/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';
interface DecodedToken {
  id: string;
  username: string;
  email: string;
  role: string;
  exp: number;
  // tambahkan properti lain sesuai kebutuhan
}

export default function Home() {
  const [userData, setUserData] = useState<DecodedToken | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    
    if (!storedToken) {
      router.push('/login');
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(storedToken);
      setUserData(decoded);
      
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
      }, 30 * 60 * 1000); // 30 menit
  
      return () => clearTimeout(timeout); 

    } catch (error) {
      console.error('Failed to decode token:', error);
      localStorage.removeItem('token');
      router.push('/auth/sign-in');
    }
  }, [router]);

  if (!userData) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard {userData.role}</h1>
        <div className="text-sm text-muted-foreground">
          Welcome back, {userData.username} 
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Form Kontak</CardTitle>
            <CardDescription>Kirim pesan kepada kami</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nama</Label>
                <Input id="name" placeholder="Masukkan nama Anda" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="email@contoh.com"
                  defaultValue={userData.email}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">Pesan</Label>
                <textarea
                  id="message"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  placeholder="Tulis pesan Anda di sini..."
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Kirim Pesan</Button>
          </CardFooter>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi</CardTitle>
            <CardDescription>Detail kontak kami</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <PhoneIcon />
                <span>+62 123 4567 890</span>
              </div>
              <div className="flex items-center gap-2">
                <MailIcon />
                <span>info@dappa.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPinIcon />
                <span>Jl. Cukimai No. 182, Jakarta</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">Lihat di Peta</Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}

// Ikon tetap sama seperti sebelumnya
function PhoneIcon() {
  return (
    <svg className="w-5 h-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none"
      viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.18 4.11 2 2 0 014.11 2h3a2 2 0 012 1.72c.1.96.4 1.88.7 2.81a2 2 0 01-.45 2.11l-1.27 1.27a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.93.3 1.85.6 2.81.7a2 2 0 011.72 2z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="w-5 h-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none"
      viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg className="w-5 h-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none"
      viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}