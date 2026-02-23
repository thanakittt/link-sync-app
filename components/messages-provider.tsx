"use client";

import { createContext, use, useEffect, useState } from "react";
import { supabase, Message } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";

/**
 * ชนิดข้อมูล (Interface) สำหรับ State (สถานะต่างๆ) ของข้อความและผู้ใช้ในแอป
 */
export interface MessagesState {
  user: User | null;
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;
  isFetchingInitial: boolean;
  isFetchingMore: boolean;
  isInitialized: boolean;
}

/**
 * ชนิดข้อมูลสำหรับ Action ต่างๆ ที่ส่งผ่าน Context ให้ UI component เรียกใช้
 */
export interface MessagesActions {
  submit: (content: string) => Promise<void>;
  loadMore: () => void;
  signOut: () => Promise<void>;
  switchAccount: (account: any) => Promise<void>;
}

export interface MessagesMeta {
  savedAccounts: any[];
}

export interface MessagesContextValue {
  state: MessagesState;
  actions: MessagesActions;
  meta: MessagesMeta;
}

const MessagesContext = createContext<MessagesContextValue | null>(null);

/**
 * Custom Hook สำหรับการดึง MessagesContext มาใช้งานใน Component ใดๆ อย่างง่ายดาย
 * โดยต้องถูกใช้ภายในภายใต้ `MessagesProvider` เสมอ
 *
 * @returns {MessagesContextValue} บริบทที่เกี่ยวกับ messages, actions, user state
 */
export function useMessages() {
  const context = use(MessagesContext);
  if (!context) {
    throw new Error("useMessages must be used within a MessagesProvider");
  }
  return context;
}

/**
 * Provider หลักสำหรับจัดการ State ครอบจักรวาล (Global State) ในเรื่องที่เกี่ยวกับลิงก์และข้อความ (Link Sync Logic)
 *
 * หน้าที่รับผิดชอบ:
 * 1. ตรวจสอบและติดตาม (Subscribe) สถานะ Auth ผ่าน Supabase Session
 * 2. โหลดรายการข้อความ (Messages) แบบ Pagination (ออฟเซตทีละ ITEMS_PER_PAGE รายการ)
 * 3. รับฟังข้อมูลอัปเดตแบบเรียลไทม์ (Real-time updates) จาก Supabase (on 'INSERT')
 * 4. จัดการเรื่อง Switch Account โดยเซฟ Token ไว้ที่ LocalStorage ชั่วคราว
 *
 * @param {React.ReactNode} children คอมโพเนนต์หรือ UI ที่จะนำ state จากที่นี่ไปใช้
 */
export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [savedAccounts, setSavedAccounts] = useState<any[]>([]);
  const [isFetchingInitial, setIsFetchingInitial] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const ITEMS_PER_PAGE = 25;

  // อ่านข้อมูล Session ของ Account ที่เราเคยล็อกอินแช่ไว้ในเว็บบราวเซอร์นี้ (จาก localStorage)
  useEffect(() => {
    const loadedStr = localStorage.getItem("link-sync-accounts");
    if (loadedStr) {
      try {
        setSavedAccounts(JSON.parse(loadedStr));
      } catch (e) {}
    }
  }, []);

  // ฟังก์ชันจัดเก็บ Account ชั่วคราว (Multi-account Support เบื้องต้นใน LocalStorage)
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

  /**
   * ดึงข้อมูลข้อความเก่าๆ (Fetch Messages) จาก Supabase Data API (PostgreSQL)
   *
   * @param {number} pageNumber หน้าปัจจุบันที่ต้องการดึง (เริ่มจาก 0)
   * @param {boolean} isInitial เป็นการดึงเริ่มต้นตั้งแต่โหลดแอปเสร็จหมาดๆ หรือไม่ (ตั้งเป็น true วันที่เปิดหน้าครั้งแรก)
   */
  const fetchMessages = async (pageNumber: number, isInitial = false) => {
    if (isInitial) setIsFetchingInitial(true);
    else setIsFetchingMore(true);

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
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
          setMessages(messagesData);
        } else {
          setMessages((prev) => [...prev, ...messagesData]);
        }
        setHasMore(data.length === ITEMS_PER_PAGE);
      }
    }

    if (isInitial) setIsFetchingInitial(false);
    else setIsFetchingMore(false);
  };

  // ตรวจสอบสถานะการเข้าระบบ (Authentication) กับเซิร์ฟเวอร์
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
      setIsInitialized(true);
    };
    init();

    // คอยดักฟัง (Listener) หากมีการเปลี่ยนสถานะ เช่น User กด Log out / Switch Account แล้ว Token หมดอายุ
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

  useEffect(() => {
    if (!user) return;

    // ระบบเชื่อมต่อ WebSockets (Realtime Channel) ดักการเพิ่มข้อมูลลงฐานข้อมูลโดยตรง
    // ถ้าผู้ใช้ล็อกอินมือถือและคอม คอมาดจะได้ไม่ต้องรีเฟรชหน้าเอง เวลามีลิงก์ใหม่เด้งเข้ามา
    const channel = supabase
      .channel("messages_changes")
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
          setMessages((prev) => [newMessage, ...prev]);

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

  // ตัวจัดการการโหลดย้อนหลัง (Load More Pagination)
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMessages(nextPage);
  };

  // จัดการการออกจากระบบ พร้อมทั้งล้างข้อมูล Account ใน LocalStorage ที่เป็นของตัวเองทิ้งด้วย
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

  // เอาไว้สลับบัญชี (Switch Account) กรณีที่มีข้อมูลล็อกอินหลายตัวอยู่ในเครื่อง
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

  /**
   * บันทึกข้อความ (คำสั่งพิมพ์หรือแนบลิงก์) ลงไปบนฐานข้อมูลของ Supabase Server
   * ผ่าน function insert() และจะนำตรวจสอบด้วยว่าค่าที่รับข้อความเป็น URL ที่ถูกต้องตามหลัก Regex หรือไม่
   *
   * @param {string} content ข้อมูลที่ต้องการพ่นเข้า database (ดึงจาก input form)
   */
  const handleSubmit = async (content: string) => {
    if (!content.trim() || !user) return;

    setIsLoading(true);
    const isUrl =
      /^(https?:\/\/|[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$)/i.test(
        content,
      );

    let finalContent = content;
    if (isUrl && !content.startsWith("http")) {
      finalContent = `https://${content}`;
    }

    const newMessage = {
      content: finalContent,
      type: isUrl ? ("url" as const) : ("text" as const),
      user_id: user.id,
    };

    const { error } = await supabase.from("messages").insert([newMessage]);

    if (error) {
      toast.error("Failed to send");
      console.error(error);
    }

    setIsLoading(false);
  };

  const state: MessagesState = {
    user,
    messages,
    isLoading,
    hasMore,
    isFetchingInitial,
    isFetchingMore,
    isInitialized,
  };

  const actions: MessagesActions = {
    submit: handleSubmit,
    loadMore: handleLoadMore,
    signOut: handleSignOut,
    switchAccount: handleSwitchAccount,
  };

  const meta: MessagesMeta = {
    savedAccounts,
  };

  return (
    <MessagesContext value={{ state, actions, meta }}>
      {children}
    </MessagesContext>
  );
}
