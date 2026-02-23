"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

/**
 * ปุ่มสลับโหมดหน้าจอ (สว่าง/มืด)
 *
 * หน้าที่:
 * - อาศัย `useTheme()` จาก `next-themes` ในการดึงและสลับค่าธีม
 * - แสดงปุ่มกลมๆ ที่มุมขวาล่างของหน้าจอ พร้อมภาพเคลื่อนไหว (Animation) สลับไอคอนพระอาทิตย์กับพระจันทร์
 *
 * @returns {JSX.Element} ปุ่มควบคุม Theme
 */
export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      className="absolute bottom-4 right-4 md:bottom-8 md:right-8 rounded-full z-50 shadow-sm"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
