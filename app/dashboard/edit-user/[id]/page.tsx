"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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

type UserDetail = {
  id: number;
  name: string;
  username: string;
  email: string;
  role_id: number;
  role_name: string;
};

type Role = {
  id: number;
  name: string;
  description: string;
  created_date: string;
  created_by: string;
  modified_date: string;
  modified_by: string;
};

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);

  const [user, setUser] = useState<UserDetail>({
    id: 0,
    name: "",
    username: "",
    email: "",
    role_id: 0,
    role_name: "",
  });

  const userId = params.id as string;

  // Fetch roles from API
  useEffect(() => {
    const fetchRoles = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("Token tidak ditemukan, silakan login kembali");
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
      }
    };

    fetchRoles();
  }, []);

  useEffect(() => {
    const fetchUserDetail = async () => {
      setIsLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Token tidak ditemukan, silakan login kembali");
        setIsLoading(false);
        return;
      }
      const startTime = Date.now();

      try {
        const response = await fetch(`/api/users/id/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Api-Key": "X-Secret-Key",
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError("Sesi telah berakhir, silakan login kembali");
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return;
        }

        const json = await response.json();
        if (json.code === 200 && json.data) {
          setUser(json.data);
        } else {
          throw new Error(json.message || "Gagal memuat detail pengguna");
        }
      } catch (error) {
        console.error("Error fetching user detail:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Gagal memuat detail pengguna"
        );
      } finally {
        const elapsed = Date.now() - startTime;
        const delay = Math.max(1000 - elapsed, 0); // minimal 1 detik animasi skeleton
        setTimeout(() => {
          setIsLoading(false);
        }, delay);
      }
    };

    if (userId) {
      fetchUserDetail();
    }
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    // Find the selected role from the roles array
    const selectedRole = roles.find(role => role.name === value);
    if (selectedRole) {
      setUser((prev) => ({ 
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

    try {
      const response = await fetch(`/api/users/id/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
            "X-Api-Key": "X-Secret-Key",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: user.name,
          username: user.username,
          email: user.email,
          // password: "Password123!", // ganti dengan password baru atau kosong
          role_id: user.role_id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Update gagal. Status: ${response.status}`);
      }

      const json = await response.json();
      if (json.code === 200) {
        router.push("/dashboard/user-page");
      } else {
        throw new Error(json.message || "Gagal memperbarui data");
      }
    } catch (err) {
      console.error("Error updating user:", err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 p-10">
        <Card>
          <CardHeader>
            <CardTitle>
              {isLoading ? (
                <Skeleton className="h-6 w-40" />
              ) : (
                `Edit User ${user.name}`
              )}
            </CardTitle>
          </CardHeader>

          {isLoading ? (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div className="space-y-2" key={i}>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama</Label>
                    <Input
                      id="name"
                      name="name"
                      value={user.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      value={user.username}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={user.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={user.role_name}
                      onValueChange={handleSelectChange}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Pilih role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.name}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </main>
    </div>
  );
}