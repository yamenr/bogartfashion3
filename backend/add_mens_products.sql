-- Add comprehensive men's fashion products for each category
-- This script adds 3 products for each of the 6 categories

-- Clear existing products first
DELETE FROM products;

-- Reset auto-increment
ALTER TABLE products AUTO_INCREMENT = 1;

-- Category 1: Men Clothing (3 products)
INSERT INTO products (name, description, image, price, stock, supplier_id, category_id, size, color, material, brand, season, gender) VALUES
('Classic White T-Shirt', 'Premium cotton t-shirt with modern fit and comfort', '/uploads/mens-clothing/white-tshirt.jpg', 29.99, 50, 1, 1, 'M', 'White', 'Cotton', 'Bogart', 'All Season', 'Men'),
('Denim Jacket', 'Classic denim jacket with vintage styling and modern comfort', '/uploads/mens-clothing/denim-jacket.jpg', 79.99, 25, 1, 1, 'L', 'Blue', 'Denim', 'Bogart', 'Spring', 'Men'),
('Polo Shirt', 'Elegant polo shirt perfect for casual and semi-formal occasions', '/uploads/mens-clothing/polo-shirt.jpg', 45.99, 30, 1, 1, 'XL', 'Navy', 'Cotton', 'Bogart', 'All Season', 'Men');

-- Category 4: Accessories (3 products)
INSERT INTO products (name, description, image, price, stock, supplier_id, category_id, size, color, material, brand, season, gender) VALUES
('Leather Belt', 'Premium leather belt with classic buckle design', '/uploads/accessories/leather-belt.jpg', 39.99, 40, 1, 4, 'L', 'Brown', 'Leather', 'Bogart', 'All Season', 'Men'),
('Silk Tie', 'Elegant silk tie perfect for formal occasions', '/uploads/accessories/silk-tie.jpg', 59.99, 25, 1, 4, 'One Size', 'Red', 'Silk', 'Bogart', 'All Season', 'Men'),
('Leather Wallet', 'Classic leather wallet with multiple card slots', '/uploads/accessories/leather-wallet.jpg', 49.99, 35, 1, 4, 'One Size', 'Black', 'Leather', 'Bogart', 'All Season', 'Men');

-- Category 5: Footwear (3 products)
INSERT INTO products (name, description, image, price, stock, supplier_id, category_id, size, color, material, brand, season, gender) VALUES
('Classic Oxford Shoes', 'Timeless Oxford shoes perfect for formal occasions', '/uploads/footwear/oxford-shoes.jpg', 129.99, 20, 1, 5, '42', 'Black', 'Leather', 'Bogart', 'All Season', 'Men'),
('Casual Sneakers', 'Comfortable casual sneakers for everyday wear', '/uploads/footwear/casual-sneakers.jpg', 89.99, 30, 1, 5, '43', 'White', 'Canvas', 'Bogart', 'All Season', 'Men'),
('Leather Boots', 'Stylish leather boots for autumn and winter', '/uploads/footwear/leather-boots.jpg', 149.99, 15, 1, 5, '44', 'Brown', 'Leather', 'Bogart', 'Winter', 'Men');

-- Category 8: Watches (3 products)
INSERT INTO products (name, description, image, price, stock, supplier_id, category_id, size, color, material, brand, season, gender) VALUES
('Classic Analog Watch', 'Elegant analog watch with leather strap', '/uploads/watches/analog-watch.jpg', 199.99, 10, 1, 8, 'One Size', 'Silver', 'Stainless Steel', 'Bogart', 'All Season', 'Men'),
('Digital Sports Watch', 'Modern digital watch with multiple functions', '/uploads/watches/digital-watch.jpg', 159.99, 15, 1, 8, 'One Size', 'Black', 'Plastic', 'Bogart', 'All Season', 'Men'),
('Luxury Chronograph', 'Premium chronograph watch with premium finish', '/uploads/watches/chronograph-watch.jpg', 399.99, 5, 1, 8, 'One Size', 'Gold', 'Stainless Steel', 'Bogart', 'All Season', 'Men');

-- Category 9: Sportswear (3 products)
INSERT INTO products (name, description, image, price, stock, supplier_id, category_id, size, color, material, brand, season, gender) VALUES
('Athletic Shorts', 'Comfortable athletic shorts for sports and workouts', '/uploads/sportswear/athletic-shorts.jpg', 34.99, 40, 1, 9, 'M', 'Gray', 'Polyester', 'Bogart', 'All Season', 'Men'),
('Sports Jersey', 'Breathable sports jersey for team sports', '/uploads/sportswear/sports-jersey.jpg', 49.99, 25, 1, 9, 'L', 'Blue', 'Polyester', 'Bogart', 'All Season', 'Men'),
('Training Pants', 'Flexible training pants for gym and outdoor activities', '/uploads/sportswear/training-pants.jpg', 64.99, 30, 1, 9, 'XL', 'Black', 'Cotton Blend', 'Bogart', 'All Season', 'Men');

-- Category 10: Formal Wear (3 products)
INSERT INTO products (name, description, image, price, stock, supplier_id, category_id, size, color, material, brand, season, gender) VALUES
('Premium Black Suit', 'Elegant black suit for formal occasions', '/uploads/formal-wear/black-suit.jpg', 299.99, 15, 1, 10, 'L', 'Black', 'Wool', 'Bogart', 'All Season', 'Men'),
('Navy Blazer', 'Classic navy blazer perfect for business meetings', '/uploads/formal-wear/navy-blazer.jpg', 189.99, 20, 1, 10, 'M', 'Navy', 'Wool', 'Bogart', 'All Season', 'Men'),
('White Dress Shirt', 'Crisp white dress shirt for formal attire', '/uploads/formal-wear/white-dress-shirt.jpg', 79.99, 35, 1, 10, 'XL', 'White', 'Cotton', 'Bogart', 'All Season', 'Men');

-- Show final result
SELECT 'Total products added:' as info;
SELECT COUNT(*) as total_products FROM products;

SELECT 'Products by category:' as info;
SELECT c.name as category, COUNT(p.product_id) as product_count 
FROM categories c 
LEFT JOIN products p ON c.category_id = p.category_id 
GROUP BY c.category_id, c.name 
ORDER BY c.category_id;
