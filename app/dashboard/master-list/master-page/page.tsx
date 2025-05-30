"use client";

import React, { useEffect, useState } from "react";
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
import { MoreVertical, Eye, Plus, Trash, AlertCircle, Users, Activity, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Updated Types based on actual API response
type ClientType = {
  id: number;
  name: string;
  description: string;
  created_date: string;
  created_by: string;
  modified_date: string;
  modified_by: string;
};

type ClientStatus = {
  id: number;
  name: string;
  description: string;
  created_date: string;
  created_by: string;
  modified_date: string;
  modified_by: string;
};

type ServiceType = {
  id: number;
  name: string;
  description: string;
  price: number;
  created_date: string;
  created_by: string;
  modified_date: string;
  modified_by: string;
};

type TabType = "client-type" | "client-status" | "service-types";

type SortDirection = "asc" | "desc";
type OrderField = "name" | "description" | "created_date";

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
  item: ClientType | ClientStatus | ServiceType | null;
  type: TabType;
};

// API Response structure
type ApiResponse<T> = {
  code: number;
  status: string;
  data: T[];
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

export default function MasterPage() {
  const [activeTab, setActiveTab] = useState<TabType>("client-type");
  const [search, setSearch] = useState("");
  
  // Data states
  const [clientTypes, setClientTypes] = useState<ClientType[]>([]);
  const [clientStatuses, setClientStatuses] = useState<ClientStatus[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    show: false,
    item: null,
    type: "client-type",
  });
  
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    order: "created_date",
    sort: "desc"
  });

  const { token, isClient } = useAuthToken();
  const router = useRouter();

  const tabs = [
    { id: 'client-type' as const, label: 'Client Type', icon: Users },
    { id: 'client-status' as const, label: 'Client Status', icon: Activity },
    { id: 'service-types' as const, label: 'Service Types', icon: Settings },
  ];

  // Router navigation functions
  const getAddRoute = (tabType: TabType): string => {
    const routes = {
      'client-type': '/dashboard/master-list/add-client-type',
      'client-status': '/dashboard/master-list/add-client-status',
      'service-types': '/dashboard/master-list/add-service-type'
    };
    return routes[tabType];
  };

  const getEditRoute = (tabType: TabType, id: number): string => {
    const routes = {
      'client-type': `/dashboard/master-list/edit-client-type/${id}`,
      'client-status': `/dashboard/master-list/edit-client-status/${id}`,
      'service-types': `/dashboard/master-list/edit-service-type/${id}`
    };
    return routes[tabType];
  };


  const handleAddNew = () => {
    const route = getAddRoute(activeTab);
    router.push(route);
  };

  const handleViewDetail = (item: ClientType | ClientStatus | ServiceType) => {
    const route = getEditRoute(activeTab, item.id);
    router.push(route);
  };

  const getApiEndpoint = (tabType: TabType): string => {
    const endpoints = {
      'client-type': '/api/client_types',
      'client-status': '/api/client_statuses',
      'service-types': '/api/service_types'
    };
    return endpoints[tabType];
  };

  const getDeleteEndpoint = (tabType: TabType, id: number): string => {
    const endpoints = {
      'client-type': `/api/client_types/id/${id}`,
      'client-status': `/api/client_statuses/id/${id}`,
      'service-types': `/api/service_types/id/${id}`
    };
    return endpoints[tabType];
  };

  const buildApiUrl = (tabType: TabType): string => {
    const params = new URLSearchParams();
    params.append("page", pagination.page.toString());
    params.append("limit", pagination.limit.toString());
    params.append("order", sortConfig.order);
    params.append("sort", sortConfig.sort);
    if (search.trim()) params.append("search", search.trim());

    return `${getApiEndpoint(tabType)}?${params.toString()}`;
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

  const fetchData = async (tabType: TabType) => {
    setIsLoading(true);
    clearMessages();

    if (!token) {
      setError("Token tidak ditemukan, silakan login kembali");
      setIsLoading(false);
      return;
    }

    const startTime = Date.now();

    try {
      const apiUrl = buildApiUrl(tabType);
      console.log(apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Api-Key": "X-Secret-Key",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorMessage = handleApiError(response, "Gagal memuat data");
        setError(errorMessage);
        return;
      }

      const json: ApiResponse<ClientType | ClientStatus | ServiceType> = await response.json();
      
      if (json.code === 200 && json.data) {
        const data = json.data;
        
        // Update the appropriate state based on tab type
        switch (tabType) {
          case 'client-type':
            setClientTypes(data as ClientType[]);
            break;
          case 'client-status':
            setClientStatuses(data as ClientStatus[]);
            break;
          case 'service-types':
            setServiceTypes(data as ServiceType[]);
            break;
        }
        
        // Update pagination
        setPagination(prev => {
          if (data.length < prev.limit) {
            return {
              ...prev,
              total: (prev.page - 1) * prev.limit + data.length
            };
          } else {
            return {
              ...prev,
              total: Math.max(prev.total, prev.page * prev.limit + 1)
            };
          }
        });
      } else {
        setError("Gagal memuat data");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda");
      } else {
        setError(error instanceof Error ? error.message : "Gagal memuat data");
      }
    } finally {
      const elapsed = Date.now() - startTime;
      const delay = Math.max(1000 - elapsed, 0);
      setTimeout(() => {
        setIsLoading(false);
      }, delay);
    }
  };

  useEffect(() => {
    if (!isClient) return;

    const debounceTimer = setTimeout(() => {
      fetchData(activeTab);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [search, pagination.page, pagination.limit, sortConfig.order, sortConfig.sort, token, isClient, activeTab]);

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    setPagination(prev => ({ ...prev, page: 1 }));
    setSearch("");
    clearMessages();
  };

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

  const handleSort = (field: OrderField) => {
    setSortConfig(prev => ({
      order: field,
      sort: prev.order === field ? (prev.sort === "asc" ? "desc" : "asc") : "desc"
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = (item: ClientType | ClientStatus | ServiceType) => {
    setDeleteConfirmation({
      show: true,
      item: item,
      type: activeTab,
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.item || !token) return;

    const itemId = deleteConfirmation.item.id;
    setDeleteLoading(itemId);
    clearMessages();

    try {
      const response = await fetch(getDeleteEndpoint(deleteConfirmation.type, itemId), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Api-Key": "X-Secret-Key",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorMessage = handleApiError(response, "Gagal menghapus data");
        setError(errorMessage);
        return;
      }

      const json = await response.json();

      if (json.code === 200 || json.code === 204) {
        // Remove item from appropriate state
        switch (deleteConfirmation.type) {
          case 'client-type':
            setClientTypes(prev => prev.filter(item => item.id !== itemId));
            break;
          case 'client-status':
            setClientStatuses(prev => prev.filter(item => item.id !== itemId));
            break;
          case 'service-types':
            setServiceTypes(prev => prev.filter(item => item.id !== itemId));
            break;
        }
        
        setSuccessMessage(`Data ${deleteConfirmation.item.name} berhasil dihapus`);
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        throw new Error("Gagal menghapus data");
      }

    } catch (err) {
      console.error("Error deleting data:", err);
      
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda");
      } else {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus data");
      }
    } finally {
      setDeleteLoading(null);
      setDeleteConfirmation({ show: false, item: null, type: activeTab });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, item: null, type: activeTab });
  };

  const formatDateTime = (dateString: string): string => {
    if (dateString === "0001-01-01T00:00:00Z" || !dateString) return "-";
    try {
      return new Date(dateString).toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "-";
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
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

  const getCurrentData = (): (ClientType | ClientStatus | ServiceType)[] => {
    switch (activeTab) {
      case 'client-type':
        return clientTypes;
      case 'client-status':
        return clientStatuses;
      case 'service-types':
        return serviceTypes;
      default:
        return [];
    }
  };

  // Table headers configuration based on active tab
  const getTableHeaders = () => {
    const baseHeaders = [
      { key: "name", label: "Nama", sortable: true },
      { key: "description", label: "Deskripsi", sortable: true },
    ];

    if (activeTab === 'service-types') {
      baseHeaders.push({ key: "price", label: "Harga", sortable: false });
    }

    baseHeaders.push(
      { key: "created_date", label: "Dibuat Pada", sortable: true },
      { key: "created_by", label: "Dibuat Oleh", sortable: false },
      { key: "modified_date", label: "Diubah Pada", sortable: false },
      { key: "modified_by", label: "Diubah Oleh", sortable: false },
      { key: "actions", label: "Aksi", sortable: false }
    );

    return baseHeaders;
  };

  const renderTableCell = (item: ClientType | ClientStatus | ServiceType, header: { key: string; label: string; sortable: boolean }) => {
    switch (header.key) {
      case "name":
        return <TableCell className="font-medium text-gray-900">{item.name}</TableCell>;
      case "description":
        return <TableCell className="text-gray-600">{item.description || "-"}</TableCell>;
      case "price":
        return (
          <TableCell className="font-semibold text-green-600 flex items-center">
            {formatPrice((item as ServiceType).price)}
          </TableCell>
        );
      case "created_date":
        return (
          <TableCell className="text-sm text-gray-600">
            {formatDateTime(item.created_date)}
          </TableCell>
        );
      case "created_by":
        return (
          <TableCell className="text-sm text-gray-600">
            {item.created_by || "-"}
          </TableCell>
        );
      case "modified_date":
        return (
          <TableCell className="text-sm text-gray-600">
            {formatDateTime(item.modified_date)}
          </TableCell>
        );
      case "modified_by":
        return (
          <TableCell className="text-sm text-gray-600">
            {item.modified_by || "-"}
          </TableCell>
        );
      case "actions":
        return (
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Menu aksi untuk ${item.name}`}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleViewDetail(item)}>
                  <Eye className="mr-2 h-4 w-4" />
                  <span>Lihat Detail</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDelete(item)}
                  disabled={deleteLoading === item.id}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  <span>{deleteLoading === item.id ? "Menghapus..." : "Hapus"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        );
      default:
        return <TableCell>-</TableCell>;
    }
  };

  const currentData = getCurrentData();
  const tableHeaders = getTableHeaders();
  const hasNextPage = currentData.length === pagination.limit;
  const hasPrevPage = pagination.page > 1;
  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = startItem + currentData.length - 1;

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
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
    <div className="w-full max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Tab Navigation */}
        <div className="border-b bg-gray-50/50">
          <div className="flex space-x-0">
            {tabs.map((tab, index) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 relative flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-teal-500 text-teal-600 bg-white shadow-sm'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                  } ${index > 0 ? 'border-l border-gray-200' : ''}`}
                >
                  <IconComponent className="h-4 w-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-teal-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-gray-50/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                {tabs.find(tab => tab.id === activeTab)?.label}
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
                  placeholder={`Cari ${tabs.find(tab => tab.id === activeTab)?.label.toLowerCase()}...`}
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="p-2 border border-gray-300 rounded text-sm w-full sm:w-1/3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  aria-label="Cari data"
                />
                
                <div className="flex items-center space-x-2">
                  <select
                    value={pagination.limit}
                    onChange={(e) => handleLimitChange(Number(e.target.value))}
                    className="p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    aria-label="Jumlah item per halaman"
                  >
                    <option value={5}>5 per halaman</option>
                    <option value={10}>10 per halaman</option>
                    <option value={20}>20 per halaman</option>
                    <option value={50}>50 per halaman</option>
                  </select>
                  
                  <Button 
                    className="flex items-center bg-teal-600 hover:bg-teal-700"
                    onClick={handleAddNew}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Data
                  </Button>
                </div>
              </div>
              
              {/* Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {tableHeaders.map((header) => (
                        <TableHead 
                          key={header.key}
                          onClick={header.sortable ? () => handleSort(header.key as OrderField) : undefined}
                          className={`font-semibold text-gray-700 ${
                            header.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
                          }`}
                          tabIndex={header.sortable ? 0 : undefined}
                          onKeyDown={header.sortable ? (e) => e.key === 'Enter' && handleSort(header.key as OrderField) : undefined}
                        >
                          {header.label}
                          {header.sortable && <SortIndicator field={header.key as OrderField} />}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: pagination.limit }).map((_, index) => (
                        <TableRow key={index}>
                          {tableHeaders.map((header) => (
                            <TableCell key={header.key}>
                              <Skeleton className="h-4 w-32 animate-pulse" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : currentData.length > 0 ? (
                      currentData.map((item) => (
                        <TableRow key={item.id} className="hover:bg-blue-50/50 transition-colors">
                          {tableHeaders.map((header) => (
                            <React.Fragment key={header.key}>
                              {renderTableCell(item, header)}
                            </React.Fragment>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={tableHeaders.length} className="text-center text-sm text-gray-500 py-8">
                          {search
                            ? "Data dengan kata kunci tersebut tidak ditemukan."
                            : "Tidak ada data ditemukan."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {currentData.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                  <div className="text-sm text-gray-600">
                    Halaman {pagination.page} - Menampilkan {startItem} - {endItem} data
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={!hasPrevPage}
                      aria-label="Halaman pertama"
                    >
                      ≪
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!hasPrevPage}
                      aria-label="Halaman sebelumnya"
                    >
                      ‹
                    </Button>
                    
                    <Button
                      variant="default"
                      size="sm"
                      aria-current="page"
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      {pagination.page}
                    </Button>
                    
                    {hasNextPage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        aria-label={`Halaman ${pagination.page + 1}`}
                      >
                        {pagination.page + 1}
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!hasNextPage}
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
                    >
                      ≫
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
              Konfirmasi Hapus Data
            </h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus{" "}
              <strong>{deleteConfirmation.item?.name}</strong>?
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
    </div>
  );
}