-- ============================================================================
-- Habib Al-Habayeb — Row Level Security (RLS) & Security Policies
-- ============================================================================

-- 1. Helper Functions for Role Authorization
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()::text
      AND role IN ('superadmin', 'admin')
  );
$$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()::text
      AND role IN ('superadmin', 'admin', 'staff')
  );
$$;
--> statement-breakpoint

-- 2. Enable RLS on all 14 core tables
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "brands" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "product_categories" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "product_variants" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "product_images" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "order_line_items" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "order_status_history" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "payment_records" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "media_files" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "site_settings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "hero_settings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

-- ============================================================================
-- 3. PROFILES POLICIES
-- ============================================================================
-- Users can view their own profile; Admins can view all profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON "profiles";
--> statement-breakpoint
CREATE POLICY "profiles_select_policy" ON "profiles"
  FOR SELECT
  USING (
    id = auth.uid()::text
    OR public.is_admin()
  );
--> statement-breakpoint

-- Users can only insert their own profile with non-admin role, unless admin
DROP POLICY IF EXISTS "profiles_insert_policy" ON "profiles";
--> statement-breakpoint
CREATE POLICY "profiles_insert_policy" ON "profiles"
  FOR INSERT
  WITH CHECK (
    (id = auth.uid()::text AND role IN ('customer', 'staff'))
    OR public.is_admin()
  );
--> statement-breakpoint

-- Users can update their own profile info (but cannot change role to admin), Admins can update any
DROP POLICY IF EXISTS "profiles_update_policy" ON "profiles";
--> statement-breakpoint
CREATE POLICY "profiles_update_policy" ON "profiles"
  FOR UPDATE
  USING (
    id = auth.uid()::text
    OR public.is_admin()
  )
  WITH CHECK (
    (id = auth.uid()::text AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()::text))
    OR public.is_admin()
  );
--> statement-breakpoint

-- Only admins can delete profiles
DROP POLICY IF EXISTS "profiles_delete_policy" ON "profiles";
--> statement-breakpoint
CREATE POLICY "profiles_delete_policy" ON "profiles"
  FOR DELETE
  USING (public.is_admin());
--> statement-breakpoint

-- ============================================================================
-- 4. PRODUCTS, CATEGORIES, BRANDS POLICIES
-- ============================================================================
-- Public can read active products; Staff/Admin can read all
DROP POLICY IF EXISTS "products_select_policy" ON "products";
--> statement-breakpoint
CREATE POLICY "products_select_policy" ON "products"
  FOR SELECT
  USING (
    status = 'active'
    OR public.is_staff_or_admin()
  );
--> statement-breakpoint

DROP POLICY IF EXISTS "products_mutation_policy" ON "products";
--> statement-breakpoint
CREATE POLICY "products_mutation_policy" ON "products"
  FOR ALL
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());
--> statement-breakpoint

-- Categories: Public can read active; Staff/Admin full access
DROP POLICY IF EXISTS "categories_select_policy" ON "categories";
--> statement-breakpoint
CREATE POLICY "categories_select_policy" ON "categories"
  FOR SELECT
  USING (
    is_active = true
    OR public.is_staff_or_admin()
  );
--> statement-breakpoint

DROP POLICY IF EXISTS "categories_mutation_policy" ON "categories";
--> statement-breakpoint
CREATE POLICY "categories_mutation_policy" ON "categories"
  FOR ALL
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());
--> statement-breakpoint

-- Brands: Public can read active; Staff/Admin full access
DROP POLICY IF EXISTS "brands_select_policy" ON "brands";
--> statement-breakpoint
CREATE POLICY "brands_select_policy" ON "brands"
  FOR SELECT
  USING (
    is_active = true
    OR public.is_staff_or_admin()
  );
--> statement-breakpoint

DROP POLICY IF EXISTS "brands_mutation_policy" ON "brands";
--> statement-breakpoint
CREATE POLICY "brands_mutation_policy" ON "brands"
  FOR ALL
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());
--> statement-breakpoint

