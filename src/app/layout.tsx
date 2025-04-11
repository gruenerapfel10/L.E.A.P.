import { usePathname } from 'next/navigation';
import { Inter } from "next/font/google";
import "./globals.css";
import "allotment/dist/style.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from 'sonner';
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // const pathname = usePathname(); // CANNOT use client hooks here directly
  // const showNavbar = !pathname.startsWith('/dashboard') && !pathname.startsWith('/login') && !pathname.startsWith('/signup');

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {/* Providers component will now handle client-side logic like pathname checks */}
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
} 