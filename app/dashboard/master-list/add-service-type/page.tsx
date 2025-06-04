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
  price: number;
  created_by: string;
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

export default function AddServiceType() {
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const { token, username, isClient } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    price: 0,
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

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = "Nama wajib diisi";
    }

    if (!formData.description.trim()) {
      errors.description = "Description wajib diisi";
    }
    
    if (!formData.price || formData.price <= 0) {
      errors.price = "Price harus lebih besar dari 0";
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

  // Special handler for price field to handle number conversion
  const handlePriceChange = (value: string) => {
    const numericValue = parseFloat(value) || 0;
    handleInputChange("price", numericValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    clearMessages();

    console.log("Form data being submitted:", formData); // Debug log

    try {
      const response = await fetch("/api/service_types", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Api-Key": "X-Secret-Key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: formData.price,
          created_by: formData.created_by
        }),
      });

      console.log("API Response:", response); // Debug log

      if (!response.ok) {
        const errorMessage = handleApiError(response, "Gagal menambahkan service type");
        setError(errorMessage);
        return;
      }

      const json = await response.json();
      
      if (json.code === 200 || json.code === 201) {
        setSuccessMessage("Service Type berhasil ditambahkan!");
        
        // Redirect to master list after 2 seconds
        setTimeout(() => {
          router.push("/dashboard/master-list/master-page");
        }, 2000);
      } else {
        throw new Error(json.message || "Gagal menambahkan service type");
      }

    } catch (error) {
      console.error("Error adding service type:", error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda");
      } else {
        setError(error instanceof Error ? error.message : "Terjadi kesalahan saat menambahkan service type");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      created_by: username || "Admin",
    });
    clearMessages();
  };

  const handleBack = () => {
    router.push("/dashboard/master-list/master-page");
  };

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Tambah Service Type</CardTitle>
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
            Tambah Service Type Baru
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
              Nama Service Type <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Masukkan nama service type"
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

          {/* Price Field */}
          <div className="space-y-2">
            <label htmlFor="price" className="text-sm font-medium text-gray-700">
              Price <span className="text-red-500">*</span>
            </label>
            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price || ""}
              onChange={(e) => handlePriceChange(e.target.value)}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.price ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Masukkan harga (contoh: 100000)"
              disabled={isSubmitting}
            />
            {formErrors.price && (
              <p className="text-red-500 text-sm">{formErrors.price}</p>
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
                  Tambah Service Type
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}