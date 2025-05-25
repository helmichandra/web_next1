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
import { MoreVertical, Edit, Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton"; 

type User = {
  id: number;
  name: string;
  username: string;
  email: string;
  role_id: number;
  role_name: string;
  created_date: string;
  modified_date: string;
};

type SortDirection = "asc" | "desc";
type OrderField = "name" | "email" | "role_name" | "created_date";

export default function UserPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    user: User | null;
  }>({
    show: false,
    user: null,
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });
  const [sortConfig, setSortConfig] = useState<{
    order: OrderField;
    sort: SortDirection;
  }>({
    order: "created_date",
    sort: "desc"
  });

  const buildApiUrl = () => {
    const params = new URLSearchParams();
    params.append("page", pagination.page.toString());
    params.append("limit", pagination.limit.toString());
    params.append("order", sortConfig.order);
    params.append("sort", sortConfig.sort);
    if (search) params.append("search", search);

    return `/api/users?${params.toString()}`;
  };

  useEffect(() => {
    const fetchUsers = async () => {
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
        const apiUrl = buildApiUrl();
        const response = await fetch(apiUrl, {
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
            setError("Gagal memuat data pengguna (status: " + response.status + ")");
          }
          setUsers([]); // kosongkan data agar tidak menampilkan baris lama
          return;
        }
  
        const json = await response.json();
        if (json.code === 200 && json.data?.data) {
          setUsers(json.data.data);
          setPagination(prev => ({
            ...prev,
            total: json.data.pagination?.total || 0
          }));
        } else {
          setError(json.message || "Gagal memuat data pengguna");
          setUsers([]);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        setError(error instanceof Error ? error.message : "Gagal memuat data pengguna");
      } finally {
        const elapsed = Date.now() - startTime;
        const delay = Math.max(1000 - elapsed, 0); // minimal 1 detik animasi skeleton
        setTimeout(() => {
          setIsLoading(false);
        }, delay);
      }
    };
  
    const debounceTimer = setTimeout(() => {
      fetchUsers();
    }, 500);
  
    return () => clearTimeout(debounceTimer);
  }, [search, pagination.page, pagination.limit, sortConfig.order, sortConfig.sort]);
  

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };
  const handleEdit = (user: User) => {
    router.push(`/dashboard/edit-user/${user.id}`);
  };
  const handleDelete = async (user: User) => {
    // Show confirmation dialog first
    setDeleteConfirmation({
      show: true,
      user: user,
    });
  };
  const confirmDelete = async () => {
    if (!deleteConfirmation.user) return;
  
    const userId = deleteConfirmation.user.id;
    setDeleteLoading(userId);
    setError("");
  
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Token tidak ditemukan, silakan login kembali");
      setDeleteLoading(null);
      return;
    }
  
    try {
      console.log(`Deleting user with ID: ${userId}`);
      
      const response = await fetch(`/api/users/id/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Api-Key": "X-Secret-Key",
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          setError("Sesi telah berakhir atau tidak memiliki akses. Silakan login kembali");
          setDeleteLoading(null);
          setDeleteConfirmation({ show: false, user: null });
          return;
        }
  
        if (response.status === 403) {
          setError("Anda tidak memiliki izin untuk menghapus user ini");
          setDeleteLoading(null);
          setDeleteConfirmation({ show: false, user: null });
          return;
        }
        if (response.status === 500) {
          setError("Terjadi kesalahan pada server. Silakan coba lagi atau hubungi administrator");
          setDeleteLoading(null);
          setDeleteConfirmation({ show: false, user: null });
          return;
        }
  
        if (response.status === 502) {
          setError("Server sedang tidak dapat diakses. Silakan coba lagi dalam beberapa menit");
          setDeleteLoading(null);
          setDeleteConfirmation({ show: false, user: null });
          return;
        }
  
        let errorMessage = `Gagal menghapus user. Status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.log("Delete error response:", errorData);
        } catch (parseError) {
          console.log("Could not parse error response :", parseError);
        }
  
        throw new Error(errorMessage);
      }
      const json = await response.json();
      console.log("Delete success response:", json);

      if (json.code === 200 || json.code === 204) {
        // Remove user from local state to update UI immediately
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
        
        // Show success message (optional)
        setError(""); // Clear any existing errors
        
        // You can add a success toast here if you have toast component
        console.log(`User ${deleteConfirmation.user.name} berhasil dihapus`);
        
      } else {
        throw new Error(json.message || "Gagal menghapus user");
      }

    } catch (err) {
      console.error("Error deleting user:", err);
      
      // Handle network errors
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda");
      } else if (err instanceof Error && err.message.includes('NetworkError')) {
        setError("Terjadi masalah jaringan. Silakan periksa koneksi internet");
      } else {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus user");
      }
    } finally {
      setDeleteLoading(null);
      setDeleteConfirmation({ show: false, user: null });
    }
  }

    const handleSort = (field: OrderField) => {
      setSortConfig(prev => ({
        order: field,
        sort: prev.order === field ? (prev.sort === "asc" ? "desc" : "asc") : "desc"
      }));
      setPagination(prev => ({ ...prev, page: 1 }));
    };
  
  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, user: null });
  };

  const formatDate = (dateString: string) => {
    if (dateString === "0001-01-01T00:00:00Z") return "-";
    return new Date(dateString).toLocaleString();
  };

  const SortIndicator = ({ field }: { field: OrderField }) => {
    if (sortConfig.order !== field) return null;
    return <span className="ml-1">{sortConfig.sort === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <Card className="mt-5">
      <CardHeader>
        <CardTitle>Daftar Pengguna</CardTitle>
      </CardHeader>
      <CardContent>
  
        

        <div className="flex justify-between items-center mb-4 gap-4">
          <input
            type="text"
            placeholder="Cari pengguna..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="p-2 border border-gray-300 rounded text-sm w-1/4"
            />
          <div className="flex items-center space-x-2 pr-100">
            <select
              value={pagination.limit}
              onChange={(e) => setPagination(prev => ({
                ...prev,
                limit: Number(e.target.value),
                page: 1
              }))}
              className="p-2 border border-gray-300 rounded text-sm ml-1"
            >
              <option value={5}>5 per halaman</option>
              <option value={10}>10 per halaman</option>
              <option value={20}>20 per halaman</option>
              <option value={50}>50 per halaman</option>
            </select>
          </div>
          <Button
                onClick={() => router.push("/dashboard/add-user")}
                className="ml-4 hover:bg-gray-400 rounded text-white font-bold py-2 px-4 focus:outline-none focus:shadow-outline flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah User
              </Button>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort("name")} className="cursor-pointer hover:bg-gray-100">
                  Nama <SortIndicator field="name" />
                </TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead onClick={() => handleSort("role_name")} className="cursor-pointer hover:bg-gray-100">
                  Role <SortIndicator field="role_name" />
                </TableHead>
                <TableHead onClick={() => handleSort("created_date")} className="cursor-pointer hover:bg-gray-100">
                  Dibuat Pada <SortIndicator field="created_date" />
                </TableHead>
                <TableHead>Diubah Pada</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: pagination.limit }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-32 animate-pulse" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 animate-pulse" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40 animate-pulse" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 animate-pulse" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28 animate-pulse" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28 animate-pulse" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-full animate-pulse" /></TableCell>
                  </TableRow>
                ))
              ) : users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role_name}</TableCell>
                    <TableCell>{formatDate(user.created_date)}</TableCell>
                    <TableCell>{formatDate(user.modified_date)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Buka menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(user)}
                            disabled={deleteLoading === user.id}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            <span>{deleteLoading === user.id ? "Menghapus..." : "Delete"}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-gray-500">
                    {error
                      ? "Gagal memuat data"
                      : search
                      ? "Pengguna dengan kata kunci tersebut tidak ditemukan."
                      : "Tidak ada data pengguna ditemukan."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>

          </Table>
        </div>

        {/* Pagination */}
        {pagination.total > 0 && (
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Menampilkan {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} pengguna
            </div>
            <div className="flex space-x-2">
              <button onClick={() => handlePageChange(1)} disabled={pagination.page === 1} className="px-3 py-1 border rounded disabled:opacity-50">&lt;&lt;</button>
              <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="px-3 py-1 border rounded disabled:opacity-50">&lt;</button>
              {Array.from({ length: Math.min(5, Math.ceil(pagination.total / pagination.limit)) }, (_, i) => {
                let pageNum;
                const totalPages = Math.ceil(pagination.total / pagination.limit);
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 border rounded ${pagination.page === pageNum ? 'bg-blue-500 text-white' : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)} className="px-3 py-1 border rounded disabled:opacity-50">&gt;</button>
              <button onClick={() => handlePageChange(Math.ceil(pagination.total / pagination.limit))} disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)} className="px-3 py-1 border rounded disabled:opacity-50">&gt;&gt;</button>
            </div>
          </div>
        )}
        {deleteConfirmation.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Konfirmasi Hapus User</h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus user{" "}
                <strong>{deleteConfirmation.user?.name}</strong>?
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
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                  disabled={deleteLoading !== null}
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
