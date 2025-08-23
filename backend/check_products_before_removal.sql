-- Check products in categories before removing them
-- This helps identify what needs to be handled before category removal

-- Check products in Women category (category_id = 2)
SELECT p.product_id, p.name, p.category_id, c.name as category_name 
FROM products p 
JOIN categories c ON p.category_id = c.category_id 
WHERE p.category_id = 2;

-- Check products in Kids category (category_id = 3)
SELECT p.product_id, p.name, p.category_id, c.name as category_name 
FROM products p 
JOIN categories c ON p.category_id = c.category_id 
WHERE p.category_id = 3;

-- Check products in Bags category (category_id = 6)
SELECT p.product_id, p.name, p.category_id, c.name as category_name 
FROM products p 
JOIN categories c ON p.category_id = c.category_id 
WHERE p.category_id = 6;

-- Check products in Jewelry category (category_id = 7)
SELECT p.product_id, p.name, p.category_id, c.name as category_name 
FROM products p 
JOIN categories c ON p.category_id = c.category_id 
WHERE p.category_id = 7;

-- Total count of products in categories to be removed
SELECT COUNT(*) as total_products_to_remove
FROM products 
WHERE category_id IN (2, 3, 6, 7);
