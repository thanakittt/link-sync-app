"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { MessagesProvider, useMessages } from "@/components/messages-provider";
import { AppHeader } from "@/components/app-header";
import { SyncComposer } from "@/components/sync-composer";
import { MessageTimeline } from "@/components/message-timeline";

/**
 * คอมโพเนนต์หลักที่แสดงเนื้อหาภายในแอปพลิเคชัน
 *
 * หน้าที่:
 * 1. ตรวจสอบสถานะการโหลดข้อมูลผู้ใช้จาก `MessagesProvider`
 * 2. แสดง UI หน้าโหลด (Loading Spinner) หากข้อมูลกำลังถูกดึง
 * 3. เมื่อพร้อม จะจัดเรียงและแสดงผลส่วนหัว (Header), ช่องกรอกข้อความ (Composer) และไทม์ไลน์ข้อความ (Timeline)
 *
 * @returns {JSX.Element} UI ของแอปพลิเคชัน
 */
function AppContent() {
  const { state } = useMessages();

  // ป้องกันการแทรกแซงหรือเรนเดอร์ก่อนที่ข้อมูลผู้ใช้และ provider จะถูกโหลดขึ้นมาทำงานเสร็จสมบูรณ์
  if (!state.user || !state.isInitialized) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans selection:bg-zinc-300 dark:selection:bg-zinc-700 min-h-screen flex flex-col items-center">
      <main className="w-full max-w-2xl px-4 md:px-8 flex flex-col flex-1 overflow-hidden relative">
        <AppHeader />
        <SyncComposer />
        <MessageTimeline />
      </main>
    </div>
  );
}

/**
 * หน้าแรก (Home Page) ของแอปพลิเคชัน Link Sync
 *
 * ทำหน้าที่เป็นหน้าต่างรับประทานผลหลัก (Root Entry Point) สำหรับไคลเอนต์ไซด์
 * ห่อหุ้มด้วย `Suspense` เพื่อจัดการการโหลดของ Next.js app router
 * และ `MessagesProvider` สำหรับจัดการ State หลักของแอปฯ
 *
 * @returns {JSX.Element} หน้า LinkSyncApp
 */
export default function LinkSyncApp() {
  return (
    <Suspense
      fallback={
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen flex flex-col items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      }
    >
      <MessagesProvider>
        <AppContent />
      </MessagesProvider>
    </Suspense>
  );
}
