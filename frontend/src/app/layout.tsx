import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'منظومة قياس وتوثيق جودة العسل اليمني v3.0 | Honey Quality Assessment & Marketplace',
  description: 'المنظومة المخبرية الصناعية الذكية لفحص وتوثيق جودة العسل اليمني بنسبة دقة 100%، سوق العسل الموثق بالباركود والبحث بالفوائد العلاجية، ومنصة SaaS المركزية.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased selection:bg-amber-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
