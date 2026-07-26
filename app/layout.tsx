import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { AuthProvider } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ProductPen AI | AI Product Description Generator',
  description:
    'Generate high-converting e-commerce product titles, descriptions, and SEO tags instantly using OpenAI & Gemini models.',
  keywords: ['ProductPen AI', 'AI Product Description', 'Ecommerce Copywriting', 'SEO Generator', 'Product Marketing'],
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.png',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100 antialiased min-h-screen flex flex-col`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-gray-800/60 bg-gray-950 py-8 text-center text-sm text-gray-500">
            <div className="mx-auto max-w-7xl px-4">
              <p>© {new Date().getFullYear()} ProductPen AI. All rights reserved.</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
