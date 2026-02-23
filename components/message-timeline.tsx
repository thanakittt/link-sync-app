"use client";

import { Loader2 } from "lucide-react";
import { SyncCard } from "@/components/sync-card";
import { useMessages } from "@/components/messages-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon } from "lucide-react";

/**
 * คอมโพเนนต์สำหรับแสดงผลรายการข้อความและลิงก์ทั้งหมด
 *
 * ทำหน้าที่:
 * - ดึง state การโหลด (isLoading/isFetchingInitial) มาแสดง Skeleton Loading
 * - นำ state.messages (ข้อความทั้งหมด) มาจัดการแสดงผลผ่านคอมโพเนนต์ SyncCard
 * - ควบคุมปุ่ม Load More และแสดงผลเมื่อกำลัง FetcingMore (กำลังดึงข้อมูลหน้าถัดไป)
 *
 * @returns {JSX.Element} ส่วนแสดงผลรายการไทม์ไลน์
 */
export function MessageTimeline() {
  const { state, actions } = useMessages();

  // เงื่อนไข: ถ้ายังคงโหลดข้อมูลครั้งแรกอยู่ (ไม่มีข้อความเก่าให้ดู) โชว์ Skeleton placeholder
  if (state.isFetchingInitial) {
    return (
      <div className="flex-1 overflow-y-auto space-y-4 pb-6 px-1 -mx-1 hide-scrollbar">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-2 mt-1">
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
                <div className="flex gap-2 shrink-0">
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // เงื่อนไข: ถ้าดึงข้อมูลเสร็จแล้วแต่ array ของข้อความยังว่างเปล่า (พึ่งสมัครใหม่ หรือลบข้อมูลหมด) ให้แสดงข้อความต้อนรับ
  if (state.messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto space-y-4 pb-6 px-1 -mx-1 hide-scrollbar flex flex-col items-center justify-center text-zinc-400 gap-3 pt-10">
        <LinkIcon className="h-12 w-12 opacity-20" />
        <p>No history yet. Send something!</p>
      </div>
    );
  }

  // การเรนเดอร์หลัก: วนลูป (map) นำข้อความใน state.messages มาใส่ใน SyncCard ทีละใบ
  return (
    <div className="flex-1 overflow-y-auto space-y-4 pb-6 px-1 -mx-1 hide-scrollbar">
      {state.messages.map((msg) => (
        <SyncCard key={msg.id} message={msg} />
      ))}

      {/* 
        ส่วนควบคุม Pagination: 
        ถ้ากำลังโหลดข้อมูลเดิมมาต่อท้าย ให้โชว์ Skeleton ตรงกลาง 
        แต่ถ้าถ้ายังมีข้อมูลใน DB อีก (hasMore เป็นจริง) ให้โชว์ปุ่ม Load More
      */}
      {state.isFetchingMore ? (
        <div className="flex justify-center pt-2 pb-6">
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      ) : state.hasMore ? (
        <div className="flex justify-center pt-2 pb-6">
          <Button variant="outline" size="sm" onClick={actions.loadMore}>
            Load More
          </Button>
        </div>
      ) : null}
    </div>
  );
}
