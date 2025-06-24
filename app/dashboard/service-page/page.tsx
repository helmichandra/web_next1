
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
import { MoreVertical, Eye, Plus, Trash, AlertCircle, Users, Shield, BadgePlus, MessageCircleCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';


interface DecodedToken {
  id: string;
  username: string;
  email: string;
  role: string;
  exp: number;
}
type Service = {
  id: number;
  service_detail_name: string;
  client_id: number;
  client_name: string;
  service_type_id: number;
  service_name: string;
  vendor_id: number;
  vendor_name: string;
  domain_name?: string;
  base_price: number;
  normal_price: number;
  is_discount: boolean;
  discount_type: string;
  discount: number;
  final_price: number;
  notes: string;
  status: number;
  status_name: string;
  start_date: string;
  end_date: string;
  handled_by: string;
  pic: string;
  created_date: string;
  created_by: string;
  modified_date: string;
  modified_by: string;
};

type SortDirection = "asc" | "desc";
type OrderField = "id" | "client_id" | "client_name" | "service_name" | "vendor_name" | "base_price" | "normal_price" | "discount_type" | "discount" | "final_price" | "status_name" | "start_date" | "end_date" | "handled_by" | "pic";

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
  service: Service | null;
};

// Custom hook for token management
const useAuthToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem("token"));
    }
  }, []);
  return { token, isClient };
};

export const metadata = {
  title: 'Halaman Layanan',
};

