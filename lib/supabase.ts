import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./database.types";

/**
 * สร้างอินสแตนซ์ของ Supabase Client สำหรับฝั่งไคลเอนต์ (Client Components - React)
 * สามารถเรียกใช้โดยตรงได้ ไม่ต้องพึ่ง `cookies()` แบบฝั่ง Server
 *
 * @returns {SupabaseClient} อินสแตนซ์หลัก
 */
export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
};

// นำออก (Export) ตัวแปร Singleton สามารถดึงไปใช้ได้ทันทีสำหรับ Client Component ทั่วไป
export const supabase = createClient();

/**
 * โครงสร้างข้อมูล (Interface) อิงตามตาราง `messages` จาก Database Type
 */
export type Message = {
  id: string;
  content: string;
  type: "text" | "url";
  created_at: string;
  user_id?: string;
};
