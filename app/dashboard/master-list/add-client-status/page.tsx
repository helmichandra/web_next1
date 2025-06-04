"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Save, UserPlus } from "lucide-react";
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
  created_by: string;
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

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem("token");
      setToken(storedToken);
      
      if (storedToken) {
        try {
          const tokenParts = storedToken.split('.');
          if (tokenParts.length === 3) {
            const decoded = jwtDecode<DecodedToken>(storedToken);
            if (decoded.username) {
              setUsername(decoded.username);
            }
          }
        } catch (error) {
          console.error("Error decoding token:", error);
          setUsername("Admin");
        }
      }
    }
  }, []);

  return { token, username, isClient };
};

export default function AddClientType() {
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const { token, username, isClient } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    created_by: username || "Admin",
  });

  // Update created_by when username changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      created_by: username || "Admin"
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

  // Fetch roles



  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = "Nama wajib diisi";
    }

    if (!formData.description.trim()) {
      errors.description = "description wajib diisi";
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
      const response = await fetch("/api/client_statuses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Api-Key": "X-Secret-Key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          created_by: formData.created_by
        }),
      });

      if (!response.ok) {
        const errorMessage = handleApiError(response, "Gagal menambahkan user");
        setError(errorMessage);
        return;
      }

      const json = await response.json();
      
      if (json.code === 200 || json.code === 201) {
        setSuccessMessage("User berhasil ditambahkan!");
        
        // Redirect to user list after 2 seconds
        setTimeout(() => {
          router.push("/dashboard/master-list/master-page");
        }, 2000);
      } else {
        throw new Error(json.message || "Gagal menambahkan master data client type");
      }

    } catch (error) {
      console.error("Error adding user:", error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda");
      } else {
        setError(error instanceof Error ? error.message : "Terjadi kesalahan saat menambahkan user");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      description: "",
      created_by: username || "Admin",
    });
    clearMessages();
  };

  const handleBack = () => {
    router.push("/dashboard/user-page");
  };

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Tambah Client Type</CardTitle>
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

  return (
    <Card className="mt-5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5" />
            Tambah User Baru
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
              Nama <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Masukkan Nama Client Type"
              disabled={isSubmitting}
            />
            {formErrors.name && (
              <p className="text-red-500 text-sm">{formErrors.name}</p>
            )}
          </div>

          {/* Username Field */}
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-gray-700">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              id="description"
              type="text"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.description ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Masukkan Description"
              disabled={isSubmitting}
            />
            {formErrors.description && (
              <p className="text-red-500 text-sm">{formErrors.description}</p>
            )}
          </div>



          {/* Submit Buttons */}
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
              type="button"
              variant="secondary"
              onClick={handleReset}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Reset Form
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
                  Tambah Client Type
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}