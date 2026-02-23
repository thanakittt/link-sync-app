import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

/**
 * ข้อมูล Meta พื้นฐานสำหรับแอปพลิเคชันจะถูกนำไปเป็น <head> tag
 */
export const metadata: Metadata = {
  title: "Link Sync",
  description: "Send text and links across devices seamlessly.",
};

/**
 * Root Layout (Server Component)
 *
 * หน้าที่หลัก:
 * 1. กำหนดโครงสร้าง HTML โครงสร้างหลัก (html, body) ของการเรนเดอร์ทั้งหมด
 * 2. นำเข้าฟอนต์ของ Geist (Sans และ Mono) เพื่อใช้กับ TailwindCSS
 * 3. ห่อหุ้มด้วย `ThemeProvider` เพื่อเปิดใช้งานโหมดสลับสีสว่าง/มืด (Dark/Light mode)
 * 4. ฝังไลบรารี Toaster นอกเหนือจาก Component หลัก ไว้สำหรับเด้งข้อความแจ้งเตือนต่างๆ ให้กับผู้ใช้แบบ Global
 *
 * @param {children} Props React children node ที่ส่งมาจากเพจในโฟลเดอร์เดียวกันหรือซ้อนอยู่
 * @returns {JSX.Element} โครงสร้าง HTML หลักของแอปพลิเคชัน
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning ช่วยปิดการแจ้งเตือนกรณี Theme ของ Server และ Client ไม่ตรงกันช่วงตอนโหลดครั้งแรก (Hydration)
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
