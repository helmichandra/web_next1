"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Calendar, Clock, Building2, User, AlertCircle, Filter } from 'lucide-react';
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

interface ApiResponse {
  code: number;
  status: string;
  data: {
    data: Service[];
    pagination: {
      page: number;
      limit: number;
      search: string;
    };
  };
}

type FilterType = 'week' | 'month';

export default function ReminderDashboard () {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('week');
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const router = useRouter();

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
    } else {
      targetDate.setMonth(now.getMonth() + 1);
    }
    
    return targetDate.toISOString().split('T')[0];
  };

  const fetchServices = async (filterType: FilterType) => {
    setLoading(true);
    try {
      const endDate = getFilterDate(filterType);
      const response = await fetch(`/api/services?end_date=${endDate}`, {
        headers: apiHeaders,
      });
      const data: ApiResponse = await response.json();
      
      if (data.code === 200) {
        setServices(data.data.data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices(activeFilter);
  }, [activeFilter]);

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
    if (daysLeft <= 3) return 'destructive';
    if (daysLeft <= 7) return 'secondary';
    return 'default';
  };

  const ServiceSkeleton = () => (
    <Card className="w-full">
      <CardHeader className="pb-1">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto p-4 sm:p-6 max-w-full"> {/* Increased max width and responsive padding */}
        {/* Main Content Card */}
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-4 sm:p-6 lg:p-8"> {/* Responsive padding */}
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 lg:mb-8">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Service Reminders</h1>
                <p className="text-sm sm:text-base text-gray-600">Track upcoming service renewals and expirations</p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6 lg:mb-8">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter by:</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveFilter('week')}
                  className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeFilter === 'week'
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                  }`}
                >
                  ≤ 1 Week
                </button>
                <button
                  onClick={() => setActiveFilter('month')}
                  className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeFilter === 'month'
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                  }`}
                >
                  ≤ 1 Month
                </button>
              </div>
            </div>

            {/* Services Grid - Single column for better card width */}
            <div className="space-y-4 lg:space-y-6"> {/* Changed to single column with spacing */}
              {loading ? (
                // Loading Skeletons
                Array.from({ length: 4 }).map((_, index) => (
                  <ServiceSkeleton key={index} />
                ))
              ) : services.length > 0 ? (
                // Service Cards
                services.map((service) => {
                  const daysLeft = getDaysUntilExpiry(service.end_date);
                  return (
                    <Card key={service.id} className="hover:shadow-md transition-all duration-200 border border-gray-200 bg-white">
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-0">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-semibold text-gray-900 break-words">
                              {service.service_detail_name || `Service #${service.id}`}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              {service.client_name || 'Unknown Client'}
                            </p>
                          </div>
                          <Badge 
                            variant={getStatusBadgeVariant(service.status_name, daysLeft)}
                            className="flex-shrink-0 self-start sm:self-center"
                          >
                            {daysLeft <= 0 ? 'Expired' : `${daysLeft}d left`}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        {/* Responsive grid with more columns for wider cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                          {/* Service Type */}
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span className="text-gray-600 truncate">
                              {service.service_type_name || 'Unknown Type'}
                            </span>
                          </div>
                          
                          {/* End Date */}
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span className="text-gray-600">
                              {formatDate(service.end_date)}
                            </span>
                          </div>
                          
                          {/* Handled By */}
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span className="text-gray-600 truncate">
                              {service.handled_by || 'Unassigned'}
                            </span>
                          </div>
                          
                          {/* Price */}
                          {service.final_price > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              <span className="font-medium text-gray-900">
                                {formatCurrency(service.final_price)}
                              </span>
                            </div>
                          )}
                          
                          {/* Domain Name */}
                          {service.domain_name && (
                            <div className="flex items-center gap-2 text-sm col-span-1 sm:col-span-2 lg:col-span-1">
                              <AlertCircle className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              <span className="text-gray-600 truncate">
                                {service.domain_name}
                              </span>
                            </div>
                          )}
                          
                          {/* Vendor Name */}
                          {service.vendor_name && (
                            <div className="flex items-center gap-2 text-sm">
                              <Building2 className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              <span className="text-gray-600 truncate">
                                {service.vendor_name}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                // Empty State
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <Bell className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming renewals</h3>
                  <p className="text-gray-600 max-w-md">
                    There are no services expiring within the selected timeframe. Check back later or adjust your filter.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};