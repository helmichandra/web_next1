"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from "lucide-react"

interface TokenData {
  id: string;
  username: string;
  email: string;
  role: string;
  exp: number;
}
export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const decodeToken = (token: string): TokenData | null => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error("Failed to decode token:", error);
        return null;
    }
  };
  const storeToken = (token: string) => {
    try {
      // Simpan token di localStorage (alternatif: gunakan cookies dengan httpOnly dan secure)
      localStorage.setItem("token", token);
      
      // Dekode token untuk mendapatkan informasi user
      const decodedToken = decodeToken(token);
      
      if (decodedToken) {
        // Simpan informasi user yang diperlukan (tanpa data sensitif)
        const userData = {
          id: decodedToken.id,
          username: decodedToken.username,
          email: decodedToken.email,
          role: decodedToken.role
        };
        localStorage.setItem("userData", JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Failed to store token:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
  
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': 'X-Secret-Key',
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const result = await response.json();
      console.log('Login success:', result);
      if (result.data && result.data.token) {
        storeToken(result.data.token);
        
        // Redirect ke dashboard setelah login sukses
        router.push("/dashboard/reminder-dashboard");
      } else {
        throw new Error("Token not received from server");
      }
      // Misal: simpan token ke localStorage (opsional)
      // localStorage.setItem("token", result.data.token);
  
    } catch (err) {
      console.error("Login error:", err);
      setError("Gagal login. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };
  
  
  

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
          <CardTitle className="text-center text-2xl font-bold">Masuk akun anda</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="username">Email</Label>
              <Input 
                id="username" 
                type="text" 
                placeholder="Username/Email" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Kata Sandi</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Kata Sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Memproses...</span>
                </div>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
          <p>
            Lupa Password?{" "}
            <a href="/auth/change-password" className="text-blue-600 hover:underline font-semibold">
              Ganti
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}