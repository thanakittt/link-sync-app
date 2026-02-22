"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link as LinkIcon, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ModeToggle } from "@/components/mode-toggle";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAddingAccount = searchParams.get("add") === "true";
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Logged in successfully");
        router.push("/");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Signed up successfully", {
          description: "Please check your email to confirm your account.",
        });
        setIsLogin(true); // Switch to login view after successful signup if email confirmation isn't strictly enforced
      }
    } catch (error: Error | unknown) {
      const err = error as Error;
      toast.error(err.message || "Authentication failed");
      console.error("Auth error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans selection:bg-zinc-300 dark:selection:bg-zinc-700 min-h-screen flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <main className="w-full max-w-sm flex flex-col gap-6">
        {/* Header */}
        <header className="flex flex-col items-center gap-2 text-center">
          <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 p-3 rounded-2xl mb-2 shadow-lg shadow-zinc-200/50 dark:shadow-black/50">
            <LinkIcon className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Link Sync</h1>
          <p className="text-zinc-500 text-sm">
            {isLogin
              ? "Sign in to access your synchronized links."
              : "Create an account to start syncing links."}
          </p>
        </header>

        {/* Auth Form */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border shadow-xl shadow-zinc-200/50 dark:shadow-black/50 ring-1 ring-zinc-900/5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block text-zinc-700 dark:text-zinc-300">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="bg-zinc-50 dark:bg-zinc-950 h-11"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="bg-zinc-50 dark:bg-zinc-950 h-11"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full h-11 mt-2 text-base font-medium rounded-xl transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <button
              onClick={() => setIsLogin(!isLogin)}
              disabled={isLoading}
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

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
