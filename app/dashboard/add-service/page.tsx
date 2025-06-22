"use client"
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Plus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from "next/navigation";
import { Separator } from '@/components/ui/separator';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';

interface DecodedToken {
  id: string;
  username: string;
  email: string;
  role: string;
  exp: number;
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

interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

interface Vendor {
  id: number;
  name: string;
  description?: string;
}


interface FormData {
  service_detail_name: string;
  client_id: number | null;
  service_type_id: number | null;
  vendor_id: number | null;
  domain_name: string;
  base_price: number;
  normal_price: number;
  is_discount: boolean;
  discount_type: 'amount' | 'percentage';
  discount: number;
  final_price: number;
  notes: string;
  start_date: string;
  end_date: string;
  handled_by: string;
  status: number;
  pic: string;
  order_type: 'NEW' | 'RENEWAL';
  renewal_service_id: number;
  created_by: string;
}

export default function AddServiceForm() {
  const [formData, setFormData] = useState<FormData>({
    service_detail_name: '',
    client_id: null,
    service_type_id: null,
    vendor_id: null,
    domain_name: '',
    base_price: 0,
    normal_price: 0,
    is_discount: false,
    discount_type: 'amount',
    discount: 0,
    final_price: 0,
    notes: '',
    start_date: '',
    end_date: '',
    handled_by: '',
    status: 1,
    pic: '',
    order_type: 'NEW',
    renewal_service_id: 0,
    created_by: 'User'
  });
  
  const router = useRouter();
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);
  
  const [loadingServiceTypes, setLoadingServiceTypes] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const apiHeaders = {
    'Authorization': `Bearer ${token}`,
    'X-Api-Key': 'X-Secret-Key',
    'Content-Type': 'application/json',
  };

