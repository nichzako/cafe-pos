-- ============================================================
-- Cafe POS — Row Level Security (RLS) Setup
-- ============================================================
-- วิธีใช้: วาง SQL นี้ใน Supabase Dashboard > SQL Editor แล้วกด Run
--
-- หมายเหตุสำคัญ:
--   * API routes ใช้ SUPABASE_SERVICE_ROLE_KEY → bypass RLS ทั้งหมด (ปลอดภัย)
--   * RLS นี้ป้องกัน: Realtime subscriptions, direct client queries, dashboard access
--   * ต้อง apply CHECK CONSTRAINTS (prisma/check-constraints.sql) ก่อนหรือพร้อมกัน
-- ============================================================

-- ---- Helper Function -------------------------------------------------------
-- ดึง role ของ staff ที่ login อยู่จาก auth.uid()
-- SECURITY DEFINER = รันด้วย owner privileges (ข้าม RLS ตอนดึง staff record)

CREATE OR REPLACE FUNCTION public.get_current_staff_role()
RETURNS TEXT AS $$
  SELECT role::text
  FROM public.staff
  WHERE auth_id = auth.uid()
    AND is_active = true
  LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---- Enable RLS on all tables ----------------------------------------------

ALTER TABLE public.staff        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts     ENABLE ROW LEVEL SECURITY;

-- ---- DROP existing policies (idempotent re-run) ----------------------------

DO $block$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('staff','categories','menus','tables','orders','order_items','payments','receipts')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END
$block$;

-- ============================================================
-- TABLE: staff
-- ============================================================
-- SELECT: staff ทุกคนดูรายชื่อเพื่อนร่วมงานได้
-- INSERT: service role เท่านั้น (สร้างผ่าน API)
-- UPDATE: admin ทุก field | staff แก้ได้เฉพาะ record ตัวเอง
-- DELETE: service role เท่านั้น (ใช้ is_active=false แทน hard delete)

CREATE POLICY "staff_select_authenticated"
  ON public.staff FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "staff_insert_service_role"
  ON public.staff FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "staff_update_admin_or_self"
  ON public.staff FOR UPDATE
  TO authenticated
  USING (
    public.get_current_staff_role() = 'admin'
    OR auth_id = auth.uid()
  )
  WITH CHECK (
    public.get_current_staff_role() = 'admin'
    OR auth_id = auth.uid()
  );

CREATE POLICY "staff_delete_service_role"
  ON public.staff FOR DELETE
  TO service_role
  USING (true);

-- ============================================================
-- TABLE: categories
-- ============================================================
-- SELECT: ทุกคน (ต้องการสร้าง order)
-- INSERT/UPDATE/DELETE: admin เท่านั้น

CREATE POLICY "categories_select_authenticated"
  ON public.categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "categories_insert_admin"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (public.get_current_staff_role() = 'admin');

CREATE POLICY "categories_update_admin"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (public.get_current_staff_role() = 'admin')
  WITH CHECK (public.get_current_staff_role() = 'admin');

CREATE POLICY "categories_delete_admin"
  ON public.categories FOR DELETE
  TO authenticated
  USING (public.get_current_staff_role() = 'admin');

-- ============================================================
-- TABLE: menus
-- ============================================================
-- SELECT: ทุกคน (POS ต้องแสดง menu ทั้งหมด)
-- INSERT/UPDATE/DELETE: admin เท่านั้น

CREATE POLICY "menus_select_authenticated"
  ON public.menus FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "menus_insert_admin"
  ON public.menus FOR INSERT
  TO authenticated
  WITH CHECK (public.get_current_staff_role() = 'admin');

CREATE POLICY "menus_update_admin"
  ON public.menus FOR UPDATE
  TO authenticated
  USING (public.get_current_staff_role() = 'admin')
  WITH CHECK (public.get_current_staff_role() = 'admin');

CREATE POLICY "menus_delete_admin"
  ON public.menus FOR DELETE
  TO authenticated
  USING (public.get_current_staff_role() = 'admin');

