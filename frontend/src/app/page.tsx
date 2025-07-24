'use client';

import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: string;
  features: string[];
  isPopular: boolean;
}

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar?: string;
}

interface WorkStep {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'kaki-lima',
    name: 'Budget Kaki Lima',
    description: 'Cocok untuk usaha kecil dan personal',
    price: 'Mulai 15rb',
    features: [
      'Desain sederhana namun menarik',
      'Format digital (PNG/JPG)',
      'Revisi 1x',
      'Pengerjaan 1-2 hari'
    ],
    isPopular: false
  },
  {
    id: 'umkm',
    name: 'Budget UMKM',
    description: 'Ideal untuk usaha menengah',
    price: 'Mulai 25rb',
    features: [
      'Desain profesional',
      'Format digital + print ready',
      'Revisi 2x',
      'Pengerjaan 1-2 hari',
      'Konsultasi gratis'
    ],
    isPopular: true
  },
  {
    id: 'ecommerce',
    name: 'Budget E-commerce',
    description: 'Premium untuk bisnis besar',
    price: 'Mulai 70rb',
    features: [
      'Desain premium & eksklusif',
      'Multiple format & ukuran',
      'Revisi unlimited',
      'Pengerjaan prioritas',
      'Konsultasi mendalam',
      'After-sales support'
    ],
    isPopular: false
  }
];

const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Wijaya',
    role: 'Owner Toko Online',
    content: 'Desainnya bagus banget dan harganya terjangkau. Tim Urgent Studio sangat responsif!',
    rating: 5
  },
  {
    id: '2',
    name: 'Ahmad Rizki',
    role: 'Pengusaha UMKM',
    content: 'Hasil desain melampaui ekspektasi. Proses revisi juga mudah dan cepat.',
    rating: 5
  },
  {
    id: '3',
    name: 'Maya Sari',
    role: 'Content Creator',
    content: 'Pelayanan 24/7 sangat membantu. Desain selalu selesai tepat waktu.',
    rating: 5
  }
];

const WORK_STEPS: WorkStep[] = [
  {
    id: '1',
    title: 'Pilih Paket',
    description: 'Pilih paket desain sesuai budget dan kebutuhan Anda',
    icon: '📋'
  },
  {
    id: '2',
    title: 'Isi Brief',
    description: 'Berikan detail kebutuhan desain Anda dengan lengkap',
    icon: '✏️'
  },
  {
    id: '3',
    title: 'Bayar & Tunggu',
    description: 'Lakukan pembayaran dan tunggu desain selesai',
    icon: '💳'
  },
  {
    id: '4',
    title: 'Terima Hasil',
    description: 'Dapatkan file desain berkualitas tinggi',
    icon: '🎨'
  }
];

