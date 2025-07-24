'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Star, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  features: string[];
  basicPrice: number;
  standardPrice: number;
  premiumPrice: number;
  rating: number;
  reviews: number;
  image: string;
  popular?: boolean;
}

interface CartItem {
  productId: string;
  productName: string;
  tier: 'basic' | 'standard' | 'premium';
  price: number;
  quantity: number;
}

type Tier = 'basic' | 'standard' | 'premium';
type SortOption = 'name' | 'price-low' | 'price-high' | 'rating' | 'popular';

const PRODUCTS: Product[] = [
  {
    id: 'logo-design',
    name: 'Logo Design',
    category: 'Branding',
    description: 'Desain logo profesional yang mencerminkan identitas brand Anda',
    features: ['3 konsep desain', 'Revisi unlimited', 'File vector (AI, EPS)', 'File raster (PNG, JPG)'],
    basicPrice: 150000,
    standardPrice: 300000,
    premiumPrice: 500000,
    rating: 4.8,
    reviews: 245,
    image: '/images/logo-design.jpg',
    popular: true
  },
  {
    id: 'business-card',
    name: 'Business Card',
    category: 'Print Design',
    description: 'Kartu nama profesional dengan desain yang menarik',
    features: ['2 sisi desain', '2 konsep pilihan', 'Print ready file', 'Gratis mockup'],
    basicPrice: 75000,
    standardPrice: 125000,
    premiumPrice: 200000,
    rating: 4.7,
    reviews: 189,
    image: '/images/business-card.jpg'
  },
  {
    id: 'flyer-design',
    name: 'Flyer Design',
    category: 'Marketing',
    description: 'Desain flyer yang eye-catching untuk promosi bisnis Anda',
    features: ['Ukuran A4/A5', '2 konsep desain', 'Print & digital ready', 'Revisi 3x'],
    basicPrice: 100000,
    standardPrice: 175000,
    premiumPrice: 275000,
    rating: 4.6,
    reviews: 156,
    image: '/images/flyer-design.jpg'
  },
  {
    id: 'social-media-kit',
    name: 'Social Media Kit',
    category: 'Digital Marketing',
    description: 'Paket lengkap template untuk semua platform social media',
    features: ['Instagram post/story', 'Facebook cover', 'Twitter header', '10+ template'],
    basicPrice: 200000,
    standardPrice: 350000,
    premiumPrice: 550000,
    rating: 4.9,
    reviews: 312,
    image: '/images/social-media-kit.jpg',
    popular: true
  },
  {
    id: 'website-banner',
    name: 'Website Banner',
    category: 'Web Design',
    description: 'Banner website yang profesional dan responsif',
    features: ['Multiple sizes', 'Web optimized', '3 konsep desain', 'Source file included'],
    basicPrice: 125000,
    standardPrice: 225000,
    premiumPrice: 375000,
    rating: 4.5,
    reviews: 98,
    image: '/images/website-banner.jpg'
  },
  {
    id: 'brochure-design',
    name: 'Brochure Design',
    category: 'Print Design',
    description: 'Brosur tri-fold atau bi-fold yang informatif dan menarik',
    features: ['Tri-fold/Bi-fold', 'Print ready', 'Unlimited revisi', 'Free consultation'],
    basicPrice: 175000,
    standardPrice: 300000,
    premiumPrice: 475000,
    rating: 4.7,
    reviews: 134,
    image: '/images/brochure-design.jpg'
  }
];

const CATEGORIES = ['Semua', 'Branding', 'Print Design', 'Marketing', 'Digital Marketing', 'Web Design'];

