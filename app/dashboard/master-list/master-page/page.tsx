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
import { MoreVertical, Eye, Plus, Trash, AlertCircle, Users, Activity, Settings, HouseWifi, ListFilter } from "lucide-react";
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
  exp: number;
}

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
  is_need_vendor: string;
  service_category_id: number;
  service_category_name: string;
  created_date: string;
  created_by: string;
  modified_date: string;
  modified_by: string;
};

type Vendors = {
  id: number;
  name: string;
  description: string;
  created_date: string;
  created_by: string;
  modified_date: string;
  modified_by: string;
};

type ServiceCategories = {
  id: number;
  name: string;
  description: string;
  created_date: string;
  created_by: string;
  modified_date: string;
  modified_by: string;
};

type TabType = "client-type" | "client-status" | "service-types" | "vendor" | "service-categories";

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
  item: ClientType | ClientStatus | ServiceType | Vendors | ServiceCategories| null;
  type: TabType;
};

// API Response structure
type ApiResponse<T> = {
  code: number;
  status: string;
  data: {
    data: T[] | null;
    pagination: {
      search: string;
      page: number;
      limit: number;
      order_by: string;
      sort_by: string;
      offset: number;
    };
    total?: number; // total is at the same level as pagination
  } | null;
};

type TabDataMap = {
  'client-type': ClientType[];
  'client-status': ClientStatus[];
  'service-types': ServiceType[];
  'vendor': Vendors[];
  'service-categories': ServiceCategories[];
};

