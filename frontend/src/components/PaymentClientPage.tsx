
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Copy, 
  CheckCircle, 
  Clock, 
  CreditCard, 
  Building2,
  FileText,
  Phone,
  Mail
} from 'lucide-react';
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

interface OrderData {
  orderIds: string[];
  customerInfo: CustomerInfo;
  briefs: BriefData[];
  totalPrice: number;
  createdAt: string;
}

interface PaymentClientPageProps {
  orderIds: string[];
}

interface BankInfo {
  name: string;
  accountNumber: string;
  accountName: string;
  icon: string;
}

const BANK_ACCOUNTS: BankInfo[] = [
  {
    name: 'Bank BCA',
    accountNumber: '1234567890',
    accountName: 'URGENT STUDIO',
    icon: '🏦'
  },
  {
    name: 'Bank Mandiri',
    accountNumber: '0987654321',
    accountName: 'URGENT STUDIO',
    icon: '🏛️'
  },
  {
    name: 'Bank BNI',
    accountNumber: '1122334455',
    accountName: 'URGENT STUDIO',
    icon: '🏢'
  }
];

export default function PaymentClientPage({ orderIds }: PaymentClientPageProps): JSX.Element {
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [selectedBank, setSelectedBank] = useState<BankInfo>(BANK_ACCOUNTS[0]);
  const [paymentConfirmed, setPaymentConfirmed] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect((): void => {
    const savedOrderData = sessionStorage.getItem('orderData');
    if (savedOrderData) {
      try {
        const parsedData = JSON.parse(savedOrderData) as OrderData;
        setOrderData(parsedData);
      } catch (error) {
        console.error('Error parsing order data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Data pesanan tidak valid. Silakan mulai dari awal.',
        });
        router.push('/products');
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Data tidak ditemukan',
        description: 'Tidak ada data pesanan. Silakan mulai dari awal.',
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

  const copyToClipboard = async (text: string, label: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Berhasil disalin',
        description: `${label} telah disalin ke clipboard`,
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal menyalin',
        description: 'Silakan salin secara manual',
      });
    }
  };

  const handleConfirmPayment = async (): Promise<void> => {
    setIsConfirming(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update payment status
      const updatedOrderData = {
        ...orderData,
        paymentStatus: 'confirmed',
        paymentMethod: selectedBank.name,
        confirmedAt: new Date().toISOString()
      };

      sessionStorage.setItem('orderData', JSON.stringify(updatedOrderData));
      setPaymentConfirmed(true);

      toast({
        title: 'Konfirmasi pembayaran berhasil',
        description: 'Terima kasih! Tim kami akan segera memproses pesanan Anda.',
      });

      // Redirect to success page after delay
      setTimeout(() => {
        router.push('/payment/success');
      }, 2000);

    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal mengkonfirmasi pembayaran. Silakan coba lagi.',
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const generateOrderId = (): string => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">💳</div>
            <CardTitle>Memuat Data Pembayaran...</CardTitle>
            <CardDescription>
              Sedang memuat informasi pembayaran Anda
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (paymentConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-green-800">Pembayaran Dikonfirmasi!</CardTitle>
            <CardDescription>
              Terima kasih! Pesanan Anda sedang diproses.
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
              <h1 className="text-3xl font-bold text-gray-900">Pembayaran</h1>
              <p className="text-gray-600">Selesaikan pembayaran untuk memproses pesanan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Instructions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Instruksi Pembayaran
                  </CardTitle>
                  <CardDescription>
                    Pilih bank dan transfer sesuai nominal yang tertera
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Bank Selection */}
                  <div>
                    <h4 className="font-semibold mb-3">Pilih Bank Tujuan:</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {BANK_ACCOUNTS.map((bank) => (
                        <div
                          key={bank.name}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedBank.name === bank.name
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedBank(bank)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{bank.icon}</span>
                            <div>
                              <div className="font-semibold">{bank.name}</div>
                              <div className="text-sm text-gray-600">{bank.accountNumber}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selected Bank Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Detail Rekening Terpilih
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Bank:</span>
                        <span className="font-semibold">{selectedBank.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">No. Rekening:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{selectedBank.accountNumber}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(selectedBank.accountNumber, 'Nomor rekening')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Atas Nama:</span>
                        <span className="font-semibold">{selectedBank.accountName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Nominal Transfer:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-blue-600">
                            {formatPrice(orderData.totalPrice)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(orderData.totalPrice.toString(), 'Nominal transfer')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Steps */}
                  <div>
                    <h4 className="font-semibold mb-3">Langkah Pembayaran:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                      <li>Transfer ke rekening {selectedBank.name} di atas</li>
                      <li>Gunakan nominal transfer yang tepat: {formatPrice(orderData.totalPrice)}</li>
                      <li>Simpan bukti transfer</li>
                      <li>Klik tombol "Konfirmasi Pembayaran" di bawah</li>
                      <li>Tim kami akan memverifikasi dalam 1x24 jam</li>
                    </ol>
                  </div>

                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Penting:</strong> Pastikan nominal transfer sesuai persis dengan yang tertera. 
                      Transfer dengan nominal berbeda akan memperlambat proses verifikasi.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Butuh Bantuan?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>WhatsApp: +62 812-3456-7890</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>Email: support@urgentstudio.com</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Tim customer service kami siap membantu Anda 24/7
                  </p>
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
                  <CardDescription>
                    Order ID: {generateOrderId()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orderData.briefs.map((brief, index) => (
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
                          {brief.additionalNotes && (
                            <div><strong>Catatan:</strong> {brief.additionalNotes}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatPrice(orderData.totalPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Biaya Admin:</span>
                      <span>Gratis</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total Pembayaran:</span>
                      <span className="text-blue-600">{formatPrice(orderData.totalPrice)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Pelanggan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div><strong>Nama:</strong> {orderData.customerInfo.name}</div>
                  <div><strong>Email:</strong> {orderData.customerInfo.email}</div>
                  <div><strong>Telepon:</strong> {orderData.customerInfo.phone}</div>
                  <div><strong>Alamat:</strong> {orderData.customerInfo.address}</div>
                  {orderData.customerInfo.notes && (
                    <div><strong>Catatan:</strong> {orderData.customerInfo.notes}</div>
                  )}
                </CardContent>
              </Card>

              {/* Confirm Payment Button */}
              <Button
                onClick={handleConfirmPayment}
                disabled={isConfirming}
                size="lg"
                className="w-full"
              >
                {isConfirming ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Mengkonfirmasi...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Konfirmasi Pembayaran
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Dengan mengklik "Konfirmasi Pembayaran", Anda menyatakan bahwa telah melakukan transfer 
                sesuai nominal yang tertera dan menyetujui syarat & ketentuan kami.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
