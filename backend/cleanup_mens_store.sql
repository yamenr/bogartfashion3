-- Cleanup script for Bogart Fashion - Convert to Men's Fashion Store Only
-- This script removes categories and products not suitable for men's fashion

-- Step 1: Check current state
SELECT 'Current categories:' as info;
SELECT * FROM categories;

SELECT 'Products in categories to be removed:' as info;
SELECT p.product_id, p.name, p.category_id, c.name as category_name 
FROM products p 
JOIN categories c ON p.category_id = c.category_id 
WHERE p.category_id IN (2, 3, 6, 7);

-- Step 2: Remove products in unsuitable categories
DELETE FROM products WHERE category_id IN (2, 3, 6, 7);

-- Step 3: Remove unsuitable categories
DELETE FROM categories WHERE category_id IN (2, 3, 6, 7);

-- Step 4: Show final state
SELECT 'Remaining categories (Men\'s Fashion Only):' as info;
SELECT * FROM categories;

SELECT 'Remaining products:' as info;
SELECT p.product_id, p.name, p.category_id, c.name as category_name 
FROM products p 
JOIN categories c ON p.category_id = c.category_id;

-- Step 5: Update remaining categories to be more men-focused
UPDATE categories SET name = 'Men\'s Clothing' WHERE category_id = 1;
UPDATE categories SET name = 'Men\'s Accessories' WHERE category_id = 4;
UPDATE categories SET name = 'Men\'s Footwear' WHERE category_id = 5;
UPDATE categories SET name = 'Men\'s Watches' WHERE category_id = 8;
UPDATE categories SET name = 'Men\'s Sportswear' WHERE category_id = 9;
UPDATE categories SET name = 'Men\'s Formal Wear' WHERE category_id = 10;

-- Step 6: Show final updated categories
SELECT 'Final updated categories:' as info;
SELECT * FROM categories;
