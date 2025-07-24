
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CreditCard, User, Mail, Phone, MapPin, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BriefData {
  productId: string;
  productName: string;
  tier: 'basic' | 'standard' | 'premium';
  price: number;
  quantity: number;
  details: string;
  dimensions: string;
  additionalNotes?: string;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
}

interface CheckoutClientPageProps {
  orderIds: string[];
}

export default function CheckoutClientPage({ orderIds }: CheckoutClientPageProps): JSX.Element {
  const [briefs, setBriefs] = useState<BriefData[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Partial<CustomerInfo>>({});
  const router = useRouter();
  const { toast } = useToast();

  useEffect((): void => {
    const savedBriefs = sessionStorage.getItem('briefData');
    if (savedBriefs) {
      try {
        const parsedBriefs = JSON.parse(savedBriefs) as BriefData[];
        setBriefs(parsedBriefs);
      } catch (error) {
        console.error('Error parsing brief data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Data brief tidak valid. Silakan mulai dari awal.',
        });
        router.push('/products');
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Data tidak ditemukan',
        description: 'Tidak ada data brief. Silakan mulai dari awal.',
      });
      router.push('/products');
    }
  }, [router, toast]);

  const getTierLabel = (tier: 'basic' | 'standard' | 'premium'): string => {
    const labels: Record<'basic' | 'standard' | 'premium', string> = {
      basic: 'Basic',
      standard: 'Standard',
      premium: 'Premium'
    };
    return labels[tier];
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getTotalPrice = (): number => {
    return briefs.reduce((total, brief) => total + (brief.price * brief.quantity), 0);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CustomerInfo> = {};

    if (!customerInfo.name.trim()) {
      newErrors.name = 'Nama wajib diisi';
    }

    if (!customerInfo.email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!customerInfo.phone.trim()) {
      newErrors.phone = 'Nomor telepon wajib diisi';
    } else if (!/^[0-9+\-\s()]+$/.test(customerInfo.phone)) {
      newErrors.phone = 'Format nomor telepon tidak valid';
    }

    if (!customerInfo.address.trim()) {
      newErrors.address = 'Alamat wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CustomerInfo, value: string): void => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!validateForm()) {
      toast({
        variant: 'destructive',
        title: 'Form tidak valid',
        description: 'Silakan periksa dan lengkapi semua field yang wajib diisi.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Save customer info and order data
      const orderData = {
        orderIds,
        customerInfo,
        briefs,
        totalPrice: getTotalPrice(),
        createdAt: new Date().toISOString()
      };

      sessionStorage.setItem('orderData', JSON.stringify(orderData));
      sessionStorage.removeItem('briefData');

      toast({
        title: 'Pesanan berhasil dibuat',
        description: 'Anda akan diarahkan ke halaman pembayaran',
      });

      // Redirect to payment
      setTimeout(() => {
        router.push(`/payment/${orderIds.join(',')}`);
      }, 1000);

    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal membuat pesanan. Silakan coba lagi.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (briefs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">📋</div>
            <CardTitle>Memuat Data...</CardTitle>
            <CardDescription>
              Sedang memuat data checkout Anda
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
              <p className="text-gray-600">Lengkapi informasi untuk menyelesaikan pesanan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Customer Information Form */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informasi Pelanggan
                  </CardTitle>
                  <CardDescription>
                    Masukkan informasi kontak dan alamat Anda
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Masukkan nama lengkap"
                      value={customerInfo.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={errors.name !== undefined ? 'border-red-500' : ''}
                    />
                    {errors.name !== undefined && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contoh@email.com"
                      value={customerInfo.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={errors.email !== undefined ? 'border-red-500' : ''}
                    />
                    {errors.email !== undefined && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">
                      Nomor Telepon <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="08123456789"
                      value={customerInfo.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={errors.phone !== undefined ? 'border-red-500' : ''}
                    />
                    {errors.phone !== undefined && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="address">
                      Alamat <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="address"
                      placeholder="Masukkan alamat lengkap"
                      value={customerInfo.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className={errors.address !== undefined ? 'border-red-500' : ''}
                    />
                    {errors.address !== undefined && (
                      <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="notes">Catatan Tambahan</Label>
                    <Textarea
                      id="notes"
                      placeholder="Catatan khusus untuk pesanan (opsional)"
                      value={customerInfo.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Ringkasan Pesanan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {briefs.map((brief, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{brief.productName}</h4>
                            <Badge variant="outline" className="mt-1">
                              {getTierLabel(brief.tier)}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              {formatPrice(brief.price * brief.quantity)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatPrice(brief.price)} x {brief.quantity}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div><strong>Detail:</strong> {brief.details}</div>
                          <div><strong>Dimensi:</strong> {brief.dimensions}</div>
                          {brief.additionalNotes !== undefined && brief.additionalNotes.length > 0 && (
                            <div><strong>Catatan:</strong> {brief.additionalNotes}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-blue-600">{formatPrice(getTotalPrice())}</span>
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <AlertDescription>
                  Setelah mengklik "Lanjut ke Pembayaran", Anda akan diarahkan ke halaman pembayaran 
                  dengan instruksi transfer bank.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                size="lg"
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Lanjut ke Pembayaran
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
