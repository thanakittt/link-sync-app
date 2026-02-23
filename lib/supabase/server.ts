import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "../database.types";

/**
 * สร้างอินสแตนซ์ของ Supabase Client สำหรับฝั่งเซิร์ฟเวอร์ (Server Components, Server Actions และ Route Handlers)
 *
 * กลไกทำทำงาน:
 * ใช้ Next.js `cookies()` ในการเข้าไปอ่านและเขียน Auth token ลงเบราว์เซอร์อย่างปลอดภัย
 *
 * @returns {Promise<SupabaseClient>} Supabase client พร้อม Auth Session ปัจจุบัน
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // คำสั่ง `setAll` จะถูกเรียกจากฝั่ง Server Component หรือ Route Handler
            // สามารถเพิกเฉยหรือปล่อยผ่าน Error ผ่านได้ หากเรามี Middleware คอยช่วยทำ Refresh Session ให้อยู่แล้ว
          }
        },
      },
    },
  );
}
