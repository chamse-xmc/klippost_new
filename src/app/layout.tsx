import type { Metadata, Viewport } from "next";
import { Inter, Nunito } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { PageTracker } from "@/components/page-tracker";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "600", "700", "800", "900"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "klippost - Video Virality Analyzer",
  description: "AI-powered video analysis to help creators go viral",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${nunito.variable} font-sans antialiased`}>
        <Providers>
          <PageTracker />
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
