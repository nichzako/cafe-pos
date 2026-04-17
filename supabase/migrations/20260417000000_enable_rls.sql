-- Migration: Enable Row Level Security on all tables
-- Strategy:
--   - Prisma (direct connection as postgres superuser) bypasses RLS → writes work as before
--   - Supabase Data API (REST/GraphQL) with anon key → blocked entirely
--   - Supabase Data API with authenticated key → SELECT only (supports Realtime subscriptions)
--   - No INSERT/UPDATE/DELETE policies via Data API → all writes go through Prisma

-- ─── Enable RLS ───────────────────────────────────────────────────────────────

ALTER TABLE public.staff        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts     ENABLE ROW LEVEL SECURITY;

-- ─── Helper Function ──────────────────────────────────────────────────────────
-- ใช้ SECURITY DEFINER + empty search_path ป้องกัน search_path injection
-- STABLE = Postgres caches result within a single query (ไม่ call per-row)

CREATE OR REPLACE FUNCTION get_my_staff_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role::text
  FROM public.staff
  WHERE "authId" = auth.uid()::text
    AND "isActive" = true
  LIMIT 1
$$;

-- ─── SELECT Policies: authenticated staff can read all data ───────────────────
-- ใช้ (SELECT auth.uid()) แทน auth.uid() โดยตรง → evaluated once per query ไม่ใช่ per-row

CREATE POLICY "staff_authenticated_select"
  ON public.staff FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "categories_authenticated_select"
  ON public.categories FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "menus_authenticated_select"
  ON public.menus FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "tables_authenticated_select"
  ON public.tables FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "orders_authenticated_select"
  ON public.orders FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "order_items_authenticated_select"
  ON public.order_items FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "payments_authenticated_select"
  ON public.payments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "receipts_authenticated_select"
  ON public.receipts FOR SELECT TO authenticated
  USING (true);

-- ─── Notes ────────────────────────────────────────────────────────────────────
-- 1. anon role: no policies = blocked on all tables (ยอดดีสำหรับ internal POS tool)
-- 2. authenticated role: SELECT only via Data API
--    ถ้าต้องการ Realtime subscriptions จะ work เพราะ Realtime ใช้ RLS SELECT policy
-- 3. Prisma (postgres superuser): bypasses RLS ทั้งหมด = writes ยังทำงานปกติ
-- 4. service_role key: bypasses RLS ทั้งหมด = Supabase Studio ยังดู data ได้
-- 5. ถ้าอยากเพิ่ม role-based write policies ในอนาคต ให้ใช้ get_my_staff_role() function
