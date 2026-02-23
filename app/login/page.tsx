"use client";

import { useState, useEffect, Suspense, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link as LinkIcon, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ModeToggle } from "@/components/mode-toggle";

/**
 * โครงร่าง (Layout) สำหรับหน้า Authentication (ทั้งในส่วนของการ SignIn และ SignUp)
 *
 * ใช้เป็นคอมโพเนนต์ห่อหุ้มฟอร์มเพื่อให้มีหน้าตา (UI) หรือสไตล์ที่เป็นไปในทิศทางเดียวกัน
 * รวมถึงมีปุ่มสำหรับสลับโหมดมืด (ModeToggle) และรูปแบบต่างๆ (Theme) ที่ได้เซ็ตไว้
 *
 * @param {React.ReactNode} children เนื้อหาในส่วนของฟอร์ม (ฟอร์มเข้าสู่ระบบ หรือ แบบฟอร์มสมัครสมาชิก)
 * @param {string} subtitle คำอธิบายย่อยที่จะแสดงอยู่ข้างใต้ชื่อแอปฯ Link Sync ของหน้า Auth
 * @returns {JSX.Element}
 */
function AuthLayout({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle: string;
}) {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans selection:bg-zinc-300 dark:selection:bg-zinc-700 min-h-screen flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <main className="w-full max-w-sm flex flex-col gap-6">
        <header className="flex flex-col items-center gap-2 text-center">
          <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 p-3 rounded-2xl mb-2 shadow-lg shadow-zinc-200/50 dark:shadow-black/50">
            <LinkIcon className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Link Sync</h1>
          <p className="text-zinc-500 text-sm">{subtitle}</p>
        </header>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border shadow-xl shadow-zinc-200/50 dark:shadow-black/50 ring-1 ring-zinc-900/5">
          {children}
        </div>
      </main>
    </div>
  );
}

/**
 * คอมโพเนนต์แบบฟอร์มเข้าสู่ระบบ (Sign In)
 *
 * หน้าที่:
 * - รวบรวมข้อมูล Email และ Password
 * - สื่อสารและ Request สิทธิ์กับ Supabase (supabase.auth.signInWithPassword)
 * - เปลี่ยนหน้า (Router Push) หากทำรายการสำเร็จ
 *
 * @param {() => void} onSwitchToSignUp Callback function เมื่อต้องการจะเปลี่ยนไปหน้าแบบฟอร์มสมัครสมาชิก
 */
function SignInForm({ onSwitchToSignUp }: { onSwitchToSignUp: () => void }) {
  const router = useRouter();
  // state เพื่อล็อคปุ่มกดในขณะที่กำลังรอหลังแอปฯ ติดต่อกับฐานข้อมูล
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success("Logged in successfully");
      router.push("/");
      router.refresh();
    } catch (error: Error | unknown) {
      const err = error as Error;
      toast.error(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout subtitle="Sign in to access your synchronized links.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="signin-email"
              className="text-sm font-medium mb-1.5 block text-zinc-700 dark:text-zinc-300"
            >
              Email
            </label>
            <Input
              id="signin-email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@email.com"
              disabled={isLoading}
              required
              className="bg-zinc-50 dark:bg-zinc-950 h-11"
            />
          </div>
          <div>
            <label
              htmlFor="signin-password"
              className="text-sm font-medium mb-1.5 block text-zinc-700 dark:text-zinc-300"
            >
              Password
            </label>
            <Input
              id="signin-password"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={isLoading}
              required
              className="bg-zinc-50 dark:bg-zinc-950 h-11"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 mt-2 text-base font-medium rounded-xl transition active:scale-[0.98]"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <button
          type="button"
          onClick={onSwitchToSignUp}
          disabled={isLoading}
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          Don't have an account? Sign up
        </button>
      </div>
    </AuthLayout>
  );
}

