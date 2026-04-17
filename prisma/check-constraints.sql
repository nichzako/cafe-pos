-- CHECK CONSTRAINTS for Cafe POS
-- Prisma does not support CHECK constraints in schema.prisma DSL.
-- Apply these constraints in the first migration after `prisma migrate dev`.
--
-- Run via Supabase SQL editor or append to the generated migration file.

ALTER TABLE menus
  ADD CONSTRAINT menus_price_positive CHECK (price > 0);

ALTER TABLE orders
  ADD CONSTRAINT orders_subtotal_non_negative CHECK (subtotal >= 0),
  ADD CONSTRAINT orders_discount_non_negative CHECK (discount >= 0),
  ADD CONSTRAINT orders_total_non_negative    CHECK (total >= 0),
  ADD CONSTRAINT orders_total_gte_discount    CHECK (total >= 0 AND discount <= subtotal);

ALTER TABLE order_items
  ADD CONSTRAINT order_items_quantity_positive   CHECK (quantity > 0),
  ADD CONSTRAINT order_items_menu_price_positive CHECK ("menuPrice" > 0),
  ADD CONSTRAINT order_items_line_total_positive CHECK ("lineTotal" > 0);

ALTER TABLE payments
  ADD CONSTRAINT payments_amount_positive CHECK (amount > 0);