export default function ProductsPage(): JSX.Element {
  const [selectedTier, setSelectedTier] = useState<Tier>('standard');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const { toast } = useToast();

  useEffect((): void => {
    const savedCart = sessionStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart) as CartItem[];
        setCart(parsedCart);
      } catch (error) {
        console.error('Error parsing cart from sessionStorage:', error);
        sessionStorage.removeItem('cart');
      }
    }
  }, []);

  useEffect((): void => {
    sessionStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const addToCart = (product: Product): void => {
    const price = product[`${selectedTier}Price` as keyof Product] as number;
    const existingItem = cart.find(
      (item) => item.productId === product.id && item.tier === selectedTier
    );

    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === product.id && item.tier === selectedTier
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        tier: selectedTier,
        price,
        quantity: 1,
      };
      setCart([...cart, newItem]);
    }

    toast({
      title: 'Produk ditambahkan ke keranjang',
      description: `${product.name} (${getTierLabel(selectedTier)}) berhasil ditambahkan`,
    });
  };

  const orderNow = (product: Product): void => {
    addToCart(product);
    // Redirect to checkout
    window.location.href = '/brief';
  };

  const getSortedProducts = (): Product[] => {
    let filtered = selectedCategory === 'Semua' 
      ? PRODUCTS 
      : PRODUCTS.filter(product => product.category === selectedCategory);

    switch (sortBy) {
      case 'name':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case 'price-low':
        return filtered.sort((a, b) => {
          const priceA = a[`${selectedTier}Price` as keyof Product] as number;
          const priceB = b[`${selectedTier}Price` as keyof Product] as number;
          return priceA - priceB;
        });
      case 'price-high':
        return filtered.sort((a, b) => {
          const priceA = a[`${selectedTier}Price` as keyof Product] as number;
          const priceB = b[`${selectedTier}Price` as keyof Product] as number;
          return priceB - priceA;
        });
      case 'rating':
        return filtered.sort((a, b) => b.rating - a.rating);
      case 'popular':
        return filtered.sort((a, b) => {
          if (a.popular && !b.popular) return -1;
          if (!a.popular && b.popular) return 1;
          return b.reviews - a.reviews;
        });
      default:
        return filtered;
    }
  };

  const getTierLabel = (tier: Tier): string => {
    const labels: Record<Tier, string> = {
      basic: 'Basic',
      standard: 'Standard',
      premium: 'Premium'
    };
    return labels[tier];
  };

  const getCartItemCount = (): number => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const sortedProducts = getSortedProducts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Katalog Produk Design
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Pilih dari berbagai layanan design profesional yang sesuai dengan kebutuhan bisnis Anda
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Tier Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Paket:</span>
              <Select value={selectedTier} onValueChange={(value: string) => setSelectedTier(value as Tier)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Urutkan:</span>
              <Select value={sortBy} onValueChange={(value: string) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Populer</SelectItem>
                  <SelectItem value="name">Nama A-Z</SelectItem>
                  <SelectItem value="price-low">Harga Terendah</SelectItem>
                  <SelectItem value="price-high">Harga Tertinggi</SelectItem>
                  <SelectItem value="rating">Rating Tertinggi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cart Button */}
          <Button 
            variant="outline" 
            className="relative"
            onClick={() => window.location.href = '/brief'}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Keranjang
            {getCartItemCount() > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {getCartItemCount()}
              </Badge>
            )}
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProducts.map((product) => {
            const currentPrice = product[`${selectedTier}Price` as keyof Product] as number;
            
            return (
              <Card key={product.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                {product.popular && (
                  <Badge className="absolute top-4 right-4 z-10 bg-orange-500">
                    Populer
                  </Badge>
                )}
                
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <div className="text-6xl opacity-20">🎨</div>
                </div>

                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription className="text-sm text-gray-500">
                        {product.category}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{product.rating}</span>
                      <span className="text-xs text-gray-500">({product.reviews})</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{product.description}</p>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Fitur {getTierLabel(selectedTier)}:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatPrice(currentPrice)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Paket {getTierLabel(selectedTier)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => addToCart(product)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Keranjang
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => orderNow(product)}
                    >
                      Pesan Sekarang
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {sortedProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Tidak ada produk ditemukan
            </h3>
            <p className="text-gray-600">
              Coba ubah filter atau kategori untuk melihat produk lainnya
            </p>
          </div>
        )}
      </div>
    </div>
  );
}