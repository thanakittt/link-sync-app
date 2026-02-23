"use client";

import { useEffect, useState } from "react";
import {
  Send,
  Link as LinkIcon,
  LogOut,
  Loader2,
  Users,
  UserCircle,
  Plus,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase, Message } from "@/lib/supabase";
import { SyncCard } from "@/components/sync-card";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import {
  type User,
  type Session,
  type AuthChangeEvent,
} from "@supabase/supabase-js";

export default function LinkSyncApp() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const { theme, setTheme } = useTheme();
  // State เก็บข้อความทั้งหมดที่ดึงมาแสดงบนหน้าจอ
  const [messages, setMessages] = useState<Message[]>([]);
  // State เก็บข้อความที่ผู้ใช้พิมพ์ในช่อง input
  const [inputValue, setInputValue] = useState("");
  // State ป้องกันการกดปุ่มส่งซ้ำซ้อนขณะกำลังส่งข้อมูล
  const [isLoading, setIsLoading] = useState(false);
  // State เก็บเลขหน้าปัจจุบัน สำหรับทำ Pagination
  const [page, setPage] = useState(0);
  // State เช็คว่ายังมีข้อมูลเก่าใน Database ให้ดึงอีกไหม (ถ้าดึงมาไม่ถึงโควต้าแปลว่าหมดแล้ว)
  const [hasMore, setHasMore] = useState(true);

  // State เก็บรายชื่อบัญชีที่เคยล็อกอิน
  const [savedAccounts, setSavedAccounts] = useState<any[]>([]);

  // โหลดรายชื่อบัญชีเมื่อเริ่มต้น
  useEffect(() => {
    const loadedStr = localStorage.getItem("link-sync-accounts");
    if (loadedStr) {
      try {
        setSavedAccounts(JSON.parse(loadedStr));
      } catch (e) {}
    }
  }, []);

  // State แสดง Skeleton โหลดข้อมูลตอนเข้าเว็บครั้งแรก
  const [isFetchingInitial, setIsFetchingInitial] = useState(true);
  // State แสดง Skeleton ปุ่มโหลดระหว่างกำลังดึงข้อมูลหน้าถัดไป
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // กำหนดจำนวนข้อความที่จะแสดงต่อ 1 หน้า (สำหรับการดึงประวัติเก่า)
  const ITEMS_PER_PAGE = 25;

  // ฟังก์ชันสำหรับ Sign Out
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      if (user?.email) {
        const updated = savedAccounts.filter((acc) => acc.email !== user.email);
        setSavedAccounts(updated);
        localStorage.setItem("link-sync-accounts", JSON.stringify(updated));

        if (updated.length > 0) {
          handleSwitchAccount(updated[0]);
        } else {
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    }
  };

  const handleSwitchAccount = async (account: any) => {
    try {
      if (account.email === user?.email) return;
      setIsFetchingInitial(true);
      const { error } = await supabase.auth.setSession(account.session);
      if (error) {
        const updated = savedAccounts.filter(
          (acc) => acc.email !== account.email,
        );
        setSavedAccounts(updated);
        localStorage.setItem("link-sync-accounts", JSON.stringify(updated));
        toast.error("Session expired. Please sign in again.");
        if (updated.length === 0) {
          router.push("/login");
        }
        return;
      }
      toast.success(`Switched to ${account.email}`);
      window.location.reload();
    } catch (err) {
      toast.error("Failed to switch account");
    }
  };

  const updateSavedAccount = (session: Session) => {
    if (!session.user.email) return;
    const email = session.user.email;
    const accountData = {
      email,
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      },
    };

    setSavedAccounts((prev) => {
      const existing = prev.filter((acc) => acc.email !== email);
      const updated = [accountData, ...existing];
      localStorage.setItem("link-sync-accounts", JSON.stringify(updated));
      return updated;
    });
  };

  // ฟังก์ชันหลักสำหรับดึงข้อมูลข้อความจาก Supabase
  const fetchMessages = async (pageNumber: number, isInitial = false) => {
    // กำหนดสถานะ Loading ก่อนเริ่มดึงข้อมูล
    if (isInitial) setIsFetchingInitial(true);
    else setIsFetchingMore(true);

    // ดึงข้อมูลจากตาราง "messages" เรียงลำดับจากล่าสุดไปเก่าสุด
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
      // ใช้ range เพื่อดึงข้อมูลตามหน้า (Pagination)
      .range(
        pageNumber * ITEMS_PER_PAGE,
        (pageNumber + 1) * ITEMS_PER_PAGE - 1,
      );

    if (error) {
      toast.error("Failed to load history");
      console.error("Error fetching messages:", error);
    } else {
      if (data) {
        const messagesData = data as Message[];
        if (isInitial) {
          // ถ้าเป็นการดึงครั้งแรก ให้แทนที่ state เดิมด้วยข้อมูลใหม่ทั้งหมด
          setMessages(messagesData);
        } else {
          // ถ้าเป็นการโหลดหน้าถัดไป ให้เอาข้อมูลใหม่มาต่อท้าย (เพราะเรียงจากใหม่สุดอยู่แล้ว)
          setMessages((prev) => [...prev, ...messagesData]);
        }
        // ตรวจสอบว่าจำนวนที่ดึงมาเท่ากับโควต้าไหม ถ้าใช่แปลว่าอาจจะมีข้อมูลหน้าถัดไปอีก
        setHasMore(data.length === ITEMS_PER_PAGE);
      }
    }

    if (isInitial) setIsFetchingInitial(false);
    else setIsFetchingMore(false);
  };

  // ทำตอน component mount เพื่อดึงข้อมูลข้อความเริ่มต้น
  // Fetch initial messages and session
  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        updateSavedAccount(session);
        fetchMessages(0, true);
      } else {
        router.push("/login");
      }
    };
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          updateSavedAccount(session);
        }
      },
    );
    return () => subscription.unsubscribe();
  }, [router]);

  // ฟังก์ชันสำหรับจัดการเมื่อผู้ใช้กดปุ่ม Load More
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage); // อัปเดตเลขหน้าขึ้น 1
    fetchMessages(nextPage); // ไปดึงข้อมูลหน้าที่อัปเดตใหม่
  };

  // สมัครรับการแจ้งเตือนจาก Supabase (Realtime)
  // Subscribe to changes
  useEffect(() => {
    if (!user) return; // Only subscribe if logged in

    const channel = supabase
      .channel("messages_changes")
      // คอยฟัง Event ประเภท INSERT (เพิ่มข้อมูลใหม่) บนตาราง messages ช่องทาง public
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // เอาข้อความดึงมาแปะไว้ "หน้าสุด" ของ Timeline อัตโนมัติ (Array ต้นๆ)
          setMessages((prev) => [newMessage, ...prev]);

          // แจ้งเตือนผู้ใช้หากเป็นลิงก์ส่งมา เพื่อความสะดวก
          // Optionally notify user
          if (newMessage.type === "url") {
            toast.info("New link received! Click to open or copy.");
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // ฟังก์ชันตอนกด Submit Form ส่งข้อความ/ลิงก์
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // ถ้าพิมพ์แต่เว้นวรรครัวๆ ไม่ต้องทำอะไร
    if (!inputValue.trim() || !user) return;

    setIsLoading(true); // ปรับ state ของ form เป็น Loading
    const content = inputValue.trim();
    // Regex เช็คแบบง่ายๆ ว่าข้อความเข้าข่ายเป็น URL ไหม
    const isUrl =
      /^(https?:\/\/|[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$)/i.test(
        content,
      );

    // ถ้ายืนยันว่าเป็น URL แต่คนพิมพ์ลืมใส่ http(s) ระบบจะเติมให้เพื่อป้องกันการกดแล้ว Error
    // Add https:// prefix if it looks like a url but missing protocol
    let finalContent = content;
    if (isUrl && !content.startsWith("http")) {
      finalContent = `https://${content}`;
    }

    const newMessage = {
      content: finalContent,
      type: isUrl ? ("url" as const) : ("text" as const),
      user_id: user.id,
    };

    // ส่งข้อความไป Insert ผ่าน SDK ของ Supabase ทันที
    const { error } = await supabase.from("messages").insert([newMessage]);

    if (error) {
      toast.error("Failed to send");
      console.error(error);
    } else {
      setInputValue("");
      // เราจะไม่ใส่ข้อมูลลง State ทันทีที่กดส่งสำเร็จตรงนี้
      // แต่จะปล่อยให้ useEffect() ที่เรา Subscribe 'INSERT' เอาไว้เป็นคนจัดการอัปเดต State ให้แทน
      // เพื่อป้องกันกรณีข้อความซ้ำซ้อนกันเวลา Sync ข้ามอุปกรณ์
      // Don't add to state directly, let realtime subscription handle it to ensure consistency
    }

    setIsLoading(false);
  };

  if (!user) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans selection:bg-zinc-300 dark:selection:bg-zinc-700 min-h-screen flex flex-col items-center">
      <main className="w-full max-w-2xl px-4 md:px-8 flex flex-col flex-1 overflow-hidden relative">
        {/* Header */}
        <header className="py-6 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 p-2 rounded-xl">
                <LinkIcon className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Link Sync</h1>
            </div>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                    aria-label="User account menu"
                  >
                    <Avatar className="h-10 w-10 border border-zinc-200 dark:border-zinc-800">
                      {/* <AvatarImage
                        src={`https://avatar.vercel.sh/${user.email}`}
                        alt={user.email || ""}
                      /> */}
                      <AvatarFallback>
                        {user.email?.slice(0, 2).toUpperCase()}
                        {/* <UserCircle className="h-6 w-6 text-zinc-500" /> */}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Account
                      </p>
                      <p className="text-xs leading-none text-zinc-500">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="font-normal text-xs text-zinc-500">
                    Saved Accounts
                  </DropdownMenuLabel>
                  {savedAccounts
                    .filter((acc) => acc.email !== user.email)
                    .map((acc) => (
                      <DropdownMenuItem
                        key={acc.email}
                        onClick={() => handleSwitchAccount(acc)}
                        className="cursor-pointer"
                      >
                        <UserCircle className="mr-2 h-4 w-4" />
                        <span className="truncate">{acc.email}</span>
                      </DropdownMenuItem>
                    ))}
                  <DropdownMenuItem
                    onClick={() => router.push("/login?add=true")}
                    className="cursor-pointer"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Add another account</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      setTheme(theme === "dark" ? "light" : "dark");
                    }}
                    className="cursor-pointer"
                  >
                    <div className="mr-2 relative flex h-4 w-4 items-center justify-center">
                      <Sun className="h-4 w-4 rotate-0 scale-100 transition dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition dark:rotate-0 dark:scale-100" />
                    </div>
                    <span>Toggle Theme</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <p className="text-zinc-500 text-sm">
            Send text and URLs seamlessly across all your devices.
          </p>
        </header>

        {/* Input Area */}
        <div className="mb-6 shrink-0">
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 bg-white dark:bg-zinc-900 p-2 rounded-2xl border shadow-lg shadow-zinc-200/50 dark:shadow-black/50 ring-1 ring-zinc-900/5"
          >
            <Input
              name="message"
              placeholder="Paste a link or type a message…"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 flex-1 h-12 text-base bg-transparent p-3"
              disabled={isLoading}
              autoComplete="off"
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="h-12 w-12 rounded-xl shrink-0"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>

        {/* List of Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-6 px-1 -mx-1 hide-scrollbar">
          {isFetchingInitial ? (
            Array.from({ length: 5 }).map((_, i) => (
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
            ))
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 gap-3 pt-10">
              <LinkIcon className="h-12 w-12 opacity-20" />
              <p>No history yet. Send something!</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <SyncCard key={msg.id} message={msg} />
              ))}
              {isFetchingMore ? (
                <div className="flex justify-center pt-2 pb-6">
                  <Skeleton className="h-9 w-24 rounded-md" />
                </div>
              ) : hasMore ? (
                <div className="flex justify-center pt-2 pb-6">
                  <Button variant="outline" size="sm" onClick={handleLoadMore}>
                    Load More
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
