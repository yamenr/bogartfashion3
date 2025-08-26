-- Setup Test Product with Hierarchical Variants
-- This script will create a test product and link it to the attribute system

START TRANSACTION;

-- 1. Create a test product (if it doesn't exist)
INSERT IGNORE INTO products (product_id, name, description, image, price, stock, supplier_id, category_id, size, color, material, brand, season, gender)
VALUES (999, 'Test Hierarchical T-Shirt', 'A test product for the new hierarchical variant system', '/uploads/test-tshirt.jpg', 29.99, 100, 1, 1, NULL, NULL, 'Cotton', 'Bogart', 'All Season', 'Men');

-- 2. Assign Color and Size attributes to this product
INSERT IGNORE INTO product_attribute_options (product_id, attribute_id, display_order, is_required)
VALUES 
  (999, 1, 1, 1),  -- Color (first)
  (999, 2, 2, 1);  -- Size (second)

-- 3. Create variants for different combinations
INSERT IGNORE INTO product_variants (variant_id, product_id, variant_name, variant_sku, variant_price, is_active)
VALUES 
  (999, 999, 'Red T-Shirt - Size S', 'TS-RED-S', 29.99, 1),
  (998, 999, 'Red T-Shirt - Size M', 'TS-RED-M', 29.99, 1),
  (997, 999, 'Red T-Shirt - Size L', 'TS-RED-L', 29.99, 1),
  (996, 999, 'Blue T-Shirt - Size S', 'TS-BLU-S', 29.99, 1),
  (995, 999, 'Blue T-Shirt - Size M', 'TS-BLU-M', 29.99, 1),
  (994, 999, 'Blue T-Shirt - Size L', 'TS-BLU-L', 29.99, 1),
  (993, 999, 'Black T-Shirt - Size S', 'TS-BLK-S', 29.99, 1),
  (992, 999, 'Black T-Shirt - Size M', 'TS-BLK-M', 29.99, 1),
  (991, 999, 'Black T-Shirt - Size L', 'TS-BLK-L', 29.99, 1);

-- 4. Link variants to their attribute values
-- Red variants
INSERT IGNORE INTO product_variant_attributes (variant_id, attribute_id, value_id)
VALUES 
  (999, 1, 1), (999, 2, 102),  -- Red, S
  (998, 1, 1), (998, 2, 103),  -- Red, M
  (997, 1, 1), (997, 2, 104);  -- Red, L

-- Blue variants
INSERT IGNORE INTO product_variant_attributes (variant_id, attribute_id, value_id)
VALUES 
  (996, 1, 2), (996, 2, 102),  -- Blue, S
  (995, 1, 2), (995, 2, 103),  -- Blue, M
  (994, 1, 2), (994, 2, 104);  -- Blue, L

-- Black variants
INSERT IGNORE INTO product_variant_attributes (variant_id, attribute_id, value_id)
VALUES 
  (993, 1, 3), (993, 2, 102),  -- Black, S
  (992, 1, 3), (992, 2, 103),  -- Black, M
  (991, 1, 3), (991, 2, 104);  -- Black, L

-- 5. Add some inventory items for testing
INSERT IGNORE INTO inventory_items (item_id, variant_id, location_id, status, `condition`, created_at)
VALUES 
  (999, 999, 1, 'available', 'new', NOW()),  -- Red S
  (998, 998, 1, 'available', 'new', NOW()),  -- Red M
  (997, 997, 1, 'available', 'new', NOW()),  -- Red L
  (996, 996, 1, 'available', 'new', NOW()),  -- Blue S
  (995, 995, 1, 'available', 'new', NOW()),  -- Blue M
  (994, 994, 1, 'available', 'new', NOW()),  -- Blue L
  (993, 993, 1, 'available', 'new', NOW()),  -- Black S
  (992, 992, 1, 'available', 'new', NOW()),  -- Black M
  (991, 991, 1, 'available', 'new', NOW());  -- Black L

COMMIT;

-- Verification queries:
-- SELECT * FROM products WHERE product_id = 999;
-- SELECT * FROM product_attribute_options WHERE product_id = 999;
-- SELECT * FROM product_variants WHERE product_id = 999;
-- SELECT * FROM product_variant_attributes WHERE variant_id IN (999, 998, 997, 996, 995, 994, 993, 992, 991);
