'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  Send, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Settings, 
  Clock,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  ArrowLeft
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';
import { useRouter, useParams } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DecodedToken {
  id: string;
  username: string;
  email: string;
  role: string;
  exp: number;
}

type ClientData = {
  id: number;
  name: string;
  client_type_id: number;
  client_type_name: string;
  address: string;
  whatsapp_number: string;
  email: string;
  created_by: string;
  created_date: string;
  modified_by: string;
  modified_date: string;
};

type ServiceData = {
  id: number;
  service_detail_name: string;
  client_id: number;
  client_name: string;
  service_type_id: number;
  service_type_name: string;
  vendor_id: number;
  vendor_name: string;
  domain_name?: string;
  base_price: number;
  normal_price: number;
  is_discount: boolean;
  discount_type: string;
  discount: number;
  final_price: number;
  notes: string;
  status: number;
  status_name: string;
  start_date: string;
  end_date: string;
  handled_by: string;
  pic: string;
  created_date: string;
  created_by: string;
  modified_date: string;
  modified_by: string;
};

interface SendMessageRequest {
  to: string;
  service_detail_name: string;
  service_type_name: string;
  end_time: string;
  phone_number1: string;
  phone_number2: string;
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
      const storedToken = localStorage.getItem("token");
      setToken(storedToken);
    }
  }, []);
  
  return { token, isClient };
};

