"use client";

import { useMessages } from "@/components/messages-provider";
import {
  Link as LinkIcon,
  UserCircle,
  Plus,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AppHeader() {
  const { state, actions, meta } = useMessages();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const user = state.user;

  return (
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
                  <AvatarFallback>
                    {user.email?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Account</p>
                  <p className="text-xs leading-none text-zinc-500">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="font-normal text-xs text-zinc-500">
                Saved Accounts
              </DropdownMenuLabel>
              {meta.savedAccounts
                .filter((acc) => acc.email !== user.email)
                .map((acc) => (
                  <DropdownMenuItem
                    key={acc.email}
                    onClick={() => actions.switchAccount(acc)}
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
                onClick={() => actions.signOut()}
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
  );
}
