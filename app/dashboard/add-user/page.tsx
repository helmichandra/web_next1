"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card, CardContent, CardHeader, CardTitle, CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type Role = {
  id: number;
  name: string;
  description: string;
  created_date: string;
  created_by: string;
  modified_date: string;
  modified_by: string;
};

type AddUserForm = {
  name: string;
  username: string;
  email: string;
  password: string;
  role_id: number;
  role_name: string;
};

export default function AddUserPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isRolesLoading, setIsRolesLoading] = useState(true);
  const [error, setError] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);

  const [formData, setFormData] = useState<AddUserForm>({
    name: "",
    username: "",
    email: "",
    password: "",
    role_id: 0,
    role_name: "",
  });

  // Fetch roles from API
  useEffect(() => {
    const fetchRoles = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("Token tidak ditemukan, silakan login kembali");
        setIsRolesLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/roles", {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Api-Key": "X-Secret-Key",
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        if (json.code === 200 && json.data) {
          setRoles(json.data);
        } else {
          throw new Error(json.message || "Gagal memuat data roles");
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Gagal memuat data roles"
        );
      } finally {
        setIsRolesLoading(false);
      }
    };

    fetchRoles();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    // Find the selected role from the roles array
    const selectedRole = roles.find(role => role.name === value);
    if (selectedRole) {
      setFormData((prev) => ({ 
        ...prev, 
        role_name: selectedRole.name, 
        role_id: selectedRole.id 
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Token tidak ditemukan, silakan login kembali");
      setIsLoading(false);
      return;
    }

    // Validation
    if (!formData.name || !formData.username || !formData.email || !formData.password || !formData.role_id) {
      setError("Semua field harus diisi");
      setIsLoading(false);
      return;
    }

    // Password validation
    if (formData.password.length < 8) {
      setError("Password minimal 8 karakter");
      setIsLoading(false);
      return;
    }

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
          created_by: "Admin" // You can get this from current user context
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Gagal menambah user. Status: ${response.status}`);
      }

      const json = await response.json();
      if (json.code === 200 || json.code === 201) {
        router.push("/dashboard/user-page");
      } else {
        throw new Error(json.message || "Gagal menambahkan user");
      }
    } catch (err) {
      console.error("Error adding user:", err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menambah user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      username: "",
      email: "",
      password: "",
      role_id: 0,
      role_name: "",
    });
    setError("");
  };

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 p-10">
        <Card>
          <CardHeader>
            <CardTitle>Tambah User Baru</CardTitle>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nama <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Masukkan nama lengkap"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">
                    Username <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Masukkan username"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="contoh@email.com"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimal 8 karakter"
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                  <p className="text-sm text-gray-500">
                    Password harus minimal 8 karakter
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="role">
                    Role <span className="text-red-500">*</span>
                  </Label>
                  {isRolesLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={formData.role_name}
                      onValueChange={handleSelectChange}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Pilih role user" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.name}>
                            {role.name} - {role.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  Kembali
                </Button>
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  Reset Form
                </Button>
              </div>
              <Button 
                type="submit" 
                disabled={isLoading || isRolesLoading || !formData.role_id}
              >
                {isLoading ? "Menyimpan..." : "Tambah User"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}