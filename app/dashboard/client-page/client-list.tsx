"use client";

import { useEffect, useState } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Plus, Trash, AlertCircle, Eye, Building, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';

interface DecodedToken {
  id: string;
  username: string;
  email: string;
  role: string;
  role_id: string;
  exp: number;
}

type Client = {
  id: number;
  name: string;
  client_type_id: number;
  client_type_name: string;
  address: string;
  whatsapp_number: string;
  email: string;
  created_by: string;
  created_date: string;
  modified_by: string;
  modified_date: string;
};

type SortDirection = "ASC" | "DESC";
type OrderField = "name" | "client_type_name" | "email" | "created_date";

type PaginationState = {
  page: number;
  limit: number;
  total: number;
};

type SortConfig = {
  order_by: OrderField;
  sort_by: SortDirection;
};

type DeleteConfirmation = {
  show: boolean;
  client: Client | null;
};

// Custom hook for token management
const useAuthToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [userRoleId, setUserRoleId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem("token");
      setToken(storedToken);
      
      // Decode token to get role_id
      if (storedToken) {
        try {
          const decoded = jwtDecode<DecodedToken>(storedToken);
          setUserRoleId(decoded.role_id);
        } catch (error) {
          console.error('Failed to decode token for role:', error);
        }
      }
    }
  }, []);

  return { token, userRoleId, isClient };
};

