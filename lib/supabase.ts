import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./database.types";

export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
};

export const supabase = createClient();

export type Message = {
  id: string;
  content: string;
  type: "text" | "url";
  created_at: string;
  user_id?: string;
};
