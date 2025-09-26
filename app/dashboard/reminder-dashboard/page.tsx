"use client";

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, Building2, User, Filter, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface DecodedToken {
  id: string;
  username: string;
  email: string;
  role: string;
  exp: number;
}

// Types
interface Service {
  id: number;
  service_detail_name: string;
  client_name: string;
  service_type_name: string;
  vendor_name: string | null;
  domain_name: string;
  final_price: number;
  status_name: string;
  end_date: string | null;
  handled_by: string;
  pic: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  search: string;
  total_pages?: number;
  total_items?: number;
}

interface ApiResponse {
  code: number;
  status: string;
  data: {
    data: Service[];
    pagination: PaginationInfo;
  };
}

type FilterType = 'week' | 'month' | 'twoMonth';

export default function ReminderDashboard () {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('week');
  const [token, setToken] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    search: '',
    total_pages: 1,
    total_items: 0
  });
  
  const router = useRouter();

  // Initialize client-side and get token from cookie
  useEffect(() => {
    setIsClient(true);
    
    // Get token from cookie first
    const cookieToken = document.cookie
      .split("; ")
      .find(row => row.startsWith("token="))
      ?.split("=")[1];
    
    // If no cookie token, try localStorage as fallback
    const localToken = localStorage.getItem('token');
    
    const finalToken = cookieToken || localToken;
    setToken(finalToken || null);
  }, []);

  const apiHeaders = {
    'Authorization': `Bearer ${token}`,
    'X-Api-Key': 'X-Secret-Key',
    'Content-Type': 'application/json',
  };

  // Calculate dates for filters
  const getFilterDate = (type: FilterType): string => {
    const now = new Date();
    const targetDate = new Date(now);
  
    if (type === 'week') {
      targetDate.setDate(now.getDate() + 7);
    } else if (type === 'month') {
      targetDate.setMonth(now.getMonth() + 1);
    } else if (type === 'twoMonth') {
      targetDate.setMonth(now.getMonth() + 2);
    }
  
    return targetDate.toISOString().split('T')[0];
  };

  // Build API URL with pagination
  const buildApiUrl = (): string => {
    const params = new URLSearchParams();
    params.append("page", pagination.page.toString());
    params.append("limit", pagination.limit.toString());
    params.append("end_date", getFilterDate(activeFilter));
    
    return `/api/services?${params.toString()}`;
  };

  const fetchServices = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(), {
        headers: apiHeaders,
      });
      const data: ApiResponse = await response.json();
      
      if (data.code === 200) {
        setServices(data.data.data);
        setPagination(prev => ({
          ...prev,
          total_pages: data.data.pagination.total_pages || 1,
          total_items: data.data.pagination.total_items || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle token validation and session management
  useEffect(() => {
    if (!isClient) return;
    
    if (!token) {
      router.push('/auth/sign-in');
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);      
      // Check if token has expired
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
  }, [router, token, isClient]);

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [activeFilter]);

  useEffect(() => {
    if (token) {
      fetchServices();
    }
  }, [pagination.page, activeFilter, token]);

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'No end date';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getDaysUntilExpiry = (endDate: string | null): number => {
    if (!endDate) return Infinity;
    const now = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusBadgeVariant = (statusName: string, daysLeft: number) => {
    if (daysLeft <= 0) return 'destructive';
    if (daysLeft <= 3) return 'destructive';
    if (daysLeft <= 7) return 'secondary';
    return 'default';
  };

  const getStatusBadgeColor = (daysLeft: number) => {
    if (daysLeft <= 0) return 'bg-red-500';
    if (daysLeft <= 3) return 'bg-red-500';
    if (daysLeft <= 7) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Pagination handlers
  const goToPage = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const goToNextPage = () => {
    if (pagination.page < (pagination.total_pages || 1)) {
      goToPage(pagination.page + 1);
    }
  };

  const goToPrevPage = () => {
    if (pagination.page > 1) {
      goToPage(pagination.page - 1);
    }
  };

  const ServiceSkeleton = () => (
    <div className="bg-white rounded-lg border border-gray-100 p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="grid grid-cols-4 gap-4 mt-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
    </div>
  );

  const CompactPagination = () => (
    <div className="flex items-center justify-between text-sm text-gray-500 mt-6">
      <span>
        {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total_items || 0)} of {pagination.total_items || 0}
      </span>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPrevPage}
          disabled={pagination.page <= 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <span className="px-2 text-sm font-medium">
          {pagination.page} / {pagination.total_pages || 1}
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextPage}
          disabled={pagination.page >= (pagination.total_pages || 1)}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Show loading state while client-side hydration occurs
  if (!isClient) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Bell className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Service Reminders</h1>
            <p className="text-sm text-gray-600">Track upcoming service renewals and expirations</p>
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <ServiceSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header - More Compact */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Bell className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Service Reminders</h1>
          <p className="text-sm text-gray-600">Track upcoming service renewals and expirations</p>
        </div>
      </div>

      {/* Filters - Cleaner Design */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
        </div>
        <div className="flex gap-2">
          {[
            { key: 'week', label: '≤ 1 Week' },
            { key: 'month', label: '≤ 1 Month' },
            { key: 'twoMonth', label: '≤ 2 Month' }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key as FilterType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeFilter === filter.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Services List - Table-like Compact Design */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <ServiceSkeleton key={index} />
          ))
        ) : services.length > 0 ? (
          services.map((service) => {
            const daysLeft = getDaysUntilExpiry(service.end_date);
            return (
              <div 
                key={service.id} 
                onClick={() => router.push(`/dashboard/edit-service/${service.id}`)}
                className="bg-white rounded-lg border border-gray-100 p-4 hover:border-gray-200 hover:shadow-md transition-all cursor-pointer hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${getStatusBadgeColor(daysLeft)}`} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate text-sm">
                          {service.service_detail_name || `Service #${service.id}`}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {service.client_name || 'Unknown Client'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Compact Info Grid */}
                  <div className="hidden md:flex items-center gap-6 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3 w-3 text-gray-400" />
                      <span className="truncate max-w-20">
                        {service.service_type_name || 'Unknown'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span className="whitespace-nowrap">
                        {formatDate(service.end_date)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3 text-gray-400" />
                      <span className="truncate max-w-20">
                        {service.handled_by || 'Unassigned'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 font-medium text-gray-900">
                      <DollarSign className="h-3 w-3 text-gray-400" />
                      <span className="whitespace-nowrap text-xs">
                        {service.final_price > 0 ? formatCurrency(service.final_price) : 'Free'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <Badge 
                    variant={getStatusBadgeVariant(service.status_name, daysLeft)}
                    className="text-xs px-2 py-1 font-medium"
                  >
                    {daysLeft <= 0 ? 'Expired' : `${daysLeft}d`}
                  </Badge>
                </div>

                {/* Mobile Info - Only show on small screens */}
                <div className="md:hidden mt-3 grid grid-cols-2 gap-3 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-gray-400" />
                    <span className="truncate">{service.service_type_name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="truncate">{formatDate(service.end_date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3 text-gray-400" />
                    <span className="truncate">{service.handled_by || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <DollarSign className="h-3 w-3 text-gray-400" />
                    <span className="truncate">{service.final_price > 0 ? formatCurrency(service.final_price) : 'Free'}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-lg border border-gray-100">
            <div className="p-3 bg-gray-100 rounded-full mb-3">
              <Bell className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">No upcoming renewals</h3>
            <p className="text-sm text-gray-600">
              No services expiring within the selected timeframe.
            </p>
          </div>
        )}
      </div>

      {/* Compact Pagination */}
      {!loading && services.length > 0 && <CompactPagination />}
    </div>
  );
};