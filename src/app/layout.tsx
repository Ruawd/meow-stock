import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "虚拟市场交易",
  description: "A股实时模拟交易平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased selection:bg-red-500/30")}>
        <Navbar />
        <main className="pt-20 min-h-screen bg-background text-foreground">
          {children}
        </main>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
