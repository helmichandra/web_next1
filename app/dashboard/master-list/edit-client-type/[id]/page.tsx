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
};

// Custom hook for token management and user info
const useAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Add loading state

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
    setIsLoading(false); // Set loading to false after processing
  }, []);

  return { token, username, isClient, isLoading };
};

export default function EditClientType() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const { token, username, isClient, isLoading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    modified_by: "",
  });

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
    if (!token || !clientId || !username) { // Add username check
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/client_types/id/${clientId}`, {
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
        
        // Populate form with existing client data and ensure modified_by is set
        setFormData({
          name: clientData.name || "",
          description: clientData.description || "",
          modified_by: username, // Always use current username
        });
        
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

  // Separate useEffect for handling auth state changes
  useEffect(() => {
    if (isClient && !authLoading) {
      if (!token) {
        setIsLoading(false);
        setError("Token tidak ditemukan, silakan login kembali");
        return;
      }
      
      if (!clientId) {
        setIsLoading(false);
        setError("ID klien tidak valid");
        return;
      }

      // Only fetch when we have username (means token is decoded)
      if (username) {
        fetchClient();
      }
    }
  }, [isClient, authLoading, token, clientId, username]);

  // Additional useEffect to update modified_by when username changes
  useEffect(() => {
    if (username && formData.name) { // Only update if we already have form data
      setFormData(prev => ({
        ...prev,
        modified_by: username
      }));
    }
  }, [username]);

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

    // Ensure modified_by is set before submitting
    const submitData = {
      ...formData,
      modified_by: username || formData.modified_by || "Unknown User"
    };

    setIsSubmitting(true);
    clearMessages();

    try {
      const response = await fetch(`/api/client_types/id/${clientId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Api-Key": "X-Secret-Key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData), // Use submitData instead of formData
      });

      console.log("Update response:", response);
      console.log("Data being sent:", submitData); // Debug log

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
        throw new Error(json.message || "Gagal mengupdate client type");
      }

    } catch (error) {
      console.error("Error updating client type:", error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda");
      } else {
        setError(error instanceof Error ? error.message : "Terjadi kesalahan saat mengupdate client type");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push("/dashboard/master-list/master-page");
  };

  // Show loading skeleton during client-side hydration or auth loading
  if (!isClient || authLoading) {
    return (
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Edit Client Type</CardTitle>
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
            Edit Client Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="flex justify-end space-x-3">
              <Skeleton className="h-10 w-20" />
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
            Edit Client Type
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
              Nama Client Type <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Masukkan nama client type"
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
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center"
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