import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/app/providers";
import { AppHeader } from "@/components/navigation/app-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Chess Arena — Free Online Chess",
    template: "%s · Chess Arena",
  },
  description:
    "Play chess online for free. Blitz, rapid or classical, against friends, the bot or the world.",
  keywords: ["chess", "online chess", "blitz", "rapid", "free chess"],
  openGraph: {
    title: "Chess Arena — Free Online Chess",
    description: "Play chess online for free. Blitz, rapid or classical, against friends, the bot or the world.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}>
        <Providers>
          <AppHeader />
          <div className="flex flex-1 flex-col">{children}</div>
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  );
}