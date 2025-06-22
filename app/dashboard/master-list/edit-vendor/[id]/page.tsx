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

interface DecodedToken {
  id: string;
  username: string;
  email: string;
  role: string;
  exp: number;
}

type FormData = {
  name: string;
  description: string;
  modified_by: string;
};

type FormErrors = {
  name?: string;
  description?: string;
  price?: string;
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
      
      if (storedToken) {
        try {
          const decoded = jwtDecode<DecodedToken>(storedToken);
          if (decoded.username) {
            setUsername(decoded.username);
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

export default function EditVendor() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const { token, username, isClient } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    modified_by: "",
  });

  // Update modified_by when username changes
  useEffect(() => {
    if (username) {
      setFormData(prev => ({
        ...prev,
        modified_by: username
      }));
    }
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

  // Fetch client data
  const fetchClient = async () => {
    if (!token || !clientId) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/vendors/id/${clientId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Api-Key": "X-Secret-Key",
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorMessage = handleApiError(response, "Gagal memuat data klien");
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      const json = await response.json();
      console.log("API Response:", json);
      
      if (json.code === 200 && json.data) {
        const clientData = json.data;
        
        // Populate form with existing client data
        setFormData(prev => ({
          name: clientData.name || "",
          description: clientData.description || "",
          modified_by: prev.modified_by || username, // Keep existing username
        }));
        
        setError(""); // Clear any previous errors
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
    // Only fetch when we have both client-side hydration and token
    if (isClient && token && clientId) {
      fetchClient();
    } else if (isClient && !token) {
      // If no token, stop loading and show error
      setIsLoading(false);
      setError("Token tidak ditemukan, silakan login kembali");
    } else if (isClient && !clientId) {
      // If no clientId, stop loading and show error
      setIsLoading(false);
      setError("ID klien tidak valid");
    }
  }, [isClient, token, clientId]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = "Nama klien wajib diisi";
    }

    if (!formData.description.trim()) {
      errors.description = "Description wajib diisi";
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
      const response = await fetch(`/api/vendors/id/${clientId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Api-Key": "X-Secret-Key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      console.log("Update response:", response);

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
          router.push("/dashboard/master-list/master-page");
        }, 2000);
      } else {
        throw new Error(json.message || "Gagal mengupdate vendor");
      }

    } catch (error) {
      console.error("Error updating vendor:", error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda");
      } else {
        setError(error instanceof Error ? error.message : "Terjadi kesalahan saat mengupdate vendor");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push("/dashboard/master-list/master-page");
  };

  // Show loading skeleton during client-side hydration
  if (!isClient) {
    return (
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Edit Vendor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show loading skeleton while fetching data
  if (isLoading) {
    return (
      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Edit Vendor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <div className="flex justify-end space-x-3">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
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
            Edit Vendor
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
              Nama Vendor <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Masukkan nama Vendor"
              disabled={isSubmitting}
            />
            {formErrors.name && (
              <p className="text-red-500 text-sm">{formErrors.name}</p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.description ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Masukkan description"
              disabled={isSubmitting}
              rows={4}
            />
            {formErrors.description && (
              <p className="text-red-500 text-sm">{formErrors.description}</p>
            )}
          </div>


          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="cursor-pointer"
              disabled={isSubmitting}
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