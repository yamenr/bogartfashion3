# Product Schema Simplification

## Changes Made

### 1. Database Schema Updates
- **Removed fields:** `material`, `season`
- **Kept fields:** `size`, `color`, `stock` (as quantity), `brand`, `supplier_id`, `gender`
- **Brand:** All products now use "Bogart" as the brand

### 2. Frontend Updates
- **ProductDetails.jsx:** Removed material and season display, added quantity and supplier
- **ProductsPage.jsx:** Removed material filter from sidebar and filtering logic
- **Backend routes:** Updated INSERT and UPDATE queries to exclude material and season

### 3. Files Modified
- `frontend/src/pages/ProductDetails.jsx`
- `frontend/src/pages/ProductsPage.jsx`
- `backend/src/routes/products.js`
- `backend/simplify_product_schema.sql` (SQL script to run)

## To Apply Database Changes

Run the SQL script in your MySQL database:

```sql
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
```

## Result
Products now show only essential information:
- ✅ Size
- ✅ Color  
- ✅ Quantity (stock)
- ✅ Brand (Bogart)
- ✅ Supplier
- ✅ Gender

- ❌ Material (removed)
- ❌ Season (removed)
