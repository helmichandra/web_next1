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
import { Loader2, Edit, AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter, useParams } from "next/navigation";

interface Client {
  id: number;
  name: string;
  description: string;
  price: number;
  created_date: string;
  created_by: string;
  modified_date: string | null;
  modified_by: string;
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

interface Vendor {
  id: number;
  name: string;
  description: string;
  created_date: string;
  created_by: string;
  modified_date: string;
  modified_by: string;
}

interface ServiceData {
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
  discount_type: 'amount' | 'percentage';
  discount: number;
  final_price: number;
  notes: string;
  status: number;
  status_name: string;
  start_date: string;
  end_date: string;
  handled_by: string;
  pic: string;
  order_type: 'NEW' | 'RENEWAL';
  renewal_service_id: number;
  renewal_service_name: string | null;
  created_date: string;
  created_by: string;
  modified_date: string;
  modified_by: string;
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

// This is now a proper Next.js page component
export default function EditServicePage() {
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
    created_by: ''
  });
  
  const params = useParams();
  const serviceId = params.id as string;
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);
  const router = useRouter();
  const [loadingService, setLoadingService] = useState(true);
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

  // Fetch Service Data
  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        const response = await fetch(`/api/services/id/${serviceId}`, {
          headers: apiHeaders,
        });
        const data = await response.json();
        if (data.code === 200) {
          const service = data.data;
          setServiceData(service);
          
          // Populate form with existing data
          setFormData({
            service_detail_name: service.service_detail_name,
            client_id: service.client_id,
            service_type_id: service.service_type_id,
            vendor_id: service.vendor_id,
            domain_name: service.domain_name || '',
            base_price: service.base_price,
            normal_price: service.normal_price,
            is_discount: service.is_discount,
            discount_type: service.discount_type,
            discount: service.discount,
            final_price: service.final_price,
            notes: service.notes || '',
            start_date: service.start_date,
            end_date: service.end_date,
            handled_by: service.handled_by || '',
            status: service.status,
            pic: service.pic || '',
            order_type: service.order_type,
            renewal_service_id: service.renewal_service_id,
            created_by: service.created_by
          });
        } else {
          setError('Failed to load service data');
        }
      } catch (error) {
        console.error('Error fetching service data:', error);
        setError('Failed to load service data');
      } finally {
        setLoadingService(false);
      }
    };

    if (serviceId) {
      fetchServiceData();
    }
  }, [serviceId]);

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

  // Fetch Vendors
  useEffect(() => {
    const fetchVendors = async () => {
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

    fetchVendors();
  }, []);

  // Set selected service type when service types and form data are loaded
  useEffect(() => {
    if (serviceTypes.length > 0 && formData.service_type_id) {
      const serviceType = serviceTypes.find(s => s.id === formData.service_type_id);
      setSelectedServiceType(serviceType || null);
    }
  }, [serviceTypes, formData.service_type_id]);

  // Handle service type change
  const handleServiceTypeChange = (serviceTypeId: string) => {
    const serviceType = serviceTypes.find(s => s.id === parseInt(serviceTypeId));
    setSelectedServiceType(serviceType || null);
    setFormData(prev => ({
      ...prev,
      service_type_id: parseInt(serviceTypeId),
      base_price: serviceType?.price || 0,
      normal_price: serviceType?.price || 0
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
      const response = await fetch(`/api/services/id/${serviceId}`, {
        method: 'PUT',
        headers: apiHeaders,
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok && data.code === 200) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard/service-page");
        }, 2000);
      } else {
        setError(data.message || 'Failed to update service');
      }
    } catch (error) {
      console.error('Error updating service:', error);
      setError('Failed to update service');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push("/dashboard/service-page");
  };

  const isVendorRequired = selectedServiceType?.is_need_vendor === '1';

  if (loadingService) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack} className="cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Service
            </CardTitle>
            <CardDescription>
              Update service details for {serviceData?.service_detail_name}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Service updated successfully! Redirecting...
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Service Detail Name */}
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

            {/* Service Type */}
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
                  <SelectTrigger>
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

            {/* Client Type */}
            <div className="space-y-2">
              <Label htmlFor="client">Client Type *</Label>
              {loadingClients ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={formData.client_id?.toString() || ''}
                  onValueChange={(value) => handleInputChange('client_id', parseInt(value))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client type" />
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

            {/* Order Type */}
            <div className="space-y-2">
              <Label htmlFor="order_type">Order Type</Label>
              <Select
                value={formData.order_type}
                onValueChange={(value: 'NEW' | 'RENEWAL') => handleInputChange('order_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select order type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="RENEWAL">Renewal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status.toString()}
                onValueChange={(value) => handleInputChange('status', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="0">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vendor and Domain (show only if vendor is needed) */}
          {isVendorRequired && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-gray-50">
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
                <Label htmlFor="vendor">Vendor</Label>
                {loadingVendors ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={formData.vendor_id?.toString() || ''}
                    onValueChange={(value) => handleInputChange('vendor_id', parseInt(value))}
                  >
                    <SelectTrigger>
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
          )}

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="base_price">Base Price</Label>
              <Input
                id="base_price"
                type="number"
                value={formData.base_price}
                onChange={(e) => handleInputChange('base_price', parseFloat(e.target.value) || 0)}
                placeholder="0"
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="final_price">Final Price</Label>
              <Input
                id="final_price"
                type="number"
                value={formData.final_price}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>

          {/* Discount */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_discount"
                checked={formData.is_discount}
                onCheckedChange={(checked) => handleInputChange('is_discount', checked)}
              />
              <Label htmlFor="is_discount">Apply Discount</Label>
            </div>

            {formData.is_discount && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_type">Discount Type</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value: 'amount' | 'percentage') => handleInputChange('discount_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amount">Amount</SelectItem>
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
                  />
                </div>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="datetime-local"
                value={formData.start_date ? new Date(formData.start_date).toISOString().slice(0, 16) : ''}
                onChange={(e) => handleInputChange('start_date', e.target.value ? new Date(e.target.value).toISOString() : '')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="datetime-local"
                value={formData.end_date ? new Date(formData.end_date).toISOString().slice(0, 16) : ''}
                onChange={(e) => handleInputChange('end_date', e.target.value ? new Date(e.target.value).toISOString() : '')}
              />
            </div>
          </div>

          {/* Additional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="handled_by">Handled By</Label>
              <Input
                id="handled_by"
                value={formData.handled_by}
                onChange={(e) => handleInputChange('handled_by', e.target.value)}
                placeholder="Enter handler name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pic">PIC</Label>
              <Input
                id="pic"
                value={formData.pic}
                onChange={(e) => handleInputChange('pic', e.target.value)}
                placeholder="Enter PIC name"
              />
            </div>
          </div>

          {/* Renewal Service ID (only show if order type is RENEWAL) */}
          {formData.order_type === 'RENEWAL' && (
            <div className="space-y-2">
              <Label htmlFor="renewal_service_id">Renewal Service ID</Label>
              <Input
                id="renewal_service_id"
                type="number"
                value={formData.renewal_service_id}
                onChange={(e) => handleInputChange('renewal_service_id', parseInt(e.target.value) || 0)}
                placeholder="Enter renewal service ID"
              />
            </div>
          )}

          {/* Notes */}
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

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleBack}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="cursor-pointer">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? 'Updating...' : 'Update Service'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}