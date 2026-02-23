"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * คอมโพเนนต์บริบทสำหรับจัดการเรื่อง Theme (Dark Mode / Light Mode)
 *
 * ห่อหุ้มแอปพลิเคชันด้วย `next-themes` เพื่อให้สามารถใช้งาน hook `useTheme()` ได้
 *
 * @param {React.ComponentProps<typeof NextThemesProvider>} props การตั้งค่าต่างๆ ของ Provider
 * @returns {JSX.Element} Provider ของธีม
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
