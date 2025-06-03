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

type Role = {
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
  username: string;
  email: string;
  password: string;
  role_id: number;
  created_by: string;
};

type FormErrors = {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  role_id?: string;
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

export default function AddUserPage() {
  const router = useRouter();
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [isRolesLoading, setIsRolesLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const { token, username, isClient } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    username: "",
    email: "",
    password: "",
    role_id: 0,
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
  const fetchRoles = async () => {
    if (!token) return;

    setIsRolesLoading(true);
    try {
      const response = await fetch("/api/roles", {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Api-Key": "X-Secret-Key",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorMessage = handleApiError(response, "Gagal memuat data roles");
        setError(errorMessage);
        return;
      }

      const json = await response.json();
      if (json.code === 200 && json.data.data) {
        setRoles(json.data.data);
      } else {
        setError(json.message || "Gagal memuat data roles");
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda");
      } else {
        setError(error instanceof Error ? error.message : "Gagal memuat data roles");
      }
    } finally {
      setIsRolesLoading(false);
    }
  };

  useEffect(() => {
    if (!isClient || !token) return;
    
    fetchRoles();
  }, [isClient, token]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = "Nama wajib diisi";
    }

    if (!formData.username.trim()) {
      errors.username = "Username wajib diisi";
    }

    if (!formData.email.trim()) {
      errors.email = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Format email tidak valid";
    }

    if (!formData.password.trim()) {
      errors.password = "Password wajib diisi";
    } else if (formData.password.length < 8) {
      errors.password = "Password minimal 8 karakter";
    }

    if (!formData.role_id || formData.role_id === 0) {
      errors.role_id = "Role wajib dipilih";
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
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Api-Key": "X-Secret-Key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role_id: formData.role_id,
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
          router.push("/dashboard/user-page");
        }, 2000);
      } else {
        throw new Error(json.message || "Gagal menambahkan user");
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
      username: "",
      email: "",
      password: "",
      role_id: 0,
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
          <CardTitle>Tambah User Baru</CardTitle>
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
              placeholder="Masukkan nama lengkap"
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
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.username ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Masukkan username"
              disabled={isSubmitting}
            />
            {formErrors.username && (
              <p className="text-red-500 text-sm">{formErrors.username}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
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

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.password ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Minimal 8 karakter"
              disabled={isSubmitting}
            />
            {formErrors.password && (
              <p className="text-red-500 text-sm">{formErrors.password}</p>
            )}
            <p className="text-sm text-gray-500">
              Password harus minimal 8 karakter
            </p>
          </div>

          {/* Role Field */}
          <div className="space-y-2">
            <label htmlFor="role_id" className="text-sm font-medium text-gray-700">
              Role <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              {isRolesLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <select
                  id="role_id"
                  value={formData.role_id}
                  onChange={(e) => handleInputChange("role_id", parseInt(e.target.value))}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white ${
                    formErrors.role_id ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isSubmitting}
                >
                  <option value={0}>Pilih role user</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {formErrors.role_id && (
              <p className="text-red-500 text-sm">{formErrors.role_id}</p>
            )}
          </div>

          {/* Submit Buttons */}
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
              type="button"
              variant="secondary"
              onClick={handleReset}
              disabled={isSubmitting}
            >
              Reset Form
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isRolesLoading}
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
                  Tambah User
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}