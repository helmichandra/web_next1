"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
import { MoreVertical, Eye, Plus, Trash, AlertCircle, Users, Shield } from "lucide-react";
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

type PaginationState = {
  page: number;
  limit: number;
  total: number;
};

type SortConfig = {
  order: OrderField;
  sort: SortDirection;
};

type DeleteConfirmation = {
  show: boolean;
  user: User | null;
};

// Cache interface - Fixed: Replace 'any' with proper types
interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Cache manager class - Fixed: Replace 'any' with generic types
class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(pattern)
    );
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry?.expiresAt !== undefined && Date.now() <= entry.expiresAt;
  }

  size(): number {
    return this.cache.size;
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
const cache = new CacheManager();

// Cleanup expired cache entries every 5 minutes
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

// Custom hook for token management with caching
const useAuthToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [userRoleId, setUserRoleId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      // Try to get from cache first
      const cachedToken = cache.get<string>('auth_token');
      const cachedRoleId = cache.get<string>('user_role_id');
      
      if (cachedToken && cachedRoleId) {
        setToken(cachedToken);
        setUserRoleId(cachedRoleId);
        return;
      }

      const storedToken = localStorage.getItem("token");
      setToken(storedToken);
      
      // Decode token to get role_id
      if (storedToken) {
        try {
          const decoded = jwtDecode<DecodedToken>(storedToken);
          setUserRoleId(decoded.role_id);
          
          // Cache the token and role_id
          cache.set('auth_token', storedToken, 30 * 60 * 1000); // 30 minutes
          cache.set('user_role_id', decoded.role_id, 30 * 60 * 1000);
        } catch (error) {
          console.error('Failed to decode token for role:', error);
        }
      }
    }
  }, []);

  return { token, userRoleId, isClient };
};

// Custom hook for debounced search
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Define proper types for cached data
interface CachedUsersData {
  users: User[];
  total: number;
}

