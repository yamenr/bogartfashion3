-- Remove categories not suitable for men's fashion store
-- This script removes Women, Kids, Bags, and Jewelry categories

-- First, let's see what categories we have
SELECT * FROM categories;

-- Remove categories not suitable for men
DELETE FROM categories WHERE category_id IN (2, 3, 6, 7);

-- Show remaining categories
SELECT * FROM categories;

-- Note: This will also remove any products associated with these categories
-- You may want to update or remove products in these categories first