export default function HomePage(): JSX.Element {
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [orderIdInput, setOrderIdInput] = useState<string>('');
  const { toast } = useToast();

  useEffect((): (() => void) => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Element;
      if (!target.closest('.tier-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return (): void => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleTierSelect = (tierId: string): void => {
    setSelectedTier(tierId);
    setIsDropdownOpen(false);
  };

  const handleTrackOrder = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    
    if (!orderIdInput.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Silakan masukkan kode pesanan Anda.',
      });
      return;
    }

    // Redirect to track page with order ID
    window.location.href = `/track?orderId=${encodeURIComponent(orderIdInput.trim())}`;
  };

  const renderStars = (rating: number): JSX.Element[] => {
    return Array.from({ length: 5 }, (_, index) => (
      <span key={index} className={index < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ));
  };

  const selectedTierData = PRICING_TIERS.find((tier) => tier.id === selectedTier);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            Jasa Desain Grafis Cepat & Terjangkau
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto">
            Dapatkan desain profesional untuk bisnis Anda dalam 24 jam. 
            Mulai dari Rp 15.000 dengan kualitas terjamin!
          </p>
          
          {/* Tier Selection Dropdown */}
          <div className="mb-6 sm:mb-8">
            <div className="tier-dropdown relative inline-block">
              <button
                type="button"
                onClick={(): void => setIsDropdownOpen(!isDropdownOpen)}
                className="bg-white border-2 border-black rounded-md px-4 py-3 text-left min-w-[280px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 flex items-center justify-between"
              >
                <span className="font-medium">
                  {selectedTierData ? selectedTierData.name : 'Pilih Budget Anda'}
                </span>
                {isDropdownOpen ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
              
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-black rounded-md shadow-lg z-10">
                  {PRICING_TIERS.map((tier) => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={(): void => handleTierSelect(tier.id)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 first:rounded-t-md last:rounded-b-md border-b border-gray-200 last:border-b-0"
                    >
                      <div className="font-medium">{tier.name}</div>
                      <div className="text-sm text-gray-600">{tier.price}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {selectedTierData && (
              <div className="mt-4 p-4 bg-white border-2 border-black rounded-md max-w-md mx-auto">
                <h3 className="font-bold text-lg mb-2">{selectedTierData.name}</h3>
                <p className="text-gray-600 mb-3">{selectedTierData.description}</p>
                <p className="text-orange-600 font-bold text-xl mb-3">{selectedTierData.price}</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  {selectedTierData.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/products">
              <Button
                size="lg"
                className="w-full sm:w-auto py-3 px-6 bg-gradient-to-r from-[#ff7a2f] to-[#ff5f00] text-white font-bold text-sm sm:text-base md:text-lg rounded-md border-2 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 hover:brightness-105"
              >
                Pesan Sesuai Budget
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Order Tracking Section */}
      <div className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-6">Lacak Pesanan Anda</h2>
            <form onSubmit={handleTrackOrder} className="space-y-4">
              <div>
                <Input
                  value={orderIdInput}
                  onChange={(e): void => setOrderIdInput(e.target.value)}
                  name="orderIdInput"
                  type="text"
                  placeholder="Masukkan kode pesanan lengkap Anda..."
                  className="w-full border-2 border-black rounded-md p-2 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none"
                  required
                />
              </div>
              <Button 
                type="submit"
                className="w-full bg-gradient-to-r from-[#ff7a2f] to-[#ff5f00] text-white border-2 border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <Search className="mr-2 h-4 w-4" />
                Lacak Pesanan
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-8">Testimoni Klien</h2>
          
          <div className="hidden md:block">
            <Carousel className="max-w-4xl mx-auto">
              <CarouselContent>
                {TESTIMONIALS.map((testimonial) => (
                  <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/3">
                    <Card className="border-2 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 font-bold">
                              {testimonial.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <CardTitle className="text-sm">{testimonial.name}</CardTitle>
                            <CardDescription className="text-xs">{testimonial.role}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex mb-2">
                          {renderStars(testimonial.rating)}
                        </div>
                        <p className="text-sm text-gray-600">{testimonial.content}</p>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center mt-4 space-x-2">
                <CarouselPrevious className="static translate-y-0 mr-2" />
                <CarouselNext className="static translate-y-0 ml-2" />
              </div>
            </Carousel>
          </div>
          
          {/* Mobile Grid */}
          <div className="md:hidden grid gap-4">
            {TESTIMONIALS.map((testimonial) => (
              <Card key={testimonial.id} className="border-2 border-black">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-bold">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-sm">{testimonial.name}</CardTitle>
                      <CardDescription className="text-xs">{testimonial.role}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex mb-2">
                    {renderStars(testimonial.rating)}
                  </div>
                  <p className="text-sm text-gray-600">{testimonial.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-8">Cara Kerja</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {WORK_STEPS.map((step, index) => (
              <div key={step.id} className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black">
                  <span className="text-2xl">{step.icon}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">
                  {index + 1}. {step.title}
                </h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-12 bg-gradient-to-r from-[#ff7a2f] to-[#ff5f00] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4">
            Siap Membuat Desain Impian Anda?
          </h2>
          <p className="text-base sm:text-lg mb-6 opacity-90">
            Bergabung dengan ribuan klien yang puas dengan layanan kami
          </p>
          <Link href="/products">
            <Button
              size="lg"
              className="bg-white text-orange-600 hover:bg-gray-100 border-2 border-black font-bold py-3 px-6 rounded-md hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
            >
              Mulai Pesan Sekarang
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}