  // Fetch Service Types
  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        const response = await fetch('/api/service_types/all', {
          headers: apiHeaders,
        });
        const data = await response.json();
        if (data.code === 200) {
          setServiceTypes(data.data);
        }
      } catch (error) {
        console.error('Error fetching service types:', error);
        setError('Failed to load service types');
      } finally {
        setLoadingServiceTypes(false);
      }
    };

    fetchServiceTypes();
  }, []);

  // Fetch Clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients/all', {
          headers: apiHeaders,
        });
        const data = await response.json();
        if (data.code === 200) {
          setClients(data.data);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
        setError('Failed to load clients');
      } finally {
        setLoadingClients(false);
      }
    };

    fetchClients();
  }, []);


  // Fetch Vendors when needed
  const fetchVendors = async () => {
    if (vendors.length > 0) return; // Already loaded

    setLoadingVendors(true);
    try {
      const response = await fetch('/api/vendors/all', {
        headers: apiHeaders,
      });
      const data = await response.json();
      if (data.code === 200) {
        setVendors(data.data);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setError('Failed to load vendors');
    } finally {
      setLoadingVendors(false);
    }
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
      }, 1 * 60 * 1000); // 30 menit
  
      return () => clearTimeout(timeout); 

    } catch (error) {
      console.error('Failed to decode token:', error);
      localStorage.removeItem('token');
      router.push('/auth/sign-in');
    }
  }, [router]);


  // Handle service type change
  const handleServiceTypeChange = (serviceTypeId: string) => {
    const serviceType = serviceTypes.find(st => st.id === parseInt(serviceTypeId));
    setSelectedServiceType(serviceType || null);
    setFormData(prev => ({
      ...prev,
      service_type_id: parseInt(serviceTypeId),
      base_price: serviceType?.price || 0,
      normal_price: serviceType?.price || 0,
      final_price: serviceType?.price || 0
    }));

    // Load vendors if needed
    if (serviceType?.is_need_vendor === '1') {
      fetchVendors();
    }
  };

  // Handle client change
  const handleClientChange = (clientId: string) => {
    const selectedClientId = parseInt(clientId);
    setFormData(prev => ({
      ...prev,
      client_id: selectedClientId,
      renewal_service_id: 0 // Reset renewal service when client changes
    }));


  };




  // Calculate final price
  useEffect(() => {
    let finalPrice = formData.normal_price;
    
    if (formData.is_discount && formData.discount > 0) {
      if (formData.discount_type === 'percentage') {
        finalPrice = formData.normal_price - (formData.normal_price * formData.discount / 100);
      } else {
        finalPrice = formData.normal_price - formData.discount;
      }
    }
    
    setFormData(prev => ({ ...prev, final_price: Math.max(0, finalPrice) }));
  }, [formData.normal_price, formData.is_discount, formData.discount_type, formData.discount]);

  const handleInputChange = (field: keyof FormData, value: string | number | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify(formData),
      });

      const data = await response.json();
        
      if (response.ok && data.code === 200) {
        setSuccess(true);
        setTimeout(() => {
         router.push("/dashboard/service-page");
        }, 3000);
      } else {
        setError(data.message || 'Failed to update service');
      }
    } catch (error) {
      console.error('Error creating service:', error);
      setError('Failed to create service');
    } finally {
      setSubmitting(false);
    }
  };

  const isVendorRequired = selectedServiceType?.is_need_vendor === '1';

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Service
        </CardTitle>
        <CardDescription>
          Create a new service for your client
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-800">
              Service created successfully! Redirecting...
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-8">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                {loadingClients ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={formData.client_id?.toString() || ''}
                    onValueChange={handleClientChange}
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_detail_name">Service Detail Name *</Label>
                <Input
                  id="service_detail_name"
                  value={formData.service_detail_name}
                  onChange={(e) => handleInputChange('service_detail_name', e.target.value)}
                  placeholder="Enter service detail name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_type">Service Type *</Label>
                {loadingServiceTypes ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select 
                    value={formData.service_type_id?.toString() || ''}
                    onValueChange={handleServiceTypeChange}
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name} - Rp {type.price.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              

            </div>
          </div>


          {/* Vendor and Domain Section */}
          {isVendorRequired && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Vendor Information</h3>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-gray-50/50">
                <div className="space-y-2">
                  <Label htmlFor="domain_name">Domain Host</Label>
                  <Input
                    id="domain_name"
                    value={formData.domain_name}
                    onChange={(e) => handleInputChange('domain_name', e.target.value)}
                    placeholder="Enter domain name (e.g., example.com)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor *</Label>
                  {loadingVendors ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={formData.vendor_id?.toString() || ''}
                      onValueChange={(value) => handleInputChange('vendor_id', parseInt(value))}
                      required
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id.toString()}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pricing Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Pricing Information</h3>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="base_price">Base Price</Label>
                <Input
                  id="base_price"
                  type="number"
                  value={formData.base_price}
                  onChange={(e) => handleInputChange('base_price', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="normal_price">Normal Price</Label>
                <Input
                  id="normal_price"
                  type="number"
                  value={formData.normal_price}
                  onChange={(e) => handleInputChange('normal_price', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="final_price">Final Price</Label>
                <Input
                  id="final_price"
                  type="number"
                  value={formData.final_price}
                  readOnly
                  className="bg-gray-50 text-right font-medium"
                />
              </div>
            </div>

            {/* Discount Section */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_discount"
                  checked={formData.is_discount}
                  onCheckedChange={(checked) => handleInputChange('is_discount', checked)}
                />
                <Label htmlFor="is_discount">Apply Discount</Label>
              </div>

              {formData.is_discount && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="discount_type">Discount Type</Label>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(value: 'amount' | 'percentage') => handleInputChange('discount_type', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amount">Fixed Amount</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount">
                      Discount {formData.discount_type === 'percentage' ? '(%)' : '(Rp)'}
                    </Label>
                    <Input
                      id="discount"
                      type="number"
                      value={formData.discount}
                      onChange={(e) => handleInputChange('discount', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="text-right"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dates Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Service Period</h3>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date.slice(0, 16)}
                  onChange={(e) => handleInputChange('start_date', e.target.value + ':00Z')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date.slice(0, 16)}
                  onChange={(e) => handleInputChange('end_date', e.target.value + ':00Z')}
                />
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Additional Information</h3>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="handled_by">Handled By *</Label>
                <Input
                  id="handled_by"
                  value={formData.handled_by}
                  onChange={(e) => handleInputChange('handled_by', e.target.value)}
                  placeholder="Enter handler name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pic">PIC *</Label>
                <Input
                  id="pic"
                  value={formData.pic}
                  onChange={(e) => handleInputChange('pic', e.target.value)}
                  placeholder="Enter PIC name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Enter additional notes..."
                rows={4}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push("/dashboard/service-page")}
              className="cursor-pointer min-w-[120px]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting} 
              className="cursor-pointer min-w-[120px]"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? 'Creating...' : 'Create Service'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}