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
}

interface ServiceCategory {
  id: number;
  name: string;
  description: string;
  created_date: string;
  created_by: string;
  modified_date: string;
  modified_by: string;
}

type FormData = {
  name: string;
  description: string;
  price: number;
  service_category_id: number | null;
  service_category_name: string;
  is_need_vendor: string;
  modified_by: string;
};

type FormErrors = {
  name?: string;
  description?: string;
  price?: string;
  service_category_id?: string;
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

export default function EditServiceType() {
  const params = useParams();
  const router = useRouter();
  const serviceTypeId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const { token, username, isClient } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    price: 0,
    service_category_id: null,
    service_category_name: "",
    is_need_vendor: "0",
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

  // Fetch service categories
  useEffect(() => {
    const fetchServiceCategories = async () => {
      if (!token) return;
      
      try {
        setIsLoadingCategories(true);
        const response = await fetch("/api/service_categories/all", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Api-Key": "X-Secret-Key",
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch service categories: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.code === 200 && result.data) {
          setServiceCategories(result.data);
        } else {
          throw new Error(result.message || "Failed to load service categories");
        }
      } catch (error) {
        console.error("Error fetching service categories:", error);
        toast.error("Gagal memuat kategori service");
      } finally {
        setIsLoadingCategories(false);
      }
    };

    if (token) {
      fetchServiceCategories();
    }
  }, [token]);

  const clearMessages = () => {
    setError("");
    setSuccessMessage("");
    setFormErrors({});
  };

  const handleApiError = (response: Response, defaultMessage: string): string => {
    const statusMessages: Record<number, string> = {
      401: "Sesi telah berakhir, silakan login kembali",
      403: "Anda tidak memiliki izin untuk mengakses resource ini",
      404: "Service Type tidak ditemukan",
      422: "Data yang dikirim tidak valid",
      500: "Terjadi kesalahan pada server. Silakan coba lagi atau hubungi administrator",
      502: "Server sedang tidak dapat diakses. Silakan coba lagi dalam beberapa menit"
    };

    return statusMessages[response.status] || `${defaultMessage} (status: ${response.status})`;
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

  // Fetch service type data
  const fetchServiceType = async () => {
    if (!token || !serviceTypeId) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/service_types/id/${serviceTypeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Api-Key": "X-Secret-Key",
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorMessage = handleApiError(response, "Gagal memuat data service type");
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      const json = await response.json();
      console.log("API Response:", json);
      
      if (json.code === 200 && json.data) {
        const serviceTypeData = json.data;
        
        // Populate form with existing service type data
        setFormData(prev => ({
          name: serviceTypeData.name || "",
          description: serviceTypeData.description || "",
          price: serviceTypeData.price || 0,
          service_category_id: serviceTypeData.service_category_id || null,
          service_category_name: serviceTypeData.service_category_name || "",
          is_need_vendor: serviceTypeData.is_need_vendor || "0",
          modified_by: prev.modified_by || username, // Keep existing username
        }));
        
        setError(""); // Clear any previous errors
      } else {
        setError(json.message || "Gagal memuat data service type");
      }
    } catch (error) {
      console.error("Error fetching service type:", error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda");
      } else {
        setError(error instanceof Error ? error.message : "Gagal memuat data service type");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch when we have both client-side hydration and token
    if (isClient && token && serviceTypeId) {
      fetchServiceType();
    } else if (isClient && !token) {
      // If no token, stop loading and show error
      setIsLoading(false);
      setError("Token tidak ditemukan, silakan login kembali");
    } else if (isClient && !serviceTypeId) {
      // If no serviceTypeId, stop loading and show error
      setIsLoading(false);
      setError("ID service type tidak valid");
    }
  }, [isClient, token, serviceTypeId]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = "Nama service type wajib diisi";
    }

    if (!formData.description.trim()) {
      errors.description = "Description wajib diisi";
    }

    if (!formData.price || formData.price <= 0) {
      errors.price = "Price harus lebih besar dari 0";
    }

    if (!formData.service_category_id) {
      errors.service_category_id = "Service Category wajib dipilih";
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

  // Handler for service category selection
  const handleServiceCategoryChange = (value: string) => {
    const categoryId = parseInt(value);
    const selectedCategory = serviceCategories.find(cat => cat.id === categoryId);
    
    setFormData(prev => ({
      ...prev,
      service_category_id: categoryId,
      service_category_name: selectedCategory?.name || ""
    }));

    // Clear service category error
    if (formErrors.service_category_id) {
      setFormErrors(prev => ({
        ...prev,
        service_category_id: undefined
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
      const response = await fetch(`/api/service_types/id/${serviceTypeId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Api-Key": "X-Secret-Key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: formData.price,
          service_category_id: formData.service_category_id,
          service_category_name: formData.service_category_name,
          is_need_vendor: formData.is_need_vendor,
          modified_by: formData.modified_by
        }),
      });

      console.log("Update response:", response);

      if (!response.ok) {
        const errorMessage = handleApiError(response, "Gagal mengupdate service type");
        setError(errorMessage);
        return;
      }

      const json = await response.json();
      
      if (json.code === 200) {
        setSuccessMessage("Service Type berhasil diupdate!");
        
        // Redirect to master list after 2 seconds
        setTimeout(() => {
          router.push("/dashboard/master-list/master-page");
        }, 2000);
      } else {
        throw new Error(json.message || "Gagal mengupdate service type");
      }

    } catch (error) {
      console.error("Error updating service type:", error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda");
      } else {
        setError(error instanceof Error ? error.message : "Terjadi kesalahan saat mengupdate service type");
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
          <CardTitle>Edit Service Type</CardTitle>
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
            Edit Service Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
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
            Edit Service Type
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

          {/* Service Category Field */}
          <div className="space-y-2">
            <label htmlFor="service_category" className="text-sm font-medium text-gray-700">
              Service Category <span className="text-red-500">*</span>
            </label>
            {isLoadingCategories ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <select
                id="service_category"
                value={formData.service_category_id || ""}
                onChange={(e) => handleServiceCategoryChange(e.target.value)}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.service_category_id ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isSubmitting}
              >
                <option value="">Pilih Service Category</option>
                {serviceCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
            {formErrors.service_category_id && (
              <p className="text-red-500 text-sm">{formErrors.service_category_id}</p>
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

          {/* Is Need Vendor Field */}
          <div className="space-y-2">
            <label htmlFor="is_need_vendor" className="text-sm font-medium text-gray-700">
              Perlu Vendor
            </label>
            <select
              id="is_need_vendor"
              value={formData.is_need_vendor}
              onChange={(e) => handleInputChange("is_need_vendor", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="0">Tidak</option>
              <option value="1">Ya</option>
            </select>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">

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