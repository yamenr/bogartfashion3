-- Update all product images with appropriate fashion-related image paths
-- This script updates the image field for all products in the men's fashion store

-- Men Clothing Category
UPDATE products SET image = '/uploads/mens-clothing/white-tshirt.jpg' WHERE name = 'Classic White T-Shirt';
UPDATE products SET image = '/uploads/mens-clothing/denim-jacket.jpg' WHERE name = 'Denim Jacket';
UPDATE products SET image = '/uploads/mens-clothing/polo-shirt.jpg' WHERE name = 'Polo Shirt';

-- Accessories Category
UPDATE products SET image = '/uploads/accessories/leather-belt.jpg' WHERE name = 'Leather Belt';
UPDATE products SET image = '/uploads/accessories/silk-tie.jpg' WHERE name = 'Silk Tie';
UPDATE products SET image = '/uploads/accessories/leather-wallet.jpg' WHERE name = 'Leather Wallet';

-- Footwear Category
UPDATE products SET image = '/uploads/footwear/oxford-shoes.jpg' WHERE name = 'Classic Oxford Shoes';
UPDATE products SET image = '/uploads/footwear/casual-sneakers.jpg' WHERE name = 'Casual Sneakers';
UPDATE products SET image = '/uploads/footwear/leather-boots.jpg' WHERE name = 'Leather Boots';

-- Watches Category
UPDATE products SET image = '/uploads/watches/analog-watch.jpg' WHERE name = 'Classic Analog Watch';
UPDATE products SET image = '/uploads/watches/digital-watch.jpg' WHERE name = 'Digital Sports Watch';

-- Sportswear Category
UPDATE products SET image = '/uploads/sportswear/athletic-shorts.jpg' WHERE name = 'Athletic Shorts';
UPDATE products SET image = '/uploads/sportswear/sports-jersey.jpg' WHERE name = 'Sports Jersey';

-- Formal Wear Category
UPDATE products SET image = '/uploads/formal-wear/black-suit.jpg' WHERE name = 'Premium Black Suit';
UPDATE products SET image = '/uploads/formal-wear/navy-blazer.jpg' WHERE name = 'Navy Blazer';
UPDATE products SET image = '/uploads/formal-wear/white-dress-shirt.jpg' WHERE name = 'White Dress Shirt';

-- Show updated products with images
SELECT 'Updated Products with Images:' as info;
SELECT product_id, name, category_id, image FROM products ORDER BY category_id, name;
