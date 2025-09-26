"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  Clock, 
  User, 
  Phone, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Send,
  MessageCircle
} from 'lucide-react';

interface Message {
  account_sid: string;
  api_version: string;
  body: string;
  date_created: string;
  date_sent: string;
  date_updated: string;
  direction: 'inbound' | 'outbound-api';
  error_code: string | null;
  error_message: string | null;
  from: string;
  messaging_service_sid: string | null;
  num_media: string;
  num_segments: string;
  price: string | null;
  price_unit: string;
  sid: string;
  status: string;
  to: string;
  uri: string;
}

interface LogData {
  end: number;
  first_page_uri: string;
  messages: Message[];
  next_page_uri: string | null;
  page: number;
  page_size: number;
  previous_page_uri: string | null;
  start: number;
  uri: string;
}

interface ApiResponse {
  code: number;
  status: string;
  data: LogData;
}

const WhatsAppLogViewer = () => {
  const [data, setData] = useState<LogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Cache untuk menyimpan data per halaman
  const [cache, setCache] = useState<Map<number, LogData>>(new Map());

  const fetchData = async (page: number = 0) => {
    // Cek cache terlebih dahulu
    const cachedData = cache.get(page);
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token tidak ditemukan');
      }

      const response = await fetch(`/api/log/wa?page=${page}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            "X-Api-Key": "X-Secret-Key",
            "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result: ApiResponse = await response.json();
      
      if (result.code === 200) {
        setData(result.data);
        // Simpan ke cache
        setCache(prev => new Map(prev).set(page, result.data));
      } else {
        throw new Error(result.status || 'Terjadi kesalahan');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan tidak dikenal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPhoneNumber = (phone: string) => {
    return phone.replace('whatsapp:', '');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500';
      case 'read':
        return 'bg-blue-500';
      case 'sent':
        return 'bg-yellow-500';
      case 'received':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getDirectionIcon = (direction: string) => {
    return direction === 'inbound' ? (
      <MessageCircle className="w-4 h-4 text-blue-500" />
    ) : (
      <Send className="w-4 h-4 text-green-500" />
    );
  };

  const handleRefresh = () => {
    // Clear cache untuk halaman saat ini
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(currentPage);
      return newCache;
    });
    fetchData(currentPage);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={handleRefresh} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-green-500" />
          <div>
            <h1 className="text-2xl font-bold">WhatsApp Log</h1>
            <p className="text-gray-600">Riwayat pesan WhatsApp</p>
          </div>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Pesan</p>
                  <p className="text-lg font-semibold">{data.end}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Halaman</p>
                  <p className="text-lg font-semibold">{data.page + 1}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Per Halaman</p>
                  <p className="text-lg font-semibold">{data.page_size}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Range</p>
                  <p className="text-lg font-semibold">{data.start + 1}-{data.end}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Messages */}
      <div className="space-y-4">
        {loading ? (
          // Skeleton Loading
          Array.from({ length: 5 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : (
          data?.messages.map((message) => (
            <Card key={message.sid} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getDirectionIcon(message.direction)}
                    <CardTitle className="text-lg">
                      {message.direction === 'inbound' ? 'Pesan Masuk' : 'Pesan Keluar'}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={`${getStatusColor(message.status)} text-white`}
                    >
                      {message.status}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {formatDate(message.date_created)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <span className="font-medium">Dari:</span>
                      <span>{formatPhoneNumber(message.from)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <span className="font-medium">Ke:</span>
                      <span>{formatPhoneNumber(message.to)}</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.body}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>Media: {message.num_media}</span>
                    <span>Segmen: {message.num_segments}</span>
                    {message.price && (
                      <span>Harga: {message.price} {message.price_unit}</span>
                    )}
                    <span>Dikirim: {formatDate(message.date_sent)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {data && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
          <div className="text-sm text-gray-600">
            Menampilkan {data.start + 1} - {data.end} dari total pesan
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!data.previous_page_uri || loading}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!data.next_page_uri || loading}
              className="flex items-center gap-2"
            >
              Selanjutnya
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppLogViewer;