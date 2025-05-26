"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Save, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type ClientType = {
  id: number;
  name: string;
  description: string;
  created_date: string;
  created_by: string;
  modified_date: string;
  modified_by: string;
};

type FormData = {
  name: string;
  client_type_id: number;
  address: string;
  whatsapp_number: string;
  email: string;
  created_by: string;
};

type FormErrors = {
  name?: string;
  client_type_id?: string;
  email?: string;
  whatsapp_number?: string;
};

type LoadingStates = {
  clientTypes: boolean;
  submitting: boolean;
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
            const payload = JSON.parse(atob(tokenParts[1]));
            setUsername(payload.username || payload.sub || "Unknown User");
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

export default function AddClient() {
  const router = useRouter();
  
  const [clientTypes, setClientTypes] = useState<ClientType[]>([]);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    clientTypes: true,
    submitting: false
  });
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
    created_by: username,
  });

  // Update created_by when username changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      created_by: username
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
      404: "Resource tidak ditemukan",
      422: "Data yang dikirim tidak valid",
      500: "Terjadi kesalahan pada server. Silakan coba lagi atau hubungi administrator",
      502: "Server sedang tidak dapat diakses. Silakan coba lagi dalam beberapa menit"
    };

    return statusMessages[response.status] || `${defaultMessage} (status: ${response.status})`;
  };

  // Fetch client types from API
  const fetchClientTypes = async () => {
    if (!token) return;

    setLoadingStates(prev => ({ ...prev, clientTypes: true }));
    
    try {
      const response = await fetch("/api/client_types", {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Api-Key": process.env.NEXT_PUBLIC_API_KEY || "X-Secret-Key",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorMessage = handleApiError(response, "Gagal memuat data tipe klien");
        console.error("Error fetching client types:", errorMessage);
        // Don't show error to user for client types, just use empty array
        setClientTypes([]);
        return;
      }

      const json = await response.json();
      if (json.code === 200 && Array.isArray(json.data)) {
        setClientTypes(json.data);
      } else {
        console.error("Invalid client types response:", json);
        setClientTypes([]);
      }
    } catch (error) {
      console.error("Error fetching client types:", error);
      setClientTypes([]);
    } finally {
      setLoadingStates(prev => ({ ...prev, clientTypes: false }));
    }
  };

  useEffect(() => {
    if (!isClient || !token) return;
    
    // Fetch client types
    fetchClientTypes();
  }, [isClient, token]);

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

    if (formData.whatsapp_number && !/^[0-9+\-\s()]+$/.test(formData.whatsapp_number)) {
      errors.whatsapp_number = "Format nomor WhatsApp tidak valid";
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

    setLoadingStates(prev => ({ ...prev, submitting: true }));
    clearMessages();

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Api-Key": process.env.NEXT_PUBLIC_API_KEY || "X-Secret-Key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorMessage = handleApiError(response, "Gagal menambahkan klien");
        setError(errorMessage);
        return;
      }

      const json = await response.json();
      
      if (json.code === 200 || json.code === 201) {
        setSuccessMessage("Klien berhasil ditambahkan!");
        
        // Reset form
        setFormData({
          name: "",
          client_type_id: 0,
          address: "",
          whatsapp_number: "",
          email: "",
          created_by: username,
        });
        
        // Redirect to client list after 2 seconds
        const timeoutId = setTimeout(() => {
          router.push("/dashboard/client-page");
        }, 2000);

        // Cleanup timeout if component unmounts
        return () => clearTimeout(timeoutId);
      } else {
        throw new Error(json.message || "Gagal menambahkan klien");
      }

    } catch (error) {
      console.error("Error creating client:", error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda");
      } else {
        setError(error instanceof Error ? error.message : "Terjadi kesalahan saat menambahkan klien");
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, submitting: false }));
    }
  };

  const handleBack = () => {
    router.push("/dashboard/client-page");
  };

  const handleReset = () => {
    setFormData({
      name: "",
      client_type_id: 0,
      address: "",
      whatsapp_number: "",
      email: "",
      created_by: username,
    });
    clearMessages();
  };

  // Get client type icon based on name
  const getClientTypeIcon = (typeName: string): string => {
    const name = typeName.toLowerCase();
    if (name.includes('personal') || name.includes('individu')) {
      return "👤";
    } else if (name.includes('corporate') || name.includes('perusahaan')) {
      return "🏢";
    }
    return "📋"; // Default icon
  };

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Tambah Klien</CardTitle>
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

  if (loadingStates.clientTypes) {
    return (
      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5" />
            Tambah Klien
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
            <UserPlus className="mr-2 h-5 w-5" />
            Tambah Klien Baru
          </CardTitle>
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center"
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
              disabled={loadingStates.submitting}
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
                disabled={loadingStates.submitting}
              >
                <option value={0}>Pilih tipe klien</option>
                {clientTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {getClientTypeIcon(type.name)} {type.name}
                    {type.description && ` - ${type.description}`}
                  </option>
                ))}
              </select>
              {clientTypes.length === 0 && !loadingStates.clientTypes && (
                <p className="text-amber-600 text-sm mt-1">
                  ⚠️ Tidak dapat memuat daftar tipe klien
                </p>
              )}
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
              disabled={loadingStates.submitting}
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
            <input
              id="whatsapp_number"
              type="tel"
              value={formData.whatsapp_number}
              onChange={(e) => handleInputChange("whatsapp_number", e.target.value)}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.whatsapp_number ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="081234567890"
              disabled={loadingStates.submitting}
            />
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
              disabled={loadingStates.submitting}
            />
          </div>


          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={loadingStates.submitting}
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={loadingStates.submitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loadingStates.submitting}
              className="flex items-center"
            >
              {loadingStates.submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Klien
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}