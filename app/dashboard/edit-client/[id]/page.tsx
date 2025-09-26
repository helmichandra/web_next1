"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Save, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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


type ClientType = {
  id: number;
  name: string;
};

type FormData = {
  name: string;
  client_type_id: number;
  address: string;
  whatsapp_number: string;
  email: string;
  modified_by: string;
};

type FormErrors = {
  name?: string;
  client_type_id?: string;
  email?: string;
  whatsapp_number?: string;
};

// Custom hook for token management and user info
const useAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem("token");
      setToken(storedToken);
      
      // Extract username from token (you might need to decode JWT properly)
      if (storedToken) {
        try {
          // For now, we'll use a simple approach - you should implement proper JWT decoding
          const tokenParts = storedToken.split('.');
          if (tokenParts.length === 3) {
            const decoded = jwtDecode<DecodedToken>(storedToken);
            if (decoded.username) {
              setUsername(decoded.username);
            }
          }
        } catch (error) {
          console.error("Error decoding token:", error);
          setUsername("Unknown User");
        }
      }
    }
  }, []);

  return { token, username, isClient };
};

export default function EditClient() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const [whatsappInput, setWhatsappInput] = useState<string>("");
  
  const [clientTypes, setClientTypes] = useState<ClientType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const { token, username, isClient } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    client_type_id: 0,
    address: "",
    whatsapp_number: "",
    email: "",
    modified_by: username,
  });

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      modified_by: username
    }));
  }, [username]);

  const clearMessages = () => {
    setError("");
    setSuccessMessage("");
    setFormErrors({});
  };

  const handleApiError = (response: Response, defaultMessage: string): string => {
    const statusMessages: Record<number, string> = {
      401: "Sesi telah berakhir, silakan login kembali",
      403: "Anda tidak memiliki izin untuk mengakses resource ini",
      404: "Klien tidak ditemukan",
      422: "Data yang dikirim tidak valid",
      500: "Terjadi kesalahan pada server. Silakan coba lagi atau hubungi administrator",
      502: "Server sedang tidak dapat diakses. Silakan coba lagi dalam beberapa menit"
    };

    return statusMessages[response.status] || `${defaultMessage} (status: ${response.status})`;
  };

  const parseWhatsAppNumber = (fullNumber: string): string => {
    if (!fullNumber) return "";
    
    if (fullNumber.startsWith('+62')) {
      return fullNumber.substring(3);
    }
    
    if (fullNumber.startsWith('62')) {
      return fullNumber.substring(2);
    }
    
    if (fullNumber.startsWith('0')) {
      return fullNumber.substring(1);
    }
    
    return fullNumber;
  };

  const handleWhatsAppChange = (value: string) => {
    const numbersOnly = value.replace(/\D/g, '');
    
    const cleanNumber = numbersOnly.startsWith('0') ? numbersOnly.substring(1) : numbersOnly;
    
    const limitedNumber = cleanNumber.substring(0, 12);
    
    setWhatsappInput(limitedNumber);
    
    setFormData(prev => ({
      ...prev,
      whatsapp_number: limitedNumber ? `+62${limitedNumber}` : ""
    }));
    
    if (formErrors.whatsapp_number) {
      setFormErrors(prev => ({
        ...prev,
        whatsapp_number: undefined
      }));
    }
  };

  // Fetch client types (you might need to create this API endpoint)
  const fetchClientTypes = async () => {
    if (!token) return;

    try {
      const response = await fetch("/api/client_types", {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Api-Key": "X-Secret-Key",
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const json = await response.json();
        if (json.code === 200 && json.data.data) {
          setClientTypes(json.data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching client types:", error);
      // Set default client types if API fails
      setClientTypes([
        { id: 1, name: "Personal" },
        { id: 2, name: "Corporate" }
      ]);
    }
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

  // Fetch client data
  const fetchClient = async () => {
    if (!token || !clientId) return;
  
    setIsLoading(true);
    clearMessages();
  
    try {
      const response = await fetch(`/api/clients/id/${clientId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Api-Key": "X-Secret-Key",
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorMessage = handleApiError(response, "Gagal memuat data klien");
        setError(errorMessage);
        return;
      }
  
      const json = await response.json();
      if (json.code === 200 && json.data) {
        const clientData = json.data;
        
        // Parse WhatsApp number untuk input field
        const parsedWhatsApp = parseWhatsAppNumber(clientData.whatsapp_number || "");
        setWhatsappInput(parsedWhatsApp);
        
        // Populate form dengan data klien yang sudah ada
        setFormData({
          name: clientData.name || "",
          client_type_id: clientData.client_type_id || 0,
          address: clientData.address || "",
          whatsapp_number: clientData.whatsapp_number || "", // Simpan format asli untuk sementara
          email: clientData.email || "",
          modified_by: username,
        });
        
        // Jika ada nomor WhatsApp, format ulang dengan +62
        if (parsedWhatsApp) {
          setFormData(prev => ({
            ...prev,
            whatsapp_number: `+62${parsedWhatsApp}`
          }));
        }
      } else {
        setError(json.message || "Gagal memuat data klien");
      }
    } catch (error) {
      console.error("Error fetching client:", error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda");
      } else {
        setError(error instanceof Error ? error.message : "Gagal memuat data klien");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isClient || !token) return;
    
    fetchClientTypes();
    fetchClient();
  }, [isClient, token, clientId, username]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
  
    if (!formData.name.trim()) {
      errors.name = "Nama klien wajib diisi";
    }
  
    if (!formData.client_type_id || formData.client_type_id === 0) {
      errors.client_type_id = "Tipe klien wajib dipilih";
    }
  
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Format email tidak valid";
    }
  
    // Validasi WhatsApp - harus berisi minimal 8 digit setelah +62 jika diisi
    if (formData.whatsapp_number && whatsappInput.length > 0 && whatsappInput.length < 8) {
      errors.whatsapp_number = "Nomor WhatsApp harus minimal 8 digit setelah +62";
    }
  
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear specific field error when user starts typing
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    clearMessages();

    try {
      const response = await fetch(`/api/clients/id/${clientId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Api-Key": "X-Secret-Key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorMessage = handleApiError(response, "Gagal mengupdate klien");
        setError(errorMessage);
        return;
      }

      const json = await response.json();
      
      if (json.code === 200) {
        setSuccessMessage("Klien berhasil diupdate!");
        
        // Redirect to client list after 2 seconds
        setTimeout(() => {
          router.push("/dashboard/client-page");
        }, 2000);
      } else {
        throw new Error(json.message || "Gagal mengupdate klien");
      }

    } catch (error) {
      console.error("Error updating client:", error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda");
      } else {
        setError(error instanceof Error ? error.message : "Terjadi kesalahan saat mengupdate klien");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push("/dashboard/client-page");
  };

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Edit Klien</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Edit Klien
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Edit Klien
          </CardTitle>
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center cursor-pointer"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {successMessage && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Nama Klien <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Masukkan nama klien"
              disabled={isSubmitting}
            />
            {formErrors.name && (
              <p className="text-red-500 text-sm">{formErrors.name}</p>
            )}
          </div>

          {/* Client Type Field */}
          <div className="space-y-2">
            <label htmlFor="client_type_id" className="text-sm font-medium text-gray-700">
              Tipe Klien <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="client_type_id"
                value={formData.client_type_id}
                onChange={(e) => handleInputChange("client_type_id", parseInt(e.target.value))}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white ${
                  formErrors.client_type_id ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isSubmitting}
              >
                <option value={0}>Pilih tipe klien</option>
                {clientTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.id === 1 ? "👤" : "🏢"} {type.name}
                  </option>
                ))}
              </select>
            </div>
            {formErrors.client_type_id && (
              <p className="text-red-500 text-sm">{formErrors.client_type_id}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="contoh@email.com"
              disabled={isSubmitting}
            />
            {formErrors.email && (
              <p className="text-red-500 text-sm">{formErrors.email}</p>
            )}
          </div>

          {/* WhatsApp Number Field */}
          <div className="space-y-2">
            <label htmlFor="whatsapp_number" className="text-sm font-medium text-gray-700">
              Nomor WhatsApp
            </label>
            <div className="flex">
              {/* Prefix +62 yang di-lock */}
              <div className="flex items-center px-3 py-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600 font-medium">
                +62
              </div>
              {/* Input untuk nomor */}
              <input
                id="whatsapp_number"
                type="tel"
                value={whatsappInput}
                onChange={(e) => handleWhatsAppChange(e.target.value)}
                className={`flex-1 p-3 border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.whatsapp_number ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="812345678901"
                disabled={isSubmitting}
                maxLength={12}
              />
            </div>
            {/* Tampilkan nomor lengkap sebagai preview */}
            {whatsappInput && (
              <p className="text-sm text-gray-600">
                Preview: <span className="font-medium text-green-600">+62{whatsappInput}</span>
              </p>
            )}
            {formErrors.whatsapp_number && (
              <p className="text-red-500 text-sm">{formErrors.whatsapp_number}</p>
            )}           
          </div>

          {/* Address Field */}
          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium text-gray-700">
              Alamat
            </label>
            <textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
              placeholder="Masukkan alamat lengkap"
              disabled={isSubmitting}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}