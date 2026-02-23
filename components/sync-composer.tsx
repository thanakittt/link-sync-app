"use client";

import { useState, useEffect } from "react";
import { Send, ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMessages } from "@/components/messages-provider";

/**
 * ส่วนประกอบโต้ตอบหลัก (Composer) สำหรับการพิมพ์และส่งข้อความ/ลิงก์
 *
 * ความสามารถ:
 * - อ่านข้อมูลจาก Clipboard ทันที หากพบข้อความจะแสดงผลปุ่ม "Paste" อัตโนมัติเพื่มความรวดเร็ว
 * - กด Enter หรือคลิกปุ่ม Send เผื่อส่งลิงก์เข้าสู่ฐานข้อมูล
 * - ป้องกัน Memory leaks จาก Clipboard listeners
 *
 * @returns {JSX.Element} กล่องคอมโพสเซอร์สำหรับพิมพ์ข้อความ
 */
export function SyncComposer() {
  const { state, actions } = useMessages();
  const [inputValue, setInputValue] = useState("");
  const [showPasteButton, setShowPasteButton] = useState(false);

  // ฟังก์ชัน Effects ฝังตัว เช็คว่าใน Clipboard มีข้อความอยู่หรือไม่ เพื่อตัดสินใจแสดงผลปุ่มลัด Paste ให้กดวางได้รวดเร็ว
  useEffect(() => {
    // isMounted flag ใช้ป้องกันปัญหา State Updates แทร่งซ้อน (Memory Leak) หลังหน้าโหลดหน้าป๊อปอัพ Component ถูกถอดออก
    let isMounted = true;

    const checkClipboard = async () => {
      try {
        // Fallback: กรณีเบราว์เซอร์ไม่รองรับ Clipboard API สมัยใหม่ ก็ให้ตีเนียนแสดงปุ่ม Paste ไปเลย
        if (!navigator.clipboard || !navigator.clipboard.readText) {
          if (isMounted) setShowPasteButton(true);
          return;
        }

        // ตรวจสอบสิทธิ์ (Permission) การเข้าถึง Clipboard แบบไม่ต้องเด้ง Popup ถามผู้ใช้ก่อน
        // ท่านี้ช่วยลดความรำคาญของผู้ใช้ได้
        try {
          const permission = await navigator.permissions.query({
            name: "clipboard-read" as PermissionName,
          });
          // ถ้าผู้ใช้เคยปฏิเสธการเข้าถึง ให้แสดงปุ่ม Paste ไว้ให้กดเอง (Fallback)
          if (permission.state === "denied") {
            if (isMounted) setShowPasteButton(true);
            return;
          }
        } catch (e) {
          // เบราว์เซอร์บางตัว (เช่น Safari หรือ Firefox บางเวอร์ชัน) อาจจะไม่รองรับการ query สิทธิ์ clipboard-read
          // เราก็จะปล่อยผ่านเงื่อนไขนี้ไป (Ignore)
        }

        // อ่านข้อความจาก Clipboard
        const text = await navigator.clipboard.readText();
        // ถ้ามีข้อความ (ไม่เป็นค่าว่าง) ให้แสดงปุ่ม Paste
        if (isMounted) setShowPasteButton(text.trim().length > 0);
      } catch (error) {
        // Fallback: ถ้าเบราว์เซอร์บล็อกการอ่านอัตโนมัติ หรือติดปัญหาเรื่อง Permission
        // ให้แสดงปุ่ม Paste ไว้ก่อน เพื่อผู้ใช้จะได้กดและอนุญาตสิทธิ์ในภายหลังได้
        if (isMounted) setShowPasteButton(true);
      }
    };

    // จะเข้าไปเช็คเนื้อหา Clipboard ก็ต่อเมื่อช่อง Input ว่างเปล่าเท่านั้น
    if (!inputValue) {
      checkClipboard();
      // ดัก Event 'focus' (เช่น ตอนสลับหน้าต่างกลับมาที่เว็บ) เพื่อเช็ค Clipboard อัปเดตล่าสุด
      window.addEventListener("focus", checkClipboard);

      // Cleanup function ทำงานเมื่อ inputValue เปลี่ยนค่า หรือ Component ถูกทำลาย
      return () => {
        isMounted = false;
        window.removeEventListener("focus", checkClipboard);
      };
    } else {
      // ถ้าเริ่มพิมพ์ข้อความแล้ว ให้ซ่อนปุ่ม Paste
      setShowPasteButton(false);
      return () => {
        isMounted = false;
      };
    }
  }, [inputValue]);

  // ฟังก์ชันนี้ทำงานเมื่อกดปุ่ม Submit ฟอร์ม (ตอนกด Enter หรือกดปุ่มส่งข้อความ)
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // ป้องกันไม่ให้เบราว์เซอร์รีเฟรชหน้าเว็บ

    // ถ้าพิมพ์แต่เว้นวรรค หรือ กำลังโหลดข้อมูลอยู่ ให้หยุดการทำงาน
    if (!inputValue.trim() || state.isLoading) return;

    await actions.submit(inputValue); // ส่งข้อความไปที่ Backend / Realtime Channel

    // ล้างช่อง input หลังจากส่งเสร็จ การแสดงผลจะเป็นหน้าที่ของ Realtime Subscription
    setInputValue("");
  };

  // ฟังก์ชันนี้ทำงานเมื่อผู้ใช้คลิกปุ่ม Paste
  const handlePaste = async () => {
    try {
      // ดึงข้อความจาก Clipboard
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputValue(text); // นำข้อความที่ได้มาใส่ในช่อง Input
      }
    } catch (error) {
      // ถ้าเกิดดึงข้อมูลไม่ได้ (เช่น เบราว์เซอร์บล็อกเด็ดขาด)
      console.error("Failed to read clipboard contents: ", error);
      // ในกรณีนี้ผู้ใช้ต้องกด Ctrl+V วางข้อความด้วยตัวเอง
    }
  };

  return (
    <div className="mb-6 shrink-0">
      <form
        onSubmit={onSubmit}
        className="flex items-end gap-2 bg-white dark:bg-zinc-900 p-2 rounded-2xl border shadow-lg shadow-zinc-200/50 dark:shadow-black/50 ring-1 ring-zinc-900/5 transition-all focus-within:ring-2 focus-within:ring-zinc-900/20 dark:focus-within:ring-zinc-100/20"
      >
        <Input
          name="message"
          placeholder="Paste a link or type a message…"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0 flex-1 h-12 text-base bg-transparent p-3"
          disabled={state.isLoading}
          autoComplete="off"
        />
        {!inputValue.trim() && showPasteButton && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handlePaste}
            disabled={state.isLoading}
            className="h-12 w-12 rounded-xl shrink-0 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            title="Paste from clipboard"
          >
            <ClipboardPaste className="h-5 w-5" />
          </Button>
        )}
        <Button
          type="submit"
          disabled={!inputValue.trim() || state.isLoading}
          className="h-12 w-12 rounded-xl shrink-0"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