export default function SendMessagePage() {
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [messageBody, setMessageBody] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [response, setResponse] = useState<SendMessageResponse | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { token, isClient } = useAuthToken();
  const router = useRouter();
  const params = useParams();
  
  const serviceId = params.id as string;

  // Fetch service data first
  const fetchServiceData = async () => {
    try {
      const res = await fetch(`/api/services/id/${serviceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': 'X-Secret-Key',
        },
      });

      if (res.ok) {
        const json = await res.json();
        const data = json.data || [];
        setServiceData(data);
        return data;
      } else {
        const errorText = `Error ${res.status}: ${res.statusText}`;
        setError(errorText);
        toast.error('Gagal mengambil data layanan');
        return null;
      }
    } catch (error) {
      console.error('Error fetching service data:', error);
      setError('Terjadi kesalahan saat mengambil data layanan');
      toast.error('Terjadi kesalahan saat mengambil data layanan');
      return null;
    }
  };

  // Fetch client data using clientId from service data
  const fetchClientData = async (clientId: number) => {
    try {
      const res = await fetch(`/api/clients/id/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': 'X-Secret-Key',
        },
      });

      if (res.ok) {
        const json = await res.json();
        const data = json.data || [];
        setClientData(data);
      } else {
        const errorText = `Error ${res.status}: ${res.statusText}`;
        setError(errorText);
        toast.error('Gagal mengambil data klien');
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
      setError('Terjadi kesalahan saat mengambil data klien');
      toast.error('Terjadi kesalahan saat mengambil data klien');
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (token && serviceId) {
      const loadData = async () => {
        setIsLoadingData(true);
        setError(null);
        
        const serviceData = await fetchServiceData();
        if (serviceData && serviceData.client_id) {
          await fetchClientData(serviceData.client_id);
        }
        
        setIsLoadingData(false);
      };
      
      loadData();
    }
  }, [token, serviceId]);

  // Authentication check
  useEffect(() => {
    if (!isClient) return;

    const storedToken = localStorage.getItem('token');
    
    if (!storedToken) {
        router.push('/auth/sign-in');
        return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(storedToken);
      
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
        }, 2000);
      }, 60 * 60 * 1000);
  
      return () => clearTimeout(timeout); 

    } catch (error) {
      console.error('Failed to decode token:', error);
      localStorage.removeItem('token');
      router.push('/auth/sign-in');
    }
  }, [router, isClient]);

  const validateForm = (): string | null => {
    if (!token) {
      return 'Token tidak ditemukan. Silakan login terlebih dahulu.';
    }

    if (!clientData) {
      return 'Data klien tidak ditemukan';
    }

    if (!serviceData) {
      return 'Data layanan tidak ditemukan';
    }

    if (!clientData.whatsapp_number) {
      return 'Nomor WhatsApp klien tidak tersedia';
    }
    
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsLoadingMessage(true);
    setResponse(null);

    try {
      const requestBody: SendMessageRequest = {
        to: clientData!.whatsapp_number,
        service_detail_name: serviceData!.service_detail_name,
        service_type_name: serviceData!.service_type_name,
        end_time: serviceData!.end_date,
        phone_number1: '08111222333',
        phone_number2: '08111222333',
      };

      const res = await fetch('/api/reminder/wa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-API-Key': 'X-Secret-Key',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (res.ok) {
        setResponse({ 
          success: true, 
          message: 'Pesan WhatsApp berhasil dikirim!' 
        });
        setMessageBody('');
        toast.success('Pesan WhatsApp berhasil dikirim!');
      } else {
        const errorMessage = data.message || `Error: ${res.status} ${res.statusText}`;
        setResponse({ 
          success: false, 
          error: errorMessage
        });
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui';
      setResponse({ 
        success: false, 
        error: errorMessage
      });
      toast.error(errorMessage);
    } finally {
      setIsLoadingMessage(false);
      setShowConfirmDialog(false);
    }
  };

  const generateDefaultMessage = (service: ServiceData) => {
    return `Info Layanan:
${service.service_detail_name} 
${service.service_type_name}
Berakhir pada: ${new Date(service.end_date).toLocaleDateString('id-ID')}

Ini pesan pengingat dari Resolusiweb.
Jika sudah diperbarui, abaikan pesan ini.

Untuk bantuan atau konfirmasi status layanan, hubungi:
- Efraim: 08111222333
- Jemmy: 085611112222`;
  };

  useEffect(() => {
    if (serviceData && !messageBody) {
      const defaultMsg = generateDefaultMessage(serviceData);
      setMessageBody(defaultMsg);
    }
  }, [serviceData]);

  const handleConfirmSend = () => {
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setShowConfirmDialog(true);
  };

  // Show loading while client is mounting or data is loading
  if (!isClient || isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header Skeleton */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-5 w-80" />
              </div>
            </div>
          </div>

          {/* Cards Skeleton */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Message Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full mb-4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show error if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-gray-900">
                Terjadi Kesalahan
              </h1>
              <p className="text-gray-600 max-w-md">
                {error}
              </p>
            </div>
            <Button onClick={() => window.location.reload()}>
              Muat Ulang
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Kirim Reminder WhatsApp
              </h1>
              <p className="text-gray-600">
                Kirim pesan reminder untuk layanan yang akan berakhir
              </p>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Client Info */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-4 w-4 text-blue-600" />
                Informasi Klien
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clientData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Nama</span>
                    <span className="text-sm font-medium">{clientData.name}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      WhatsApp
                    </span>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {clientData.whatsapp_number}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Email
                    </span>
                    <span className="text-sm text-gray-700">{clientData.email}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Tipe</span>
                    <Badge variant="outline">{clientData.client_type_name}</Badge>
                  </div>
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Data klien tidak ditemukan
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Service Info */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-4 w-4 text-purple-600" />
                Informasi Layanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {serviceData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Layanan</span>
                    <span className="text-sm font-medium text-right max-w-48 truncate" title={serviceData.service_detail_name}>
                      {serviceData.service_detail_name}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Tipe</span>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      {serviceData.service_type_name}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Berakhir
                    </span>
                    <span className="text-sm font-medium text-orange-600">
                      {new Date(serviceData.end_date).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Harga
                    </span>
                    <span className="text-sm font-medium">
                      {serviceData.final_price ? `Rp ${serviceData.final_price.toLocaleString('id-ID')}` : '-'}
                    </span>
                  </div>
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Data layanan tidak ditemukan
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Message Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-green-600" />
              Pesan Reminder
            </CardTitle>
            <CardDescription>
              Pesan yang akan dikirim ke klien melalui WhatsApp
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="messageBody">Isi Pesan</Label>
              <Textarea
                id="messageBody"
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                rows={6}
                className="resize-none"
                disabled
              />
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{messageBody.length} karakter</span>
                <Clock className="h-4 w-4" />
              </div>
            </div>

            {/* Action Button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogTrigger asChild>
                  <Button
                    onClick={handleConfirmSend}
                    disabled={isLoadingMessage || !token || !clientData || !serviceData}
                    className="flex-1 h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Kirim Pesan
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Konfirmasi Pengiriman</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-4">
                        <p>Apakah Anda yakin ingin mengirim pesan reminder WhatsApp?</p>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                          <div className="flex justify-between">
                            <span className="font-medium">Tujuan:</span>
                            <span className="text-right">{clientData?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">WhatsApp:</span>
                            <span>{clientData?.whatsapp_number}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Layanan:</span>
                            <span className="text-right text-sm">{serviceData?.service_detail_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Berakhir:</span>
                            <span>{serviceData ? new Date(serviceData.end_date).toLocaleDateString('id-ID') : '-'}</span>
                          </div>
                        </div>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSubmit} disabled={isLoadingMessage}>
                      {isLoadingMessage ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Mengirim...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Ya, Kirim
                        </>
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Response Alert */}
            {response && (
              <Alert className={response.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <div className="flex items-center gap-2">
                  {response.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <AlertDescription className={`font-medium ${
                    response.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {response.success ? response.message : response.error}
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}