export default function UserPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    show: false,
    user: null,
  });
  const { token, userRoleId, isClient } = useAuthToken();

  // Debounced search value
  const debouncedSearch = useDebounce(search, 500);

  const canDelete = userRoleId === "1";

  const getRowNumber = (index: number): number => {
    return (pagination.page - 1) * pagination.limit + index + 1;
  };

  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    order: "created_date",
    sort: "desc"
  });

  // Memoized API URL builder
  const buildApiUrl = useMemo((): string => {
    const params = new URLSearchParams();
    params.append("page", pagination.page.toString());
    params.append("limit", pagination.limit.toString());
    params.append("order", sortConfig.order);
    params.append("sort", sortConfig.sort);
    if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());

    return `/api/users?${params.toString()}`;
  }, [pagination.page, pagination.limit, sortConfig.order, sortConfig.sort, debouncedSearch]);

  // Generate cache key for API requests
  const getCacheKey = useCallback((url: string): string => {
    return `users_${url}`;
  }, []);

  const clearMessages = useCallback(() => {
    setError("");
    setSuccessMessage("");
  }, []);

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
        cache.invalidate(); // Clear all cache when token expires
        router.push('/auth/sign-in');
        return;
      }
      
      const timeout = setTimeout(() => {
        toast.warning("Sesi Anda telah habis. Silakan login kembali.");
        localStorage.removeItem('token');
        cache.invalidate(); // Clear all cache when session expires
        setTimeout(() => {
          router.push('/auth/sign-in');
        }, 2000);
      }, 60 * 60 * 1000); // 1 hour
  
      return () => clearTimeout(timeout); 

    } catch (error) {
      console.error('Failed to decode token:', error);
      localStorage.removeItem('token');
      cache.invalidate(); // Clear all cache on token error
      router.push('/auth/sign-in');
    }
  }, [router]);

  const handleApiError = useCallback((response: Response, defaultMessage: string): string => {
    const statusMessages: Record<number, string> = {
      401: "Sesi telah berakhir, silakan login kembali",
      403: "Anda tidak memiliki izin untuk mengakses resource ini",
      404: "Data tidak ditemukan",
      500: "Terjadi kesalahan pada server. Silakan coba lagi atau hubungi administrator",
      502: "Server sedang tidak dapat diakses. Silakan coba lagi dalam beberapa menit"
    };

    return statusMessages[response.status] || `${defaultMessage} (status: ${response.status})`;
  }, []);

  // Cached fetch function
  const fetchUsers = useCallback(async () => {
    if (!token) {
      setError("Token tidak ditemukan, silakan login kembali");
      return;
    }

    const apiUrl = buildApiUrl;
    const cacheKey = getCacheKey(apiUrl);
    
    // Check cache first - Fixed: Use proper typing
    const cachedData = cache.get<CachedUsersData>(cacheKey);
    if (cachedData && !isLoading) {
      setUsers(cachedData.users);
      setPagination(prev => ({
        ...prev,
        total: cachedData.total
      }));
      return;
    }

    setIsLoading(true);
    clearMessages();

    const startTime = Date.now();

    try {
      console.log('Fetching from API:', apiUrl);
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Api-Key": "X-Secret-Key",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorMessage = handleApiError(response, "Gagal memuat data pengguna");
        setError(errorMessage);
        setUsers([]);
        return;
      }

      const json = await response.json();
      if (json.code === 200 && json.data) {
        const usersData = json.data.data || [];
        
        setUsers(usersData);
        
        // Calculate total for pagination
        const newTotal = usersData.length < pagination.limit 
          ? (pagination.page - 1) * pagination.limit + usersData.length
          : Math.max(pagination.total, pagination.page * pagination.limit + 1);
        
        setPagination(prev => ({
          ...prev,
          total: newTotal
        }));

        // Cache the results for 2 minutes - Fixed: Use proper typing
        const cacheData: CachedUsersData = {
          users: usersData,
          total: newTotal
        };
        cache.set(cacheKey, cacheData, 2 * 60 * 1000);
        
      } else {
        setError(json.message || "Gagal memuat data pengguna");
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda");
      } else {
        setError(error instanceof Error ? error.message : "Gagal memuat data pengguna");
      }
      setUsers([]);
    } finally {
      const elapsed = Date.now() - startTime;
      const delay = Math.max(500 - elapsed, 0); // Reduced minimum delay
      setTimeout(() => {
        setIsLoading(false);
      }, delay);
    }
  }, [token, buildApiUrl, getCacheKey, handleApiError, clearMessages, pagination.limit, pagination.page, pagination.total, isLoading]);

  useEffect(() => {
    if (!isClient) return;
    fetchUsers();
  }, [isClient, fetchUsers]);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setPagination(prev => ({
      ...prev,
      limit: newLimit,
      page: 1
    }));
    // Invalidate cache when limit changes
    cache.invalidate('users_');
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPagination(prev => ({ ...prev, page: 1 }));
    // Invalidate cache when search changes
    cache.invalidate('users_');
  }, []);

  const handleEdit = useCallback((user: User) => {
    router.push(`/dashboard/edit-user/${user.id}`);
  }, [router]);

  const handleDelete = useCallback((user: User) => {
    setDeleteConfirmation({
      show: true,
      user: user,
    });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirmation.user || !token) return;

    const userId = deleteConfirmation.user.id;
    setDeleteLoading(userId);
    clearMessages();

    try {
      const response = await fetch(`/api/users/id/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Api-Key": "X-Secret-Key",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorMessage = handleApiError(response, "Gagal menghapus pengguna");
        setError(errorMessage);
        return;
      }

      const json = await response.json();

      if (json.code === 200 || json.code === 204) {
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
        setSuccessMessage(`Pengguna ${deleteConfirmation.user.name} berhasil dihapus`);
        
        // Invalidate cache after successful deletion
        cache.invalidate('users_');
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        throw new Error(json.message || "Gagal menghapus pengguna");
      }

    } catch (err) {
      console.error("Error deleting user:", err);
      
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda");
      } else {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus pengguna");
      }
    } finally {
      setDeleteLoading(null);
      setDeleteConfirmation({ show: false, user: null });
    }
  }, [deleteConfirmation.user, token, clearMessages, handleApiError]);

  const handleSort = useCallback((field: OrderField) => {
    setSortConfig(prev => ({
      order: field,
      sort: prev.order === field ? (prev.sort === "asc" ? "desc" : "asc") : "desc"
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
    // Invalidate cache when sort changes
    cache.invalidate('users_');
  }, []);

  const cancelDelete = useCallback(() => {
    setDeleteConfirmation({ show: false, user: null });
  }, []);

  // Memoized role badge component - Fixed: Define proper React component
  const getRoleBadge = useCallback((roleName: string) => {
    const isAdmin = roleName.toLowerCase().includes("admin");
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        isAdmin 
          ? "bg-red-100 text-red-800" 
          : "bg-blue-100 text-blue-800"
      }`}>
        <Shield className="h-3 w-3 mr-1" />
        {roleName}
      </span>
    );
  }, []);

  // Memoized sort indicator - Fixed: Define proper React component
  const SortIndicator = useCallback(({ field }: { field: OrderField }) => {
    if (sortConfig.order !== field) return null;
    return (
      <span 
        className="ml-1" 
        aria-label={`Sorted ${sortConfig.sort === "asc" ? "ascending" : "descending"}`}
      >
        {sortConfig.sort === "asc" ? "↑" : "↓"}
      </span>
    );
  }, [sortConfig.order, sortConfig.sort]);

  // Memoized pagination info
  const paginationInfo = useMemo(() => {
    const hasNextPage = users.length === pagination.limit;
    const hasPrevPage = pagination.page > 1;
    const startItem = (pagination.page - 1) * pagination.limit + 1;
    const endItem = startItem + users.length - 1;

    return { hasNextPage, hasPrevPage, startItem, endItem };
  }, [users.length, pagination.limit, pagination.page]);

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
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
          <Users className="mr-2 h-5 w-5" />
          Daftar Pengguna
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
            placeholder="Cari pengguna berdasarkan nama atau email..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="p-2 border border-gray-300 rounded text-sm w-full sm:w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Cari pengguna"
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
              onClick={() => router.push("/dashboard/add-user")}
              className="flex items-center bg-teal-600 hover:bg-teal-700 cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah User
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
                  Nama <SortIndicator field="name" />
                </TableHead>
                <TableHead>Username</TableHead>
                <TableHead 
                  onClick={() => handleSort("email")} 
                  className="cursor-pointer hover:bg-gray-100 select-none"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort("email")}
                >
                  Email <SortIndicator field="email" />
                </TableHead>
                <TableHead 
                  onClick={() => handleSort("role_name")} 
                  className="cursor-pointer hover:bg-gray-100 select-none"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort("role_name")}
                >
                  Role <SortIndicator field="role_name" />
                </TableHead>
                <TableHead>Aksi</TableHead>
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
                users.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell className="text-center font-medium text-gray-500">
                      {getRowNumber(index)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {user.name}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {user.username}
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.email || "-"}
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.role_name)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Menu aksi untuk ${user.name}`} className="cursor-pointer">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(user)} className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            <span>Lihat Detail</span>
                          </DropdownMenuItem>
                          {canDelete && (
                            <DropdownMenuItem 
                              onClick={() => handleDelete(user)}
                              disabled={deleteLoading === user.id}
                              className="text-red-600 focus:text-red-600 cursor-pointer"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              <span>{deleteLoading === user.id ? "Menghapus..." : "Hapus"}</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-gray-500 py-8">
                    {debouncedSearch
                      ? "Pengguna dengan kata kunci tersebut tidak ditemukan."
                      : "Tidak ada data pengguna ditemukan."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {users.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
            <div className="text-sm text-gray-600">
              Halaman {pagination.page} - Menampilkan {paginationInfo.startItem} - {paginationInfo.endItem} pengguna
            </div>
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={!paginationInfo.hasPrevPage}
                aria-label="Halaman pertama"
                className="cursor-pointer"
              >
                ≪
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!paginationInfo.hasPrevPage}
                aria-label="Halaman sebelumnya"
                className="cursor-pointer"
              >
                ‹
              </Button>
              
              {/* Tampilkan nomor halaman saat ini */}
              <Button
                variant="default"
                size="sm"
                aria-current="page"
                className="cursor-pointer"
              >
                {pagination.page}
              </Button>
              
              {/* Tampilkan halaman selanjutnya jika ada */}
              {paginationInfo.hasNextPage && (
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
                disabled={!paginationInfo.hasNextPage}
                aria-label="Halaman selanjutnya"
                className="cursor-pointer"
              >
                ›
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!paginationInfo.hasNextPage}
                aria-label="Halaman terakhir"
                className="cursor-pointer"
              >
                ≫
              </Button>
            </div>
          </div>
        )}

        {deleteConfirmation.show && canDelete && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h3 id="delete-title" className="text-lg font-semibold mb-4">
                Konfirmasi Hapus Pengguna
              </h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus pengguna{" "}
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