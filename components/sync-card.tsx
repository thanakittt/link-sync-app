"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Copy, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Message } from "@/lib/supabase";
import { toast } from "sonner";

export function SyncCard({ message }: { message: Message }) {
  // State ป้องกันความสับสนตอนกด Copy แจ้งให้รู้ว่าคัดลอกสำเร็จแล้ว
  const [copied, setCopied] = useState(false);

  // ฟังก์ชันเขียนข้อมูลลง Clipboard ของเครื่อง
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy text");
    }
  };

  // ฟังก์ชันเปิดแท็บใหม่สำหรับลิงก์
  const handleOpen = () => {
    window.open(message.content, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 overflow-hidden">
            {message.type === "url" ? (
              <a
                href={message.content}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline break-all line-clamp-3 font-medium"
              >
                {message.content}
              </a>
            ) : (
              <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              title="Copy to clipboard"
              className="h-8 w-8"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            {message.type === "url" && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleOpen}
                title="Open URL"
                className="h-8 w-8"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="text-xs text-zinc-500">
          {formatDistanceToNow(new Date(message.created_at), {
            addSuffix: true,
          })}
        </div>
      </CardContent>
    </Card>
  );
}
