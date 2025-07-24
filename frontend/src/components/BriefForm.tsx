
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Copy, Trash2, ShoppingCart, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  productId: string;
  productName: string;
  tier: 'basic' | 'standard' | 'premium';
  price: number;
  quantity: number;
}

interface BriefData {
  productId: string;
  productName: string;
  tier: 'basic' | 'standard' | 'premium';
  price: number;
  quantity: number;
  details: string;
  dimensions: string;
  additionalNotes?: string | undefined;
}

interface GroupedBrief {
  tier: 'basic' | 'standard' | 'premium';
  items: BriefData[];
  totalPrice: number;
}

const briefSchema = z.object({
  briefs: z.array(z.object({
    productId: z.string().min(1, 'Product ID diperlukan'),
    productName: z.string().min(1, 'Nama produk diperlukan'),
    tier: z.enum(['basic', 'standard', 'premium']),
    price: z.number().min(0, 'Harga harus valid'),
    quantity: z.number().min(1, 'Quantity minimal 1'),
    details: z.string().min(10, 'Detail minimal 10 karakter'),
    dimensions: z.string().min(1, 'Dimensi diperlukan'),
    additionalNotes: z.string().optional(),
  }))
});

type BriefFormData = z.infer<typeof briefSchema>;

export default function BriefForm(): JSX.Element {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<BriefFormData>({
    resolver: zodResolver(briefSchema),
    defaultValues: {
      briefs: []
    }
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'briefs'
  });

  const watchedBriefs = watch('briefs');

  useEffect((): void => {
    const savedCart = sessionStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart) as CartItem[];
        setCart(parsedCart);
        
        // Initialize form with cart items
        const initialBriefs: BriefData[] = parsedCart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          tier: item.tier,
          price: item.price,
          quantity: item.quantity,
          details: '',
          dimensions: '',
          additionalNotes: ''
        }));
        
        reset({ briefs: initialBriefs });
      } catch (error) {
        console.error('Error parsing cart from sessionStorage:', error);
        sessionStorage.removeItem('cart');
      }
    }
  }, [reset]);

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

  const groupBriefsByTier = (): GroupedBrief[] => {
    const groups: Record<string, GroupedBrief> = {};
    
    watchedBriefs.forEach((brief) => {
      if (!groups[brief.tier]) {
        groups[brief.tier] = {
          tier: brief.tier,
          items: [],
          totalPrice: 0
        };
      }
      const group = groups[brief.tier];
      if (group) {
        group.items.push(brief);
        group.totalPrice += brief.price * brief.quantity;
      }
    });

    return Object.values(groups);
  };

  const getTotalPrice = (): number => {
    return watchedBriefs.reduce((total, brief) => total + (brief.price * brief.quantity), 0);
  };

  const addDesignToBrief = (tier: 'basic' | 'standard' | 'premium'): void => {
    // Find a product from cart with this tier to use as template
    const templateItem = cart.find(item => item.tier === tier);
    if (templateItem === undefined) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Tidak ada produk dengan tier ini di keranjang',
      });
      return;
    }

    const newBrief: BriefData = {
      productId: templateItem.productId,
      productName: templateItem.productName,
      tier: templateItem.tier,
      price: templateItem.price,
      quantity: 1,
      details: '',
      dimensions: '',
      additionalNotes: ''
    };

    append(newBrief);
  };

  const copyBriefDetails = (fromIndex: number, toIndex: number, copyType: 'details' | 'dimensions' | 'both'): void => {
    const fromBrief = watchedBriefs[fromIndex];
    const toBrief = watchedBriefs[toIndex];

    if (fromBrief === undefined || toBrief === undefined) return;

    const updates: Partial<BriefData> = {};
    
    if (copyType === 'details' || copyType === 'both') {
      updates.details = fromBrief.details;
      updates.additionalNotes = fromBrief.additionalNotes ?? undefined;
    }
    
    if (copyType === 'dimensions' || copyType === 'both') {
      updates.dimensions = fromBrief.dimensions;
    }

    update(toIndex, { ...toBrief, ...updates });

    toast({
      title: 'Berhasil disalin',
      description: `${copyType === 'both' ? 'Detail dan dimensi' : copyType === 'details' ? 'Detail' : 'Dimensi'} berhasil disalin`,
    });
  };

  const onSubmit = async (data: BriefFormData): Promise<void> => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Save to sessionStorage for checkout
      sessionStorage.setItem('briefData', JSON.stringify(data.briefs));
      
      // Clear cart
      sessionStorage.removeItem('cart');
      
      toast({
        title: 'Brief berhasil disimpan',
        description: 'Anda akan diarahkan ke halaman checkout',
      });

      // Redirect to checkout
      setTimeout(() => {
        window.location.href = '/checkout/summary';
      }, 1000);
      
    } catch (error) {
      console.error('Error submitting brief:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menyimpan brief. Silakan coba lagi.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">🛒</div>
            <CardTitle>Keranjang Kosong</CardTitle>
            <CardDescription>
              Anda belum memiliki produk di keranjang. Silakan pilih produk terlebih dahulu.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.href = '/products'}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Lihat Produk
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const groupedBriefs = groupBriefsByTier();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Form Brief Design
            </h1>
            <p className="text-gray-600">
              Lengkapi detail untuk setiap design yang Anda pesan
            </p>
          </div>

          {/* Summary Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Ringkasan Pesanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {groupedBriefs.map((group) => (
                  <div key={group.tier} className="text-center p-4 bg-gray-50 rounded-lg">
                    <Badge variant="outline" className="mb-2">
                      {getTierLabel(group.tier)}
                    </Badge>
                    <div className="text-sm text-gray-600">
                      {group.items.length} design
                    </div>
                    <div className="font-semibold text-blue-600">
                      {formatPrice(group.totalPrice)}
                    </div>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between items-center mt-4">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatPrice(getTotalPrice())}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Brief Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <Accordion type="multiple" className="space-y-4">
              {groupedBriefs.map((group) => (
                <AccordionItem key={group.tier} value={group.tier}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        {getTierLabel(group.tier)}
                      </Badge>
                      <span>{group.items.length} Design</span>
                      <span className="text-blue-600 font-semibold">
                        {formatPrice(group.totalPrice)}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6 pt-4">
                      {fields
                        .map((field, index) => ({ field, index }))
                        .filter(({ field }) => field.tier === group.tier)
                        .map(({ field, index }) => (
                          <Card key={field.id}>
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-lg">
                                    {field.productName}
                                  </CardTitle>
                                  <CardDescription>
                                    {getTierLabel(field.tier)} - {formatPrice(field.price)} x {field.quantity}
                                  </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                  {/* Copy buttons for same tier */}
                                  {fields.filter(f => f.tier === group.tier).length > 1 && (
                                    <div className="flex gap-1">
                                      {fields
                                        .map((f, i) => ({ f, i }))
                                        .filter(({ f }) => f.tier === group.tier && f.id !== field.id)
                                        .map(({ i: sourceIndex }) => (
                                          <Button
                                            key={sourceIndex}
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyBriefDetails(sourceIndex, index, 'both')}
                                            title={`Salin dari design ${sourceIndex + 1}`}
                                          >
                                            <Copy className="h-3 w-3" />
                                          </Button>
                                        ))}
                                    </div>
                                  )}
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => remove(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div>
                                <Label htmlFor={`briefs.${index}.details`}>
                                  Detail Design <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                  id={`briefs.${index}.details`}
                                  placeholder="Jelaskan detail design yang Anda inginkan..."
                                  {...control.register(`briefs.${index}.details`)}
                                  className="mt-1"
                                />
                                {errors.briefs?.[index]?.details !== undefined && (
                                  <p className="text-red-500 text-sm mt-1">
                                    {errors.briefs[index]?.details?.message ?? ''}
                                  </p>
                                )}
                              </div>

                              <div>
                                <Label htmlFor={`briefs.${index}.dimensions`}>
                                  Dimensi/Ukuran <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id={`briefs.${index}.dimensions`}
                                  placeholder="Contoh: 1080x1080px, A4, 21x29.7cm"
                                  {...control.register(`briefs.${index}.dimensions`)}
                                  className="mt-1"
                                />
                                {errors.briefs?.[index]?.dimensions !== undefined && (
                                  <p className="text-red-500 text-sm mt-1">
                                    {errors.briefs[index]?.dimensions?.message ?? ''}
                                  </p>
                                )}
                              </div>

                              <div>
                                <Label htmlFor={`briefs.${index}.additionalNotes`}>
                                  Catatan Tambahan
                                </Label>
                                <Textarea
                                  id={`briefs.${index}.additionalNotes`}
                                  placeholder="Catatan tambahan, referensi, atau permintaan khusus..."
                                  {...control.register(`briefs.${index}.additionalNotes`)}
                                  className="mt-1"
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                      {/* Add Design Button */}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addDesignToBrief(group.tier)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Design {getTierLabel(group.tier)}
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Submit Button */}
            <div className="mt-8 text-center">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || fields.length === 0}
                className="min-w-48"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Lanjut ke Checkout
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