export default function ServicesPage() {
  const [search, setSearch] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    show: false,
    service: null,
  });
  const getRowNumber = (index: number): number => {
    return (pagination.page - 1) * pagination.limit + index + 1;
  };
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    order: "id",
    sort: "desc"
  });

  const { token, isClient } = useAuthToken();
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      
      setIsMobile(width < 768);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);
  const buildApiUrl = (): string => {
    const params = new URLSearchParams();
    params.append("page", pagination.page.toString());
    params.append("limit", pagination.limit.toString());
    params.append("order", sortConfig.order);
    params.append("sort", sortConfig.sort);
    if (search.trim()) params.append("search", search.trim());

    if (clientId) params.append("client_id", clientId);
    return `/api/services?${params.toString()}`;
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

    const fetchServices = async () => {
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
        console.log(apiUrl);
        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Api-Key": "X-Secret-Key",
            "Content-Type": "application/json",
          },
        });
        console.log(response);

        if (!response.ok) {
          const errorMessage = handleApiError(response, "Gagal memuat data service");
          setError(errorMessage);
          setServices([]);
          return;
        }

        const json = await response.json();
        if (json.code === 200 && json.data) {
          const servicesData = json.data.data || [];
          
          setServices(servicesData);
          
          // Pagination logic - same as client-list
          setPagination(prev => {
            // If returned data is less than limit, this is the last page
            if (servicesData.length < prev.limit) {
              return {
                ...prev,
                total: (prev.page - 1) * prev.limit + servicesData.length
              };
            } else {
              // If data equals limit, assume there's more data
              // Set total higher to enable next page
              return {
                ...prev,
                total: Math.max(prev.total, prev.page * prev.limit + 1)
              };
            }
          });
        } else {
          setError(json.message || "Gagal memuat data service");
          setServices([]);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
        if (error instanceof TypeError && error.message.includes('fetch')) {
          setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda");
        } else {
          setError(error instanceof Error ? error.message : "Gagal memuat data service");
        }
        setServices([]);
      } finally {
        const elapsed = Date.now() - startTime;
        const delay = Math.max(1000 - elapsed, 0);
        setTimeout(() => {
          setIsLoading(false);
        }, delay);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchServices();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [search, pagination.page, pagination.limit, sortConfig.order, sortConfig.sort, token, isClient]);

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

  const handleEdit = (service: Service) => {
    router.push(`/dashboard/edit-service/${service.id}`);
  };
  const handleMessage = (service: Service) => {
    router.push(`/dashboard/send-message/${service.id}`);
  };

  const handleDelete = (service: Service) => {
    setDeleteConfirmation({
      show: true,
      service: service,
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.service || !token) return;

    const serviceId = deleteConfirmation.service.id;
    setDeleteLoading(serviceId);
    clearMessages();

    try {
      const response = await fetch(`/api/services/id/${serviceId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Api-Key": "X-Secret-Key",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorMessage = handleApiError(response, "Gagal menghapus service");
        setError(errorMessage);
        return;
      }

      const json = await response.json();

      if (json.code === 200 || json.code === 204) {
        setServices(prevServices => prevServices.filter(s => s.id !== serviceId));
        setSuccessMessage(`Service ${deleteConfirmation.service.service_detail_name} berhasil dihapus`);
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        throw new Error(json.message || "Gagal menghapus service");
      }

    } catch (err) {
      console.error("Error deleting service:", err);
      
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda");
      } else {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus service");
      }
    } finally {
      setDeleteLoading(null);
      setDeleteConfirmation({ show: false, service: null });
    }
  };

  const handleSort = (field: OrderField) => {
    setSortConfig(prev => ({
      order: field,
      sort: prev.order === field ? (prev.sort === "asc" ? "desc" : "asc") : "desc"
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, service: null });
  };

  const getStatusBadge = (statusName: string) => {
    const isActive = statusName.toLowerCase() === "aktif";
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        isActive 
          ? "bg-green-100 text-green-800" 
          : "bg-red-100 text-red-800"
      }`}>
        <Shield className="h-3 w-3 mr-1" />
        {statusName}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const SortIndicator = ({ field }: { field: OrderField }) => {
    if (sortConfig.order !== field) return null;
    return (
      <span 
        className="ml-1" 
        aria-label={`Sorted ${sortConfig.sort === "asc" ? "ascending" : "descending"}`}
      >
        {sortConfig.sort === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  // Pagination logic - same as client-list
  const hasNextPage = services.length === pagination.limit;
  const hasPrevPage = pagination.page > 1;
  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = startItem + services.length - 1;

  // Debug logging
  console.log('Pagination Debug:', {
    page: pagination.page,
    limit: pagination.limit,
    total: pagination.total,
    servicesLength: services.length,
    hasNextPage,
    hasPrevPage
  });

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Daftar Service</CardTitle>
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
    <>
    <Card className="mt-5">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Daftar Service
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
        {!isMobile && (

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <input
            type="text"
            placeholder="Cari service"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="p-2 border border-gray-300 rounded text-sm w-full sm:w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Cari service"
          />
          <div className="flex items-center space-x-2">
              <Button
                onClick={() => router.push("/dashboard/add-renewal-service")}
                className="flex items-center bg-teal-600 hover:bg-teal-700 cursor-pointer"
              >
                <BadgePlus className="mr-2 h-4 w-4" />
                Renewal Service
              </Button>
              <Button
                onClick={() => router.push("/dashboard/add-service")}
                className="flex items-center bg-teal-600 hover:bg-teal-700 cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
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
            </div>
        </div>
        )}
        {isMobile && (
          <div className="flex flex-col gap-4 mb-4">
          {/* Search Bar */}
          <input
            type="text"
            placeholder="Cari service berdasarkan nama klien, service, atau vendor..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="p-2 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Cari service"
          />
          
          {/* Controls Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <select
              value={pagination.limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer w-full sm:w-auto"
              aria-label="Jumlah item per halaman"
            >
              <option value={5}>5 per halaman</option>
              <option value={10}>10 per halaman</option>
              <option value={20}>20 per halaman</option>
              <option value={50}>50 per halaman</option>
            </select>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                onClick={() => router.push("/dashboard/add-renewal-service")}
                className="flex items-center justify-center bg-teal-600 hover:bg-teal-700 cursor-pointer w-full sm:w-auto"
              >
                <BadgePlus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Renewal Service</span>
                <span className="sm:hidden">Renewal</span>
              </Button>
              <Button
                onClick={() => router.push("/dashboard/add-service")}
                className="flex items-center justify-center bg-teal-600 hover:bg-teal-700 cursor-pointer w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Add Service</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
         </div>

        )}


        
        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">
                  No.
                </TableHead>
                <TableHead 
                  onClick={() => handleSort("client_name")} 
                  className="cursor-pointer hover:bg-gray-100 select-none"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort("client_name")}
                >
                  Nama Service / Klien <SortIndicator field="client_name" />
                </TableHead>
                <TableHead 
                  onClick={() => handleSort("service_name")} 
                  className="cursor-pointer hover:bg-gray-100 select-none"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort("service_name")}
                >
                  Service <SortIndicator field="service_name" />
                </TableHead>
                <TableHead 
                  onClick={() => handleSort("vendor_name")} 
                  className="cursor-pointer hover:bg-gray-100 select-none"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort("vendor_name")}
                >
                  Vendor <SortIndicator field="vendor_name" />
                </TableHead>
                <TableHead 
                  onClick={() => handleSort("final_price")} 
                  className="cursor-pointer hover:bg-gray-100 select-none"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort("final_price")}
                >
                  Harga Final <SortIndicator field="final_price" />
                </TableHead>
                <TableHead 
                  onClick={() => handleSort("status_name")} 
                  className="cursor-pointer hover:bg-gray-100 select-none"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort("status_name")}
                >
                  Status <SortIndicator field="status_name" />
                </TableHead>
                <TableHead 
                  onClick={() => handleSort("start_date")} 
                  className="cursor-pointer hover:bg-gray-100 select-none"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort("start_date")}
                >
                  Tanggal Mulai <SortIndicator field="start_date" />
                </TableHead>
                <TableHead>PIC</TableHead>
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
                    <TableCell><Skeleton className="h-4 w-20 animate-pulse" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28 animate-pulse" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 animate-pulse" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-full animate-pulse" /></TableCell>
                  </TableRow>
                ))
              ) : services.length > 0 ? (
                services.map((service, index) => (
                  <TableRow key={service.id}>
                    <TableCell className="text-center font-medium text-gray-500">
                      {getRowNumber(index)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                        {service.service_detail_name}
                        <div className="text-xs text-gray-500">
                            {service.client_name}
                        </div>
                      
                    </TableCell>
                    <TableCell className="font-medium">
                      {service.service_name}
                      {service.domain_name && (
                        <div className="text-xs text-gray-500">{service.domain_name}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {service.vendor_name}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatCurrency(service.final_price)}
                      {service.is_discount && (
                        <div className="text-xs text-gray-500">
                          Disc: {service.discount_type === 'amount' 
                            ? formatCurrency(service.discount) 
                            : `${service.discount}%`}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(service.status_name)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(service.start_date)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {service.pic}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Menu aksi untuk ${service.service_name}`} className="cursor-pointer">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(service)} className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            <span>Edit Service</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMessage(service)} className="cursor-pointer">
                            <MessageCircleCode className="mr-2 h-4 w-4" />
                            <span>Send Message</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(service)}
                            disabled={deleteLoading === service.id}
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            <span>{deleteLoading === service.id ? "Menghapus..." : "Hapus"}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-gray-500 py-8">
                    {search
                      ? "Service dengan kata kunci tersebut tidak ditemukan."
                      : "Tidak ada data service ditemukan."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination - same as client-list */}
        {services.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
            <div className="text-sm text-gray-600">
              Halaman {pagination.page} - Menampilkan {startItem} - {endItem} service
            </div>
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                className="cursor-pointer"
                disabled={!hasPrevPage}
                aria-label="Halaman pertama"
              >
                ≪
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                className="cursor-pointer"
                disabled={!hasPrevPage}
                aria-label="Halaman sebelumnya"
              >
                ‹
              </Button>
              
              {/* Show current page number */}
              <Button
                variant="default"
                size="sm"
                aria-current="page"
                className="cursor-pointer"
              >
                {pagination.page}
              </Button>
              
              {/* Show next page if available */}
              {hasNextPage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  className="cursor-pointer"
                  aria-label={`Halaman ${pagination.page + 1}`}
                >
                  {pagination.page + 1}
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                className="cursor-pointer"
                disabled={!hasNextPage}
                aria-label="Halaman selanjutnya"
              >
                ›
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                className="cursor-pointer"
                disabled={!hasNextPage}
                aria-label="Halaman terakhir"
              >
                ≫
              </Button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmation.show && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h3 id="delete-title" className="text-lg font-semibold mb-4">
                Konfirmasi Hapus Service
              </h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus service{" "}
                <strong>{deleteConfirmation.service?.service_detail_name}</strong>{" "}
                untuk klien <strong>{deleteConfirmation.service?.client_name}</strong>?
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
    </>
  );
}