-- ============================================================
-- TABLE: tables
-- ============================================================
-- SELECT: ทุกคน (cashier ต้องเลือกโต๊ะ)
-- INSERT/DELETE: admin เท่านั้น
-- UPDATE: ทุกคน (cashier/barista อัพเดต status ได้)

CREATE POLICY "tables_select_authenticated"
  ON public.tables FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tables_insert_admin"
  ON public.tables FOR INSERT
  TO authenticated
  WITH CHECK (public.get_current_staff_role() = 'admin');

CREATE POLICY "tables_update_authenticated"
  ON public.tables FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "tables_delete_admin"
  ON public.tables FOR DELETE
  TO authenticated
  USING (public.get_current_staff_role() = 'admin');

-- ============================================================
-- TABLE: orders
-- ============================================================
-- SELECT: ทุกคน (barista ต้องเห็น orders ทั้งหมดเพื่อเตรียม)
--         ★ table นี้ใช้กับ Supabase Realtime subscription
-- INSERT: cashier และ admin
-- UPDATE: ทุกคน (ตาม status transition ที่ API route ควบคุม)
-- DELETE: admin เท่านั้น

CREATE POLICY "orders_select_authenticated"
  ON public.orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "orders_insert_cashier_admin"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_current_staff_role() IN ('cashier', 'admin')
  );

CREATE POLICY "orders_update_authenticated"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "orders_delete_admin"
  ON public.orders FOR DELETE
  TO authenticated
  USING (public.get_current_staff_role() = 'admin');

-- ============================================================
-- TABLE: order_items
-- ============================================================
-- SELECT: ทุกคน (barista ต้องดูรายการใน order)
-- INSERT/UPDATE/DELETE: cashier และ admin

CREATE POLICY "order_items_select_authenticated"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "order_items_insert_cashier_admin"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_current_staff_role() IN ('cashier', 'admin')
  );

CREATE POLICY "order_items_update_cashier_admin"
  ON public.order_items FOR UPDATE
  TO authenticated
  USING (public.get_current_staff_role() IN ('cashier', 'admin'))
  WITH CHECK (public.get_current_staff_role() IN ('cashier', 'admin'));

CREATE POLICY "order_items_delete_cashier_admin"
  ON public.order_items FOR DELETE
  TO authenticated
  USING (public.get_current_staff_role() IN ('cashier', 'admin'));

-- ============================================================
-- TABLE: payments
-- ============================================================
-- SELECT: ทุกคน (cashier ยืนยันสถานะชำระเงิน)
-- INSERT: cashier และ admin
-- UPDATE: admin เท่านั้น (refund, correction)
-- DELETE: ห้ามทุกกรณี — audit trail

CREATE POLICY "payments_select_authenticated"
  ON public.payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "payments_insert_cashier_admin"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_current_staff_role() IN ('cashier', 'admin')
  );

CREATE POLICY "payments_update_admin"
  ON public.payments FOR UPDATE
  TO authenticated
  USING (public.get_current_staff_role() = 'admin')
  WITH CHECK (public.get_current_staff_role() = 'admin');

-- ไม่มี DELETE policy → ลบไม่ได้เลย (รวมถึง authenticated users)

-- ============================================================
-- TABLE: receipts
-- ============================================================
-- SELECT: ทุกคน (reprint receipt ได้)
-- INSERT: cashier และ admin (สร้างพร้อม payment)
-- UPDATE: admin เท่านั้น (อัพเดต printed_at)
-- DELETE: ห้ามทุกกรณี — permanent audit record

CREATE POLICY "receipts_select_authenticated"
  ON public.receipts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "receipts_insert_cashier_admin"
  ON public.receipts FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_current_staff_role() IN ('cashier', 'admin')
  );

CREATE POLICY "receipts_update_admin"
  ON public.receipts FOR UPDATE
  TO authenticated
  USING (public.get_current_staff_role() = 'admin')
  WITH CHECK (public.get_current_staff_role() = 'admin');

-- ไม่มี DELETE policy → ลบไม่ได้เลย

-- ============================================================
-- VERIFY: รัน query นี้หลัง setup เพื่อยืนยัน
-- ============================================================
--
-- SELECT tablename, policyname, cmd, roles
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;
