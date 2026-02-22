-- 1. เพิ่ม User ID Column และเชื่อม Foreign Key
ALTER TABLE public.messages ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- 2. สร้าง Index เพื่อเพิ่มความเร็ว Query (Supabase Performance Best Practice)
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id_created_at ON public.messages(user_id, created_at DESC);

-- 3. เปิดระบบรักษาความปลอดภัยด่านแถว (RLS)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. ตั้งค่า Policy ให้อ่าน/เขียน เฉพาะข้อมูลของตนเอง
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);