-- Product Variants: Public can read active; Staff/Admin full access
DROP POLICY IF EXISTS "product_variants_select_policy" ON "product_variants";
--> statement-breakpoint
CREATE POLICY "product_variants_select_policy" ON "product_variants"
  FOR SELECT
  USING (
    is_active = true
    OR public.is_staff_or_admin()
  );
--> statement-breakpoint

DROP POLICY IF EXISTS "product_variants_mutation_policy" ON "product_variants";
--> statement-breakpoint
CREATE POLICY "product_variants_mutation_policy" ON "product_variants"
  FOR ALL
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());
--> statement-breakpoint

-- Product Images & Categories Links: Public read, Staff/Admin mutation
DROP POLICY IF EXISTS "product_images_select_policy" ON "product_images";
--> statement-breakpoint
CREATE POLICY "product_images_select_policy" ON "product_images"
  FOR SELECT
  USING (true);
--> statement-breakpoint

DROP POLICY IF EXISTS "product_images_mutation_policy" ON "product_images";
--> statement-breakpoint
CREATE POLICY "product_images_mutation_policy" ON "product_images"
  FOR ALL
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());
--> statement-breakpoint

DROP POLICY IF EXISTS "product_categories_select_policy" ON "product_categories";
--> statement-breakpoint
CREATE POLICY "product_categories_select_policy" ON "product_categories"
  FOR SELECT
  USING (true);
--> statement-breakpoint

DROP POLICY IF EXISTS "product_categories_mutation_policy" ON "product_categories";
--> statement-breakpoint
CREATE POLICY "product_categories_mutation_policy" ON "product_categories"
  FOR ALL
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());
--> statement-breakpoint

-- ============================================================================
-- 5. ORDERS & ORDER DATA POLICIES (User isolation + Admin access)
-- ============================================================================
-- Orders: Authenticated user can read own orders, Admin/Staff can read all
DROP POLICY IF EXISTS "orders_select_policy" ON "orders";
--> statement-breakpoint
CREATE POLICY "orders_select_policy" ON "orders"
  FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND customer_id = auth.uid()::text)
    OR public.is_staff_or_admin()
  );
--> statement-breakpoint

-- Orders: Anyone (including guest checkout) can insert an order, authenticated user must match customer_id if set
DROP POLICY IF EXISTS "orders_insert_policy" ON "orders";
--> statement-breakpoint
CREATE POLICY "orders_insert_policy" ON "orders"
  FOR INSERT
  WITH CHECK (
    customer_id IS NULL
    OR (auth.uid() IS NOT NULL AND customer_id = auth.uid()::text)
    OR public.is_staff_or_admin()
  );
--> statement-breakpoint

-- Orders: Only Staff/Admin can update or cancel orders in DB
DROP POLICY IF EXISTS "orders_update_policy" ON "orders";
--> statement-breakpoint
CREATE POLICY "orders_update_policy" ON "orders"
  FOR UPDATE
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());
--> statement-breakpoint

-- Orders: Only Admin can delete orders
DROP POLICY IF EXISTS "orders_delete_policy" ON "orders";
--> statement-breakpoint
CREATE POLICY "orders_delete_policy" ON "orders"
  FOR DELETE
  USING (public.is_admin());
--> statement-breakpoint

-- Order Line Items: Visible to order owner or Staff/Admin
DROP POLICY IF EXISTS "order_line_items_select_policy" ON "order_line_items";
--> statement-breakpoint
CREATE POLICY "order_line_items_select_policy" ON "order_line_items"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_line_items.order_id
        AND (
          (auth.uid() IS NOT NULL AND orders.customer_id = auth.uid()::text)
          OR public.is_staff_or_admin()
        )
    )
  );
--> statement-breakpoint