type CacheEntry<T> = {
  data: T;
  page: number;
  limit: number;
  total: number;
  isLastPage?: boolean;
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
  const [dataCache, setDataCache] = useState<Map<string, CacheEntry<TabDataMap[TabType]>>>(new Map());

  // Data states
  const [clientTypes, setClientTypes] = useState<ClientType[]>([]);
  const [clientStatuses, setClientStatuses] = useState<ClientStatus[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [vendors, setVendors] = useState<Vendors[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategories[]>([]);

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

  const generateCacheKey = (tabType: TabType): string => {
    return JSON.stringify({
      tabType,
      page: pagination.page,
      limit: pagination.limit,
      order: sortConfig.order,
      sort: sortConfig.sort,
      search: search.trim(),
    });
  };
  
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0
  });

  const getRowNumber = (index: number): number => {
    return (pagination.page - 1) * pagination.limit + index + 1;
  };

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
    { id: 'vendor' as const, label: 'Vendor', icon: HouseWifi },
    { id: 'service-categories' as const, label: 'Service Categories', icon: ListFilter },
  ];

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
        }, 2000);
      }, 60 * 60 * 1000);
  
      return () => clearTimeout(timeout); 

    } catch (error) {
      console.error('Failed to decode token:', error);
      localStorage.removeItem('token');
      router.push('/auth/sign-in');
    }
  }, [router]);

  // Router navigation functions
  const getAddRoute = (tabType: TabType): string => {
    const routes = {
      'client-type': '/dashboard/master-list/add-client-type',
      'client-status': '/dashboard/master-list/add-client-status',
      'service-types': '/dashboard/master-list/add-service-type',
      'vendor': '/dashboard/master-list/add-vendor',
      'service-categories': '/dashboard/master-list/add-service-category'
    };
    return routes[tabType];
  };

  const getEditRoute = (tabType: TabType, id: number): string => {
    const routes = {
      'client-type': `/dashboard/master-list/edit-client-type/${id}`,
      'client-status': `/dashboard/master-list/edit-client-status/${id}`,
      'service-types': `/dashboard/master-list/edit-service-type/${id}`,
      'vendor': `/dashboard/master-list/edit-vendor/${id}`,
      'service-categories': `/dashboard/master-list/edit-service-category/${id}`
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
      'service-types': '/api/service_types',
      'vendor': '/api/vendors',
      'service-categories': '/api/service_categories'
    };
    return endpoints[tabType];
  };

  const getDeleteEndpoint = (tabType: TabType, id: number): string => {
    const endpoints = {
      'client-type': `/api/client_types/id/${id}`,
      'client-status': `/api/client_statuses/id/${id}`,
      'service-types': `/api/service_types/id/${id}`,
      'vendor': `/api/vendors/id/${id}`,
      'service-categories': `/api/service_categories/id/${id}`
    };
    return endpoints[tabType];
  };

  const buildApiUrl = (tabType: TabType): string => {
    const params = new URLSearchParams();
    params.append("page", pagination.page.toString());
    params.append("limit", pagination.limit.toString());
    params.append("order_by", sortConfig.order);
    params.append("sort_by", sortConfig.sort === "asc" ? "ASC" : "DESC");
    if (search.trim()) params.append("search", search.trim());
  
    return `${getApiEndpoint(tabType)}?${params.toString()}`;
  };
  console.log(pagination);

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
    const cacheKey = generateCacheKey(tabType);
    const cached = dataCache.get(cacheKey) as CacheEntry<TabDataMap[typeof tabType]> | undefined;
  
    if (cached) {
      switch (tabType) {
        case 'client-type':
          setClientTypes(cached.data as ClientType[]);
          break;
        case 'client-status':
          setClientStatuses(cached.data as ClientStatus[]);
          break;
        case 'service-types':
          setServiceTypes(cached.data as ServiceType[]);
          break;
        case 'vendor':
          setVendors(cached.data as Vendors[]);
          break;
        case 'service-categories':
          setServiceCategories(cached.data as ServiceCategories[]);
          break;
      }
  
      setPagination(prev => ({
        ...prev,
        page: cached.page,
        limit: cached.limit,
        total: cached.total,
      }));
  
      setIsLoading(false);
      return;
    }
  
    try {
      const apiUrl = buildApiUrl(tabType);
      console.log('Fetching from:', apiUrl);
  
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
  
      const json: ApiResponse<ClientType | ClientStatus | ServiceType | Vendors | ServiceCategories> = await response.json();
      console.log('API Response:', json);
      
      if (json.code === 200 && json.data) {
        // Handle null data case - when API returns data: null, treat as empty array
        const payload = json.data.data ?? [];
        const data = Array.isArray(payload) ? payload : [];
  
        // FIXED: Extract total from the correct location in the response
        const apiTotal = json.data.total; // total is at data level, not pagination level
        const currentPage = json.data.pagination.page;
        const limit = json.data.pagination.limit;
  
        console.log('Data processed:', {
          tabType,
          page: currentPage,
          limit,
          dataLength: data.length,
          apiTotal,
          isNull: json.data.data === null
        });
  
        // If we get null data (no results) and we're on page > 1, redirect to previous page
        if (json.data.data === null && pagination.page > 1) {
          console.log('No data found, redirecting to previous page');
          handlePageChange(pagination.page - 1);
          setIsLoading(false);
          return;
        }
  
        // If we get null data on page 1, show empty state
        if (json.data.data === null && pagination.page === 1) {
          // Set empty data
          switch (tabType) {
            case 'client-type': setClientTypes([]); break;
            case 'client-status': setClientStatuses([]); break;
            case 'service-types': setServiceTypes([]); break;
            case 'vendor': setVendors([]); break;
            case 'service-categories': setServiceCategories([]); break;
          }
          
          setPagination(prev => ({ ...prev, total: 0 }));
          setIsLoading(false);
          return;
        }
  
        // Set state per tab with actual data
        switch (tabType) {
          case 'client-type': setClientTypes(data as ClientType[]); break;
          case 'client-status': setClientStatuses(data as ClientStatus[]); break;
          case 'service-types': setServiceTypes(data as ServiceType[]); break;
          case 'vendor': setVendors(data as Vendors[]); break;
          case 'service-categories': setServiceCategories(data as ServiceCategories[]); break;
        }
  
        // FIXED: Use the total from API response directly
        const computedTotal = apiTotal && apiTotal > 0 ? apiTotal : 0;
  
        console.log('Pagination calculated:', {
          currentPage,
          limit,
          dataLength: data.length,
          apiTotal,
          computedTotal
        });
  
        // Set pagination
        setPagination(prev => ({
          ...prev,
          page: currentPage,
          limit: limit,
          total: computedTotal,
        }));
  
        // Cache the result
        const cacheEntry: CacheEntry<any> = {
          data,
          page: currentPage,
          limit: limit,
          total: computedTotal,
        };
  
        setDataCache(prev => {
          const newCache = new Map(prev);
          newCache.set(cacheKey, cacheEntry);
          return newCache;
        });
  
      } else {
        setError("Gagal memuat data - response tidak valid");
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
    setPagination({ page: 1, limit: 10, total: 0 });
    setSearch("");
    clearMessages();
    
    // Clear cache for this tab to get fresh data
    setDataCache(prev => {
      const newCache = new Map(prev);
      for (const [key] of newCache) {
        if (key.includes(`"tabType":"${tabId}"`)) {
          newCache.delete(key);
        }
      }
      return newCache;
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return;
    
    // Don't allow going beyond reasonable bounds
    if (pagination.total > 0) {
      const maxPage = Math.ceil(pagination.total / pagination.limit);
      if (newPage > maxPage) return;
    }
    
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({
      ...prev,
      limit: newLimit,
      page: 1,
      total: 0 // Reset total to recalculate with new limit
    }));
    
    // Clear cache when limit changes
    setDataCache(new Map());
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPagination(prev => ({ ...prev, page: 1, total: 0 }));
    
    // Clear cache when search changes
    setDataCache(new Map());
  };

  const handleSort = (field: OrderField) => {
    setSortConfig(prev => ({
      order: field,
      sort: prev.order === field ? (prev.sort === "asc" ? "desc" : "asc") : "desc"
    }));
    setPagination(prev => ({ ...prev, page: 1, total: 0 }));
    
    // Clear cache when sort changes
    setDataCache(new Map());
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
          case 'vendor':
            setVendors(prev => prev.filter(item => item.id !== itemId));
            break;
          case 'service-categories':
            setServiceCategories(prev => prev.filter(item => item.id !== itemId));
            break;
          default:
            break;
        }
        
        // Update total count
        setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
        
        // Clear cache to force refresh
        setDataCache(new Map());
        
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
      case 'vendor':
        return vendors;
      case 'service-categories':
        return serviceCategories;
      default:
        return [];
    }
  };

  // Table headers configuration based on active tab
  const getTableHeaders = () => {
    const baseHeaders = [
      { key: "no", label: "No", sortable: false },
      { key: "name", label: "Nama", sortable: true },
      { key: "description", label: "Deskripsi", sortable: true },
    ];

    if (activeTab === 'service-types') {
      baseHeaders.push(
        { key: "price", label: "Harga", sortable: false },
        { key: "service_category_name", label: "Kategori Layanan", sortable: false }        
      );
    }

    baseHeaders.push(
      { key: "actions", label: "Aksi", sortable: false }
    );

    return baseHeaders;
  };

  const renderTableCell = (item: ClientType | ClientStatus | ServiceType, header: { key: string; label: string; sortable: boolean }, index: number) => {
    switch (header.key) {
      case "no":
        return <TableCell className="font-medium text-gray-900 text-center">{getRowNumber(index)}</TableCell>;
      case "name":
        return <TableCell className="font-medium text-gray-900">{item.name}</TableCell>;
      case "description":
        return <TableCell className="text-gray-600">{item.description || "-"}</TableCell>;
      case "price":
        if ('price' in item) {
          return <TableCell className="font-medium text-gray-900">{item.price}</TableCell>;
        }
        return <TableCell>-</TableCell>;
      case "service_category_name":
        if ('service_category_name' in item) {
          return <TableCell className="font-medium text-gray-900">{item.service_category_name}</TableCell>;
        }
        return <TableCell>-</TableCell>;
      case "actions":
        return (
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Menu aksi untuk ${item.name}`} className="cursor-pointer">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleViewDetail(item)} className="cursor-pointer">
                  <Eye className="mr-2 h-4 w-4" />
                  <span>Lihat Detail</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDelete(item)}
                  disabled={deleteLoading === item.id}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
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
  
  // Improved pagination logic
  const hasNextPage = (() => {
    if (pagination.total > 0) {
      // We know the total, check if there are more pages
      return pagination.page < Math.ceil(pagination.total / pagination.limit);
    }
    return false; // If no total, assume no more pages
  })();

  const hasPrevPage = pagination.page > 1;
  const startItem = currentData.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const endItem = currentData.length > 0 ? startItem + currentData.length - 1 : 0;
  const totalPages = pagination.total > 0 ? Math.ceil(pagination.total / pagination.limit) : 0;


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
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex whitespace-nowrap">
              {tabs.map((tab, index) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-all cursor-pointer duration-200 relative flex items-center gap-2 ${
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
                
                <div className="flex items-center space-x-1">
                  <select
                    value={pagination.limit}
                    onChange={(e) => handleLimitChange(Number(e.target.value))}
                    className="p-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    aria-label="Jumlah item per halaman"
                  >
                    <option value={5}>5 per halaman</option>
                    <option value={10}>10 per halaman</option>
                    <option value={20}>20 per halaman</option>
                    <option value={50}>50 per halaman</option>
                  </select>
                  
                  <Button 
                    className="flex items-center text-xs bg-teal-600 hover:bg-teal-700 cursor-pointer p-1"
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
                          } ${header.key === 'no' ? 'text-center w-16' : ''}`}
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
                      currentData.map((item, index) => (
                        <TableRow key={item.id} className="hover:bg-blue-50/50 transition-colors">
                          {tableHeaders.map((header) => (
                            <React.Fragment key={header.key}>
                              {renderTableCell(item, header, index)}
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
                    Halaman {pagination.page}
                    {totalPages > 0 ? ` dari ${totalPages}` : ''} - 
                    Menampilkan {startItem} - {endItem} data
                    {pagination.total > 0 ? ` dari ${pagination.total}` : ''}
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={!hasPrevPage}
                      className="cursor-pointer"
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
                      className="cursor-pointer"
                    >
                      ‹
                    </Button>
                    
                    <Button
                      variant="default"
                      size="sm"
                      aria-current="page"
                      className="bg-teal-600 hover:bg-teal-700 cursor-pointer"
                    >
                      {pagination.page}
                    </Button>
                    
                    {/* Show next page number if there are more pages */}
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
                      aria-label="Halaman selanjutnya"
                      className="cursor-pointer"
                    >
                      ›
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (totalPages > 0) {
                          handlePageChange(totalPages);
                        }
                      }}
                      disabled={totalPages === 0 || pagination.page >= totalPages}
                      className="cursor-pointer"
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
    </div>
  );
}