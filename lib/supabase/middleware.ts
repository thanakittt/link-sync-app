import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * ฟังก์ชันสำหรับจัดการ Session ของผู้ใช้ในระดับ Middleware (ทำงานก่อนเข้าถึง Route)
 *
 * หน้าที่หลัก:
 * 1. ตีความและรีเฟรชอัปเดต Cookies ของ Supabase Auth ป้องกันสิทธิ์การล็อกอินหมดอายุแบบเงียบๆ
 * 2. ป้องกันการเข้าถึงหน้าเว็บ (Route Protection) โดยถ้าไม่ได้ล็อกอิน จะทำการ Redirect โยนกลับไปหน้า `/login` ทันที
 *
 * @param {NextRequest} request ข้อมูล Request ที่ส่งเข้ามา
 * @returns {Promise<NextResponse>} Response หลังจากปรับแต่ง Cookie และ Redirect แล้ว
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // สำคัญมาก: ห้ามเขียนโค้ดเพิ่มเติมหรือ logic แทรกกลาง ระหว่าง `createServerClient`
  // และ `supabase.auth.getUser()` เด็ดขาด เนื่องจากผู้ใช้อาจเด้งหลุดจากระบบ (logout) แบบงงๆ ได้
  // ดูเอกสารเพิ่มเติมได้ที่เว็บหลักของ Supabase SSR

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
