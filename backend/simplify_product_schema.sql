-- Simplify Product Schema - Remove unnecessary fields
-- Keep only: Size, Color, Quantity (stock), Brand (Bogart), Supplier, Gender
-- Remove: Material, Season, and other extras

-- First, backup current data
CREATE TABLE products_backup AS SELECT * FROM products;

-- Update existing products to set brand to 'Bogart' for all products
UPDATE products SET brand = 'Bogart' WHERE brand IS NULL OR brand = '';

-- Remove unnecessary columns from products table
ALTER TABLE products 
DROP COLUMN material,
DROP COLUMN season;

-- Verify the simplified schema
DESCRIBE products;

-- Show sample data to confirm changes
SELECT product_id, name, size, color, stock, brand, supplier_id, gender 
FROM products 
LIMIT 5;
