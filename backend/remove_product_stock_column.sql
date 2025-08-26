-- Remove redundant stock column from products table
-- In hierarchical variant system, stock is derived from variants

ALTER TABLE products DROP COLUMN stock;

-- Update any existing queries that reference product.stock
-- to use derived stock from variants instead