DROP POLICY IF EXISTS "order_line_items_insert_policy" ON "order_line_items";
--> statement-breakpoint
CREATE POLICY "order_line_items_insert_policy" ON "order_line_items"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_line_items.order_id
        AND (
          orders.customer_id IS NULL
          OR (auth.uid() IS NOT NULL AND orders.customer_id = auth.uid()::text)
          OR public.is_staff_or_admin()
        )
    )
  );
--> statement-breakpoint

DROP POLICY IF EXISTS "order_line_items_mutation_policy" ON "order_line_items";
--> statement-breakpoint
CREATE POLICY "order_line_items_mutation_policy" ON "order_line_items"
  FOR UPDATE
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());
--> statement-breakpoint

-- Order Status History: Visible to order owner or Staff/Admin, insertable by Staff/Admin
DROP POLICY IF EXISTS "order_status_history_select_policy" ON "order_status_history";
--> statement-breakpoint
CREATE POLICY "order_status_history_select_policy" ON "order_status_history"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_status_history.order_id
        AND (
          (auth.uid() IS NOT NULL AND orders.customer_id = auth.uid()::text)
          OR public.is_staff_or_admin()
        )
    )
  );
--> statement-breakpoint

DROP POLICY IF EXISTS "order_status_history_insert_policy" ON "order_status_history";
--> statement-breakpoint
CREATE POLICY "order_status_history_insert_policy" ON "order_status_history"
  FOR INSERT
  WITH CHECK (
    public.is_staff_or_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_status_history.order_id
        AND orders.status = 'pending'
    )
  );
--> statement-breakpoint

-- Payment Records: Visible to order owner or Staff/Admin
DROP POLICY IF EXISTS "payment_records_select_policy" ON "payment_records";
--> statement-breakpoint
CREATE POLICY "payment_records_select_policy" ON "payment_records"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payment_records.order_id
        AND (
          (auth.uid() IS NOT NULL AND orders.customer_id = auth.uid()::text)
          OR public.is_staff_or_admin()
        )
    )
  );
--> statement-breakpoint

DROP POLICY IF EXISTS "payment_records_mutation_policy" ON "payment_records";
--> statement-breakpoint
CREATE POLICY "payment_records_mutation_policy" ON "payment_records"
  FOR ALL
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());
--> statement-breakpoint

-- ============================================================================
-- 6. MEDIA, SITE SETTINGS & HERO SETTINGS POLICIES
-- ============================================================================
-- Media files: Public read, Staff/Admin mutation
DROP POLICY IF EXISTS "media_files_select_policy" ON "media_files";
--> statement-breakpoint
CREATE POLICY "media_files_select_policy" ON "media_files"
  FOR SELECT
  USING (true);
--> statement-breakpoint

DROP POLICY IF EXISTS "media_files_mutation_policy" ON "media_files";
--> statement-breakpoint
CREATE POLICY "media_files_mutation_policy" ON "media_files"
  FOR ALL
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());
--> statement-breakpoint

-- Site Settings: Public read, Admin mutation
DROP POLICY IF EXISTS "site_settings_select_policy" ON "site_settings";
--> statement-breakpoint
CREATE POLICY "site_settings_select_policy" ON "site_settings"
  FOR SELECT
  USING (true);
--> statement-breakpoint

DROP POLICY IF EXISTS "site_settings_mutation_policy" ON "site_settings";
--> statement-breakpoint
CREATE POLICY "site_settings_mutation_policy" ON "site_settings"
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
--> statement-breakpoint

-- Hero Settings: Public read enabled, Admin full access
DROP POLICY IF EXISTS "hero_settings_select_policy" ON "hero_settings";
--> statement-breakpoint
CREATE POLICY "hero_settings_select_policy" ON "hero_settings"
  FOR SELECT
  USING (
    is_enabled = true
    OR public.is_staff_or_admin()
  );
--> statement-breakpoint

DROP POLICY IF EXISTS "hero_settings_mutation_policy" ON "hero_settings";
--> statement-breakpoint
CREATE POLICY "hero_settings_mutation_policy" ON "hero_settings"
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
