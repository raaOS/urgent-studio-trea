
import { Suspense } from 'react';

import CheckoutClientPage from '@/components/CheckoutClientPage';

// Define the type for searchParams directly in the page component.
// This is the standard and safest way for Next.js 14 App Router.
interface CheckoutSummaryPageProps {
  searchParams?: Promise<{
    orderIds?: string;
  }>;
}

export default async function CheckoutSummaryPage({ searchParams }: CheckoutSummaryPageProps): Promise<JSX.Element> {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({ orderIds: undefined }));
  const orderIdsParam = resolvedSearchParams?.orderIds ?? '';

  if (!orderIdsParam || orderIdsParam === '') {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold text-destructive">ID Pesanan Tidak Ditemukan.</h1>
          <p className="text-muted-foreground mt-2">
            URL checkout Anda tidak lengkap. Silakan kembali ke beranda dan coba lagi.
          </p>
        </div>
      </div>
    );
  }

  const orderIds = orderIdsParam.split(',');

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center">
          Memuat Checkout...
        </div>
      }
    >
      <CheckoutClientPage orderIds={orderIds} />
    </Suspense>
  );
}
