import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * ฟังก์ชันยูทิลิตี้ (Utility) พื้นฐานสำหรับประกอบและควบรวม Class ของ TailwindCSS
 *
 * ทำงานร่วมกันระหว่าง `clsx` (ใช้จัดการเงื่อนไข class) และ `tailwind-merge`
 * (ใช้ลบ class ที่ทับซ้อนหรือขัดแย้งกันอย่างชาญฉลาด)
 * นิยมใช้มากที่สุดในชุด UI Components ของ shadcn/ui
 *
 * @param {ClassValue[]} inputs รายการ class ต่างๆ ในรูปแบบ String, Object หรือ Array
 * @returns {string} Tailwind CSS class ท้ายสุดที่ผ่านการกรองและยุบรวมเรียบร้อยแล้ว
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