/**
 * คอมโพเนนต์แบบฟอร์มสมัครสมาชิก (Sign Up)
 *
 * หน้าที่:
 * - สร้างบัญชีใหม่ให้ผู้ใช้ โดยดึงข้อมูลจาก Email และ Password
 * - ร้องขอกับฝั่ง Supabase Auth `signUp` หากทำรายการสำเร็จ จะมี toast โชว์เพื่อร้องให้ยืนยันตัวตนในอีเมล (ขึ้นอยู่กับการตั้งค่าจากฝั่ง Supabase)
 *
 * @param {() => void} onSwitchToSignIn Callback function เมื่อต้องการสลับหน้าจอกลับไปยังหน้าล็อกอิน
 */
function SignUpForm({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
  const [isLoading, setIsLoading] = useState(false);

  // ฟังก์ชันรองรับการสร้างฟอร์มผ่าน FormData โดยไม่ต้องใช้ controlled state (ประหยัดรอบการ render)
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      toast.success("Signed up successfully", {
        description: "Please check your email to confirm your account.",
      });
      onSwitchToSignIn();
    } catch (error: Error | unknown) {
      const err = error as Error;
      toast.error(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout subtitle="Create an account to start syncing links.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="signup-email"
              className="text-sm font-medium mb-1.5 block text-zinc-700 dark:text-zinc-300"
            >
              Email
            </label>
            <Input
              id="signup-email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@email.com"
              disabled={isLoading}
              required
              className="bg-zinc-50 dark:bg-zinc-950 h-11"
            />
          </div>
          <div>
            <label
              htmlFor="signup-password"
              className="text-sm font-medium mb-1.5 block text-zinc-700 dark:text-zinc-300"
            >
              Password
            </label>
            <Input
              id="signup-password"
              type="password"
              name="password"
              autoComplete="new-password"
              placeholder="••••••••"
              disabled={isLoading}
              required
              className="bg-zinc-50 dark:bg-zinc-950 h-11"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 mt-2 text-base font-medium rounded-xl transition active:scale-[0.98]"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign Up"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <button
          type="button"
          onClick={onSwitchToSignIn}
          disabled={isLoading}
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          Already have an account? Sign in
        </button>
      </div>
    </AuthLayout>
  );
}

/**
 * คอมโพเนนต์แสดงผลหน้าคัดแยกสำหรับการล็อกอินหรือสมัครสมาชิก (Login Content)
 *
 * ถูกนำมาห่อไว้แยกกัน เพื่อให้เข้ากันได้กับ `Suspense` เนื่องจากเรามีการใช้ `useSearchParams` เผื่อไว้
 *
 * หน้าที่หลัก:
 * - ตรวจสอบ Session ขางผู้ใช้ ถ้ามี Session แล้วให้ Redirect (เด้งไปที่) หน้าแรก ("/")
 * - สลับสถานะของมุมมอง ระหว่าง "signin" กับ "signup" ตาม state การใช้งาน
 */
function LoginContent() {
  const router = useRouter();
  // ดึงค่า params ตรวจสอบเผื่อมี query ที่ส่งค่าคำสั่งให้ Add Account แทนการเข้าไปหน้า Dashboard ปกติ
  const searchParams = useSearchParams();
  const isAddingAccount = searchParams.get("add") === "true";
  const [view, setView] = useState<"signin" | "signup">("signin");

  // ตรวจสอบเช็คสถานะล็อกอินทันทีเมื่อเข้ามาที่เพจ
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session && !isAddingAccount) {
        router.push("/");
      }
    };

    checkSession();
  }, [router, isAddingAccount]);

  if (view === "signin") {
    return <SignInForm onSwitchToSignUp={() => setView("signup")} />;
  }
  return <SignUpForm onSwitchToSignIn={() => setView("signin")} />;
}

/**
 * หน้าเพจล็อกอินหลัก (Client Component)
 *
 * มีหน้าที่ห่อหุ้ม `LoginContent` พร้อมจัดเตรียม `Suspense` fallback (UI เวลาโหลดเนื้อหาหลัก)
 *
 * @returns {JSX.Element} หน้าส่วนประกอบและหน้าสำหรับยืนยันตัวตน
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