export default function ClientList() {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    show: false,
    client: null,
  });
  const router = useRouter();
  
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    order_by: "created_date",
    sort_by: "DESC"
  });

  const { token, userRoleId, isClient } = useAuthToken();
  
  // Check if user has delete permission (only role_id = "1" can delete)
  const canDelete = userRoleId === "1";

  const getRowNumber = (index: number): number => {
    return (pagination.page - 1) * pagination.limit + index + 1;
  };

  const buildApiUrl = (): string => {
    const params = new URLSearchParams();
    params.append("page", pagination.page.toString());
    params.append("limit", pagination.limit.toString());
    params.append("order_by", sortConfig.order_by);
    params.append("sort_by", sortConfig.sort_by);
    if (search.trim()) params.append("search", search.trim());

    return `/api/clients?${params.toString()}`;
  };

  const clearMessages = () => {
    setError("");
    setSuccessMessage("");
  };

  const handleApiError = (response: Response, defaultMessage: string): string => {
    const statusMessages: Record<number, string> = {
      401: "Sesi telah berakhir, silakan login kembali",
      403: "Anda tidak memiliki izin untuk mengakses resource ini",
      404: "Data tidak ditemukan",
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

  useEffect(() => {
    if (!isClient) return;

    const fetchClients = async () => {
      setIsLoading(true);
      clearMessages();

      if (!token) {
        setError("Token tidak ditemukan, silakan login kembali");
        setIsLoading(false);
        return;
      }

      const startTime = Date.now();

      try {
        const apiUrl = buildApiUrl();
        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Api-Key": "X-Secret-Key",
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorMessage = handleApiError(response, "Gagal memuat data klien");
          setError(errorMessage);
          setClients([]);
          return;
        }

        const json = await response.json();
        if (json.code === 200 && json.data) {
          const clientsData = json.data.data || [];
          
          setClients(clientsData);
          
          // ✅ PERBAIKAN UTAMA: Logika pagination yang benar
          setPagination(prev => {
            // Jika data yang dikembalikan kurang dari limit, berarti ini halaman terakhir
            if (clientsData.length < prev.limit) {
              return {
                ...prev,
                total: (prev.page - 1) * prev.limit + clientsData.length
              };
            } else {
              // Jika data sama dengan limit, asumsi masih ada data lagi
              // Set total lebih besar untuk memungkinkan next page
              return {
                ...prev,
                total: Math.max(prev.total, prev.page * prev.limit + 1)
              };
            }
          });
        } else {
          setError(json.message || "Gagal memuat data klien");
          setClients([]);
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
        if (error instanceof TypeError && error.message.includes('fetch')) {
          setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda");
        } else {
          setError(error instanceof Error ? error.message : "Gagal memuat data klien");
        }
        setClients([]);
      } finally {
        const elapsed = Date.now() - startTime;
        const delay = Math.max(1000 - elapsed, 0);
        setTimeout(() => {
          setIsLoading(false);
        }, delay);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchClients();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [search, pagination.page, pagination.limit, sortConfig.order_by, sortConfig.sort_by, token, isClient]);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({
      ...prev,
      limit: newLimit,
      page: 1
    }));
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleEdit = (client: Client) => {
    router.push(`/dashboard/edit-client/${client.id}`);
  };

  // ✅ PERBAIKAN: Sudah benar mengarah ke halaman service
  const handleService = (client: Client) => {
    router.push(`/dashboard/service-page?clientId=${client.id}`);
  };

  const handleDelete = (client: Client) => {
    setDeleteConfirmation({
      show: true,
      client: client,
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.client || !token) return;

    const clientId = deleteConfirmation.client.id;
    setDeleteLoading(clientId);
    clearMessages();

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Api-Key": "X-Secret-Key",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorMessage = handleApiError(response, "Gagal menghapus klien");
        setError(errorMessage);
        return;
      }

      const json = await response.json();

      if (json.code === 200 || json.code === 204) {
        setClients(prevClients => prevClients.filter(c => c.id !== clientId));
        setSuccessMessage(`Klien ${deleteConfirmation.client.name} berhasil dihapus`);
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        throw new Error(json.message || "Gagal menghapus klien");
      }

    } catch (err) {
      console.error("Error deleting client:", err);
      
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda");
      } else {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus klien");
      }
    } finally {
      setDeleteLoading(null);
      setDeleteConfirmation({ show: false, client: null });
    }
  };

  const handleSort = (field: OrderField) => {
    setSortConfig(prev => ({
      order_by: field,
      sort_by: prev.order_by === field ? (prev.sort_by === "ASC" ? "DESC" : "ASC") : "DESC"
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, client: null });
  };

  const getClientTypeIcon = (clientTypeName: string) => {
    return clientTypeName === "Corporate" ? (
      <Building className="h-4 w-4 text-blue-600" />
    ) : (
      <User className="h-4 w-4 text-green-600" />
    );
  };

  const getClientTypeBadge = (clientTypeName: string) => {
    const isCorporate = clientTypeName === "Corporate";
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        isCorporate 
          ? "bg-blue-100 text-blue-800" 
          : "bg-green-100 text-green-800"
      }`}>
        {getClientTypeIcon(clientTypeName)}
        <span className="ml-1">{clientTypeName}</span>
      </span>
    );
  };

  const SortIndicator = ({ field }: { field: OrderField }) => {
    if (sortConfig.order_by !== field) return null;
    return (
      <span 
        className="ml-1" 
        aria-label={`Sorted ${sortConfig.sort_by === "ASC" ? "ascending" : "descending"}`}
      >
        {sortConfig.sort_by === "ASC" ? "↑" : "↓"}
      </span>
    );
  };

  // ✅ PERBAIKAN: Logika pagination yang benar
  const hasNextPage = clients.length === pagination.limit;
  const hasPrevPage = pagination.page > 1;
  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = startItem + clients.length - 1;



  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Daftar Klien</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-5">
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="mr-2 h-5 w-5" />
          Daftar Klien
        </CardTitle>
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

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <input
            type="text"
            placeholder="Cari klien berdasarkan nama atau email..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="p-2 border border-gray-300 rounded text-sm w-full sm:w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Cari klien"
          />
          
          <div className="flex items-center space-x-2">
            <select
              value={pagination.limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              aria-label="Jumlah item per halaman"
            >
              <option value={5}>5 per halaman</option>
              <option value={10}>10 per halaman</option>
              <option value={20}>20 per halaman</option>
              <option value={50}>50 per halaman</option>
            </select>
            
            <Button
              onClick={() => router.push("/dashboard/add-client")}
              className="flex items-center bg-teal-600 hover:bg-teal-700 cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4 " />
              Tambah Klien
            </Button>
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">
                  No.
                </TableHead>
                <TableHead 
                  onClick={() => handleSort("name")} 
                  className="cursor-pointer hover:bg-gray-100 select-none"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort("name")}
                >
                  Nama Klien <SortIndicator field="name" />
                </TableHead>
                <TableHead 
                  onClick={() => handleSort("client_type_name")} 
                  className="cursor-pointer hover:bg-gray-100 select-none"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort("client_type_name")}
                >
                  Tipe Klien <SortIndicator field="client_type_name" />
                </TableHead>
                <TableHead 
                  onClick={() => handleSort("email")} 
                  className="cursor-pointer hover:bg-gray-100 select-none"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort("email")}
                >
                  Email <SortIndicator field="email" />
                </TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: pagination.limit }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-40 animate-pulse" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 animate-pulse" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32 animate-pulse" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28 animate-pulse" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32 animate-pulse" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 animate-pulse" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28 animate-pulse" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-full animate-pulse" /></TableCell>
                  </TableRow>
                ))
              ) : clients.length > 0 ? (
                clients.map((client, index) => (
                  <TableRow key={client.id}>
                    <TableCell className="text-center font-medium text-gray-500">
                      {getRowNumber(index)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {client.name}
                    </TableCell>
                    <TableCell>
                      {getClientTypeBadge(client.client_type_name)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {client.email || "-"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {client.whatsapp_number || "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {client.address || "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Menu aksi untuk ${client.name}`} className="cursor-pointer">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(client)} className="cursor-pointer"> 
                            <Eye className="mr-2 h-4 w-4" />
                            <span>Lihat Detail</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleService(client)} className="cursor-pointer"> 
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Kelola Layanan</span>
                          </DropdownMenuItem>
                          {canDelete && (
                            <DropdownMenuItem 
                              onClick={() => handleDelete(client)}
                              disabled={deleteLoading === client.id}
                              className="text-red-600 focus:text-red-600 cursor-pointer"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              <span>{deleteLoading === client.id ? "Menghapus..." : "Hapus"}</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-gray-500 py-8">
                    {search
                      ? "Klien dengan kata kunci tersebut tidak ditemukan."
                      : "Tidak ada data klien ditemukan."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ✅ PERBAIKAN: Pagination dengan logika yang benar */}
        {clients.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
            <div className="text-sm text-gray-600">
              Halaman {pagination.page} - Menampilkan {startItem} - {endItem} klien
            </div>
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={!hasPrevPage}
                aria-label="Halaman pertama"
                className="cursor-pointer"
              >
                ≪
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!hasPrevPage}
                className="cursor-pointer"
                aria-label="Halaman sebelumnya"
              >
                ‹
              </Button>
              
              {/* Tampilkan nomor halaman saat ini */}
              <Button
                variant="default"
                size="sm"
                className="cursor-pointer"
                aria-current="page"
              >
                {pagination.page}
              </Button>
              
              {/* Tampilkan halaman selanjutnya jika ada */}
              {hasNextPage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  aria-label={`Halaman ${pagination.page + 1}`}
                  className="cursor-pointer"
                >
                  {pagination.page + 1}
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!hasNextPage}
                className="cursor-pointer"
                aria-label="Halaman selanjutnya"
              >
                ›
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!hasNextPage}
                aria-label="Halaman terakhir"
                className="cursor-pointer"
              >
                ≫
              </Button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal - Only show if user has delete permission */}
        {deleteConfirmation.show && canDelete && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h3 id="delete-title" className="text-lg font-semibold mb-4">
                Konfirmasi Hapus Klien
              </h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus klien{" "}
                <strong>{deleteConfirmation.client?.name}</strong>?
                <br />
                <span className="text-red-500 text-sm">
                  Tindakan ini tidak dapat dibatalkan.
                </span>
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={cancelDelete}
                  disabled={deleteLoading !== null}
                  className="cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                  disabled={deleteLoading !== null}
                  className="cursor-pointer"
                >
                  {deleteLoading ? "Menghapus..." : "Hapus"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}