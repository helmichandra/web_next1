'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Calendar, Filter, RefreshCw, FileText, Users, Settings, Download, X, ChevronDown } from 'lucide-react';
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

// Types
interface ServiceReport {
  id: number;
  service_detail_name: string;
  client_id: number;
  client_name: string;
  service_type_id: number;
  service_type_name: string;
  vendor_id: number | null;
  vendor_name: string | null;
  domain_name: string;
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
  order_type: string;
  renewal_service_id: number | null;
  renewal_service_name: string | null;
  service_category_id: number;
  service_category_name: string;
  created_date: string;
  created_by: string;
  modified_date: string;
  modified_by: string;
}

interface Client {
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
}

interface ServiceType {
  id: number;
  name: string;
  description: string;
  price: number;
  is_need_vendor: string;
  created_date: string;
  created_by: string;
  modified_date: string;
  modified_by: string;
}

interface Filters {
  start_date: string;
  end_date: string;
  client_ids: string;
  service_type_ids: string;
  status_id: string;
}

const ReportPreview = () => {
  const [reports, setReports] = useState<ServiceReport[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [selectedServiceTypeIds, setSelectedServiceTypeIds] = useState<string[]>([]);
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [serviceTypeDropdownOpen, setServiceTypeDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string>('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const [filters, setFilters] = useState<Filters>({
    start_date: '',
    end_date: '',
    client_ids: 'all',
    service_type_ids: 'all',
    status_id: '1'
  });
  const apiHeaders = {
    'Authorization': `Bearer ${token}`,
    'X-Api-Key': 'X-Secret-Key',
    'Content-Type': 'application/json',
  };
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
      }, 60 * 60 * 1000); // 30 menit
  
      return () => clearTimeout(timeout); 

    } catch (error) {
      console.error('Failed to decode token:', error);
      localStorage.removeItem('token');
      router.push('/auth/sign-in');
    }
  }, [router]);

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setFiltersLoading(true);
        setError('');
        
        // Fetch clients
        const clientsResponse = await fetch(`/api/clients/all`, {
          headers: apiHeaders,
        });
        const clientsData = await clientsResponse.json();
        if (clientsData.code === 200 && Array.isArray(clientsData.data)) {
          setClients(clientsData.data);
        } else {
          setClients([]);
        }

        // Fetch service types
        const serviceTypesResponse = await fetch(`/api/service_types/all`,{
          headers: apiHeaders,
        });
        const serviceTypesData = await serviceTypesResponse.json();
        if (serviceTypesData.code === 200 && Array.isArray(serviceTypesData.data)) {
          setServiceTypes(serviceTypesData.data);
        } else {
          setServiceTypes([]);
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
        setError('Failed to load filter options');
        setClients([]);
        setServiceTypes([]);
      } finally {
        setFiltersLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  // Fetch reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`/api/services/reports/preview?${queryParams.toString()}`,{
        headers: apiHeaders,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.code === 200) {
        // Handle different response structures
        let reportData = null;
        
        if (data.data) {
          // If data.data is an array
          if (Array.isArray(data.data)) {
            reportData = data.data;
          } 
          // If data.data has a data property that's an array
          else if (data.data.data && Array.isArray(data.data.data)) {
            reportData = data.data.data;
          }
          // If data.data is an object but not an array
          else if (typeof data.data === 'object' && data.data !== null) {
            reportData = [];
          }
        }
        
        // Fallback to empty array if reportData is still null
        setReports(Array.isArray(reportData) ? reportData : []);
      } else {
        setReports([]);
        setError(data.message || 'Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
      setError(error instanceof Error ? error.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  // Download Excel report
  const downloadExcelReport = async () => {
    try {
      setDownloading(true);
      setError('');
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`/api/services/reports/download/excel?${queryParams.toString()}`, {
        headers: {
          ...apiHeaders,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      
      // Check if response is JSON (error response) or Excel file
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download report');
      } else {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `service_reports_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Report downloaded successfully!');
      }
    } catch (error) {
      console.error('Error downloading Excel report:', error);
      setError(error instanceof Error ? error.message : 'Failed to download report');
      toast.error('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle client selection
  const handleClientSelect = (clientId: string, checked: boolean) => {
    let newSelectedIds: string[];
    
    if (checked) {
      newSelectedIds = [...selectedClientIds, clientId];
    } else {
      newSelectedIds = selectedClientIds.filter(id => id !== clientId);
    }
    
    setSelectedClientIds(newSelectedIds);
    
    // Update filters
    const clientIdsString = newSelectedIds.length > 0 ? newSelectedIds.join(',') : 'all';
    handleFilterChange('client_ids', clientIdsString);
  };

  // Handle select all clients
  const handleSelectAllClients = (checked: boolean) => {
    if (checked) {
      const allClientIds = clients.map(client => client.id.toString());
      setSelectedClientIds(allClientIds);
      handleFilterChange('client_ids', allClientIds.join(','));
    } else {
      setSelectedClientIds([]);
      handleFilterChange('client_ids', 'all');
    }
  };

  // Remove selected client
  const removeSelectedClient = (clientId: string) => {
    handleClientSelect(clientId, false);
  };

  // Get selected clients display text
  const getSelectedClientsText = () => {
    if (selectedClientIds.length === 0) return 'All Clients';
    if (selectedClientIds.length === 1) {
      const client = clients.find(c => c.id.toString() === selectedClientIds[0]);
      return client?.name || 'Selected Client';
    }
    return `${selectedClientIds.length} clients selected`;
  };

  // Handle service type selection
  const handleServiceTypeSelect = (serviceTypeId: string, checked: boolean) => {
    let newSelectedIds: string[];
    
    if (checked) {
      newSelectedIds = [...selectedServiceTypeIds, serviceTypeId];
    } else {
      newSelectedIds = selectedServiceTypeIds.filter(id => id !== serviceTypeId);
    }
    
    setSelectedServiceTypeIds(newSelectedIds);
    
    // Update filters
    const serviceTypeIdsString = newSelectedIds.length > 0 ? newSelectedIds.join(',') : 'all';
    handleFilterChange('service_type_ids', serviceTypeIdsString);
  };

  // Handle select all service types
  const handleSelectAllServiceTypes = (checked: boolean) => {
    if (checked) {
      const allServiceTypeIds = serviceTypes.map(serviceType => serviceType.id.toString());
      setSelectedServiceTypeIds(allServiceTypeIds);
      handleFilterChange('service_type_ids', allServiceTypeIds.join(','));
    } else {
      setSelectedServiceTypeIds([]);
      handleFilterChange('service_type_ids', 'all');
    }
  };

  // Remove selected service type
  const removeSelectedServiceType = (serviceTypeId: string) => {
    handleServiceTypeSelect(serviceTypeId, false);
  };

  // Get selected service types display text
  const getSelectedServiceTypesText = () => {
    if (selectedServiceTypeIds.length === 0) return 'All Services';
    if (selectedServiceTypeIds.length === 1) {
      const serviceType = serviceTypes.find(st => st.id.toString() === selectedServiceTypeIds[0]);
      return serviceType?.name || 'Selected Service';
    }
    return `${selectedServiceTypeIds.length} services selected`;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '0001-01-01T00:00:00Z') return '-';
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  // Get status badge variant
  const getStatusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status.toLowerCase()) {
      case 'aktif':
        return 'default';
      case 'non-aktif':
        return 'secondary';
      case 'selesai':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Report Preview</h1>
              <p className="text-sm text-gray-600">Lihat dan analisis laporan layanan</p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setError('')}
                    className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg font-semibold">
              <Filter className="h-5 w-5 mr-2 text-gray-600" />
              Filter & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <Label htmlFor="start_date" className="text-sm font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Start Date
                </Label>
                {filtersLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Input
                    id="start_date"
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                    className="w-full"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date" className="text-sm font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  End Date
                </Label>
                {filtersLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Input
                    id="end_date"
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                    className="w-full"
                  />
                )}
              </div>

              {/* Multi-Select Client Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Client
                </Label>
                {filtersLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="relative">
                    <Button
                      variant="outline"
                      className="w-full justify-between text-left font-normal"
                      onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
                    >
                      <span className="truncate">{getSelectedClientsText()}</span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                    
                    {clientDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {/* Select All Option */}
                        <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 border-b">
                          <Checkbox
                            id="select-all"
                            checked={selectedClientIds.length === clients.length}
                            onCheckedChange={handleSelectAllClients}
                          />
                          <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                            Select All
                          </label>
                        </div>
                        
                        {/* Client Options */}
                        {clients.map((client) => (
                          <div key={client.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50">
                            <Checkbox
                              id={`client-${client.id}`}
                              checked={selectedClientIds.includes(client.id.toString())}
                              onCheckedChange={(checked) => handleClientSelect(client.id.toString(), checked as boolean)}
                            />
                            <label htmlFor={`client-${client.id}`} className="text-sm cursor-pointer flex-1">
                              {client.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Multi-Select Service Type Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  <Settings className="h-4 w-4 mr-1" />
                  Service Type
                </Label>
                {filtersLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="relative">
                    <Button
                      variant="outline"
                      className="w-full justify-between text-left font-normal"
                      onClick={() => setServiceTypeDropdownOpen(!serviceTypeDropdownOpen)}
                    >
                      <span className="truncate">{getSelectedServiceTypesText()}</span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                    
                    {serviceTypeDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {/* Select All Option */}
                        <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 border-b">
                          <Checkbox
                            id="select-all-service-types"
                            checked={selectedServiceTypeIds.length === serviceTypes.length}
                            onCheckedChange={handleSelectAllServiceTypes}
                          />
                          <label htmlFor="select-all-service-types" className="text-sm font-medium cursor-pointer">
                            Select All
                          </label>
                        </div>
                        
                        {/* Service Type Options */}
                        {serviceTypes.map((serviceType) => (
                          <div key={serviceType.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50">
                            <Checkbox
                              id={`service-type-${serviceType.id}`}
                              checked={selectedServiceTypeIds.includes(serviceType.id.toString())}
                              onCheckedChange={(checked) => handleServiceTypeSelect(serviceType.id.toString(), checked as boolean)}
                            />
                            <label htmlFor={`service-type-${serviceType.id}`} className="text-sm cursor-pointer flex-1">
                              {serviceType.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select value={filters.status_id} onValueChange={(value) => handleFilterChange('status_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="1">Aktif</SelectItem>
                    <SelectItem value="0">Non-Aktif</SelectItem>
                    <SelectItem value="2">Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selected Clients Display */}
            {selectedClientIds.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-800">Selected clients:</span>
                {selectedClientIds.map((clientId) => {
                  const client = clients.find(c => c.id.toString() === clientId);
                  return (
                    <Badge key={clientId} variant="secondary" className="bg-blue-100 text-blue-800">
                      {client?.name}
                      <button
                        onClick={() => removeSelectedClient(clientId)}
                        className="ml-1 hover:text-blue-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}

            {/* Selected Service Types Display */}
            {selectedServiceTypeIds.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-800">Selected services:</span>
                {selectedServiceTypeIds.map((serviceTypeId) => {
                  const serviceType = serviceTypes.find(st => st.id.toString() === serviceTypeId);
                  return (
                    <Badge key={serviceTypeId} variant="secondary" className="bg-green-100 text-green-800">
                      {serviceType?.name}
                      <button
                        onClick={() => removeSelectedServiceType(serviceTypeId)}
                        className="ml-1 hover:text-green-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({ start_date: '', end_date: '', client_ids: 'all', service_type_ids: 'all', status_id: '1' });
                  setSelectedClientIds([]);
                  setSelectedServiceTypeIds([]);
                  setError('');
                }}
                className="text-sm"
              >
                Reset
              </Button>
              <Button 
                onClick={fetchReports}
                disabled={loading}
                className="text-sm bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Filter className="h-4 w-4 mr-2" />
                )}
                Apply Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">Report Results</CardTitle>
              <Button 
                onClick={downloadExcelReport}
                disabled={downloading || reports.length === 0}
                variant="outline"
                className="text-sm"
              >
                {downloading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Download Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={`skeleton-${i}`} className="h-16 w-full" />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
                <p className="text-gray-600 mb-4">
                  {error ? 'There was an error loading the reports.' : 'Try adjusting your filters or date range'}
                </p>
                <Button onClick={fetchReports} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Client</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Service Category Name</TableHead>
                      <TableHead>Service Detail Name</TableHead>
                      <TableHead>Order Type</TableHead>
                      <TableHead className="text-right">Base Price</TableHead>
                      <TableHead className="text-right">Normal Price</TableHead>
                      <TableHead className="text-right">Discount Value</TableHead>
                      <TableHead>Discount Type</TableHead>
                      <TableHead className="text-right">Final Price</TableHead>
                      <TableHead>Start Period</TableHead>
                      <TableHead>End Period</TableHead>
                      <TableHead>Handled By</TableHead>
                      <TableHead>PIC</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report, index) => (
                      <TableRow key={`report-${report.id}-${index}`} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                            <p className="font-semibold text-gray-900">{report.client_name}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-900">{report.service_type_name}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-900">{report.service_category_name}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-900">{report.service_detail_name}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-900">{report.order_type}</p>
                        </TableCell>               
                        <TableCell className="text-right">
                            <p className="text-sm font-semibold text-green-600">
                              {formatCurrency(report.base_price)}
                            </p>                
                        </TableCell> 
                        <TableCell className="text-right">
                            <p className="text-sm font-semibold text-green-600">
                              {formatCurrency(report.normal_price)}
                            </p>                
                        </TableCell>    
                        <TableCell className="text-right">
                            <p className="text-sm font-semibold text-green-600">
                              {formatCurrency(report.discount)}
                            </p>                
                        </TableCell>        
                        <TableCell>
                          <p className="text-sm text-gray-900">{report.discount_type || '-'}</p>        
                        </TableCell>
                        <TableCell className="text-right">
                            <p className="text-sm font-semibold text-green-600">
                              {formatCurrency(report.final_price)}
                            </p>                
                        </TableCell>   
                        <TableCell>
                          <p className="text-sm text-gray-900">{formatDate(report.start_date) || '-'}</p>        
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-900">{formatDate(report.end_date) || '-'}</p>        
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-900">{report.handled_by || '-'}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-900">{report.pic || '-'}</p>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          {report.notes ? (
                            <p className="text-sm text-gray-700 truncate" title={report.notes}>
                              {report.notes}
                            </p>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(report.status_name)}>
                            {report.status_name}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportPreview;