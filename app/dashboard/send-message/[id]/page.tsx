'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Send, MessageSquare, Phone, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';
import { useRouter } from "next/navigation";

interface DecodedToken {
  id: string;
  username: string;
  email: string;
  role: string;
  exp: number;
}
interface SendMessageRequest {
  to: string;
  body: string;
}

interface SendMessageResponse {
  success: boolean;
  message?: string;
  error?: string;
}

const useAuthToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem("token"));
    }
  }, []);
  
  return { token, isClient };
};

export default function SendMessagePage() {
  const [formData, setFormData] = useState<SendMessageRequest>({
    to: '+6281564640558', // Fixed number
    body: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<SendMessageResponse | null>(null);
  const { token, isClient } = useAuthToken();
  const router = useRouter();
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.body.trim()) {
      return 'Pesan wajib diisi';
    }
    
    if (!token) {
      return 'Token tidak ditemukan. Silakan login terlebih dahulu.';
    }
    
    return null;
  };
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    
    if (!storedToken) {
        router.push('/auth/sign-in');
        return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(storedToken);
      
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
      }, 60 * 60 * 1000); // 30 menit
  
      return () => clearTimeout(timeout); 

    } catch (error) {
      console.error('Failed to decode token:', error);
      localStorage.removeItem('token');
      router.push('/auth/sign-in');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setResponse({ success: false, error: validationError });
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/reminder/wa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-API-Key': 'X-Secret-Key', // Using token as API key as well
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setResponse({ 
          success: true, 
          message: 'Pesan WhatsApp berhasil dikirim!' 
        });
        // Reset message after successful send
        setFormData(prev => ({ ...prev, body: '' }));
      } else {
        setResponse({ 
          success: false, 
          error: data.message || `Error: ${res.status} ${res.statusText}` 
        });
      }
    } catch (error) {
      setResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFormData(prev => ({ ...prev, body: '' }));
    setResponse(null);
  };

  // Show skeleton while checking authentication
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto py-8">
          {/* Header Skeleton */}
          <div className="text-center mb-8">
            <Skeleton className="w-20 h-20 rounded-2xl mx-auto mb-6" />
            <Skeleton className="h-10 w-80 mx-auto mb-3" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>

          {/* Auth Status Skeleton */}
          <Card className="mb-6">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Skeleton className="w-5 h-5 rounded-full" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </CardContent>
          </Card>

          {/* Main Card Skeleton */}
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-2">
                <Skeleton className="w-6 h-6" />
                <Skeleton className="h-8 w-48" />
              </div>
              <Skeleton className="h-5 w-72 mt-2" />
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Message Section Skeleton */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Skeleton className="w-5 h-5" />
                  <Skeleton className="h-6 w-32" />
                </div>

                {/* Phone Number Field Skeleton */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-4 h-4" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-4 w-64" />
                </div>

                <div className="h-px bg-gray-200" />

                {/* Message Body Skeleton */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-4 h-4" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-48 w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Buttons Skeleton */}
              <div className="flex gap-3 pt-4">
                <Skeleton className="flex-1 h-12" />
                <Skeleton className="h-12 w-32" />
              </div>
            </CardContent>
          </Card>

          {/* API Info Card Skeleton */}
          <Card className="mt-6 border-0 bg-white/60 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-80 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-32 rounded-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto py-8">


        {/* Main Card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Send className="w-6 h-6 text-green-600" />
              Kirim Pesan Baru
            </CardTitle>
            <CardDescription className="text-base">
              Tulis pesan yang ingin dikirim ke WhatsApp
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Message Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Detail Pesan</h3>
                </div>

                {/* Fixed Destination Number */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Nomor Tujuan
                  </Label>
                  <div className="relative">
                    <Input
                      value={formData.to}
                      disabled
                      className="h-12 bg-muted/50 pr-20"
                    />
                    <Badge className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-100 text-green-800 hover:bg-green-100">
                      Fixed
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nomor tujuan sudah ditetapkan untuk saat ini
                  </p>
                </div>

                <Separator />

                {/* Message Body */}
                <div className="space-y-2">
                  <Label htmlFor="body" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Pesan
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  </Label>
                  <Textarea
                    id="body"
                    name="body"
                    value={formData.body}
                    onChange={handleInputChange}
                    rows={8}
                    className="resize-none text-base leading-relaxed"
                    placeholder="Tulis pesan WhatsApp Anda di sini"
                    disabled={!token}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {formData.body.length} karakter
                    </p>
                    {formData.body.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {formData.body.length > 160 ? 'Pesan Panjang' : 'Pesan Pendek'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading || !token || !formData.body.trim()}
                  className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Kirim Pesan
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  className="h-12 px-6"
                  disabled={isLoading || !formData.body.trim()}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Bersihkan
                </Button>
              </div>
            </form>

            {/* Response Alert */}
            {response && (
              <Alert className={`border-2 ${
                response.success 
                  ? 'border-green-200 bg-green-50/50' 
                  : 'border-red-200 bg-red-50/50'
              }`}>
                <div className="flex items-center">
                  {response.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <AlertDescription className={`ml-2 font-medium ${
                  response.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {response.success ? response.message : response.error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}