"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';
import { useRouter } from "next/navigation";

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
};

export default function RolePage() {
  const [search, setSearch] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
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
      }, 1 * 60 * 1000); // 30 menit
  
      return () => clearTimeout(timeout); 

    } catch (error) {
      console.error('Failed to decode token:', error);
      localStorage.removeItem('token');
      router.push('/auth/sign-in');
    }
  }, [router]);

  useEffect(() => {
    const fetchRoles = async () => {
      setIsLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("Token tidak ditemukan, silakan login kembali");
        setIsLoading(false);
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
        console.log("Headers diterima:", response.headers);

        if (!response.ok) {
          if (response.status === 401) {
            setError("Sesi telah berakhir, silakan login kembali");
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return;
        }

        const json = await response.json();
        setRoles(json.data || json); // Sesuaikan dengan struktur respons API
      } catch (error) {
        console.error("Error fetching roles:", error);
        setError("Gagal memuat data roles");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoles();
  }, []);

  const filteredRoles = useMemo(() => {
    return roles.filter((role) =>
      role.name.toLowerCase().includes(search.toLowerCase()) ||
      role.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, roles]);

  return (
    <Card className="mt-5">
      <CardHeader>
        <CardTitle>Informasi Role</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}
        {isLoading && (
          <div className="mb-4 p-2 text-center">Memuat data...</div>
        )}
        <input
          type="text"
          placeholder="Cari role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 p-2 border border-gray-300 rounded w-50 text-sm"
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Role</TableHead>
              <TableHead>Deskripsi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>{role.name}</TableCell>
                <TableCell>{role.description}</TableCell>
              </TableRow>
            ))}
            {filteredRoles.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-sm text-gray-500">
                  {error ? "Gagal memuat data" : "Tidak ada data ditemukan."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}