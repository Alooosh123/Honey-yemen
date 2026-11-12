import BarcodeVerifierView from '@/components/BarcodeVerifierView';

interface VerifyPageProps {
  searchParams?: {
    code?: string;
  };
}

export default function VerifyPage({ searchParams }: VerifyPageProps) {
  const code = typeof searchParams?.code === 'string' ? searchParams.code : '';

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="max-w-6xl mx-auto mb-6 text-center">
        <a href="/" className="text-amber-300 hover:text-amber-200 text-sm">العودة إلى الصفحة الرئيسية</a>
      </div>
      <BarcodeVerifierView initialBarcode={code} />
    </main>
  );
}
