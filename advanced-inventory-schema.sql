-- Advanced Inventory Management System Schema
-- This is developed in parallel and does NOT affect the current system
-- Run this separately to create new tables for advanced inventory

USE bogartfashion2;

-- =====================================================
-- NEW TABLES FOR ADVANCED INVENTORY SYSTEM
-- =====================================================

-- 1. PRODUCT VARIANTS TABLE
-- Stores different variations of the same product (color, size, material, etc.)
CREATE TABLE IF NOT EXISTS `product_variants` (
  `variant_id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `color` varchar(50) NOT NULL,
  `size` varchar(20) NOT NULL,
  `material` varchar(100) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `sku` varchar(100) UNIQUE DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`variant_id`),
  KEY `product_id` (`product_id`),
  KEY `sku` (`sku`),
  CONSTRAINT `fk_variants_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. LOCATIONS TABLE
-- Stores different locations where inventory can be stored
CREATE TABLE IF NOT EXISTS `locations` (
  `location_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `type` enum('warehouse','store','online','supplier') NOT NULL DEFAULT 'warehouse',
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`location_id`),
  KEY `type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. INVENTORY ITEMS TABLE
-- Stores individual inventory items with their specific details
CREATE TABLE IF NOT EXISTS `inventory_items` (
  `item_id` int(11) NOT NULL AUTO_INCREMENT,
  `variant_id` int(11) NOT NULL,
  `location_id` int(11) NOT NULL,
  `serial_number` varchar(100) UNIQUE DEFAULT NULL,
  `status` enum('available','reserved','sold','damaged','returned') NOT NULL DEFAULT 'available',
  `condition` enum('new','like_new','good','fair','poor') NOT NULL DEFAULT 'new',
  `purchase_cost` decimal(10,2) DEFAULT NULL,
  `supplier_batch` varchar(100) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`item_id`),
  KEY `variant_id` (`variant_id`),
  KEY `location_id` (`location_id`),
  KEY `status` (`status`),
  KEY `serial_number` (`serial_number`),
  CONSTRAINT `fk_inventory_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`variant_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inventory_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`location_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4. INVENTORY TRANSACTIONS TABLE
-- Tracks all inventory movements (in, out, transfers, adjustments)
CREATE TABLE IF NOT EXISTS `inventory_transactions` (
  `transaction_id` int(11) NOT NULL AUTO_INCREMENT,
  `item_id` int(11) NOT NULL,
  `transaction_type` enum('in','out','transfer','adjustment','return','damage') NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `from_location_id` int(11) DEFAULT NULL,
  `to_location_id` int(11) DEFAULT NULL,
  `reference_type` enum('order','purchase','transfer','adjustment','return') DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `performed_by` int(11) DEFAULT NULL,
  `transaction_date` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`transaction_id`),
  KEY `item_id` (`item_id`),
  KEY `transaction_type` (`transaction_type`),
  KEY `from_location_id` (`from_location_id`),
  KEY `to_location_id` (`to_location_id`),
  KEY `performed_by` (`performed_by`),
  CONSTRAINT `fk_transaction_item` FOREIGN KEY (`item_id`) REFERENCES `inventory_items` (`item_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_transaction_from_location` FOREIGN KEY (`from_location_id`) REFERENCES `locations` (`location_id`),
  CONSTRAINT `fk_transaction_to_location` FOREIGN KEY (`to_location_id`) REFERENCES `locations` (`location_id`),
  CONSTRAINT `fk_transaction_user` FOREIGN KEY (`performed_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample locations
INSERT INTO `locations` (`name`, `type`, `city`, `country`) VALUES
('Main Warehouse', 'warehouse', 'Tel Aviv', 'Israel'),
('Downtown Store', 'store', 'Tel Aviv', 'Israel'),
('Online Fulfillment', 'online', 'Tel Aviv', 'Israel'),
('Supplier Storage', 'supplier', 'Istanbul', 'Turkey');

-- Insert sample product variants (for existing products)
INSERT INTO `product_variants` (`product_id`, `color`, `size`, `material`, `price`, `sku`) VALUES
(3, 'Blue', 'S', 'Denim', 79.99, 'DJ-BLU-S'),
(3, 'Blue', 'M', 'Denim', 79.99, 'DJ-BLU-M'),
(3, 'Blue', 'L', 'Denim', 79.99, 'DJ-BLU-L'),
(3, 'Blue', 'XL', 'Denim', 79.99, 'DJ-BLU-XL'),
(3, 'Black', 'M', 'Denim', 79.99, 'DJ-BLK-M'),
(3, 'Black', 'L', 'Denim', 79.99, 'DJ-BLK-L');

-- Insert sample inventory items
INSERT INTO `inventory_items` (`variant_id`, `location_id`, `status`, `condition`) VALUES
(1, 1, 'available', 'new'), -- Blue S at Main Warehouse
(1, 1, 'available', 'new'),
(2, 1, 'available', 'new'), -- Blue M at Main Warehouse
(2, 1, 'available', 'new'),
(2, 2, 'available', 'new'), -- Blue M at Downtown Store
(3, 1, 'available', 'new'), -- Blue L at Main Warehouse
(4, 1, 'available', 'new'), -- Blue XL at Main Warehouse
(5, 2, 'available', 'new'), -- Black M at Downtown Store
(6, 2, 'available', 'new'); -- Black L at Downtown Store

-- =====================================================
-- VIEWS FOR EASY QUERYING
-- =====================================================

-- View: Current inventory levels by variant and location
CREATE OR REPLACE VIEW `inventory_summary` AS
SELECT 
    p.name as product_name,
    pv.color,
    pv.size,
    pv.material,
    pv.price,
    pv.sku,
    l.name as location_name,
    l.type as location_type,
    COUNT(CASE WHEN ii.status = 'available' THEN 1 END) as available_count,
    COUNT(CASE WHEN ii.status = 'reserved' THEN 1 END) as reserved_count,
    COUNT(CASE WHEN ii.status = 'sold' THEN 1 END) as sold_count,
    COUNT(*) as total_count
FROM product_variants pv
JOIN products p ON pv.product_id = p.product_id
JOIN inventory_items ii ON pv.variant_id = ii.variant_id
JOIN locations l ON ii.location_id = l.location_id
WHERE pv.is_active = 1 AND l.is_active = 1
GROUP BY pv.variant_id, l.location_id
ORDER BY p.name, pv.color, pv.size, l.name;

-- View: Low stock alerts (variants with less than 5 items available)
CREATE OR REPLACE VIEW `low_stock_alerts` AS
SELECT 
    p.name as product_name,
    pv.color,
    pv.size,
    pv.sku,
    l.name as location_name,
    COUNT(CASE WHEN ii.status = 'available' THEN 1 END) as available_count
FROM product_variants pv
JOIN products p ON pv.product_id = p.product_id
JOIN inventory_items ii ON pv.variant_id = ii.variant_id
JOIN locations l ON ii.location_id = l.location_id
WHERE pv.is_active = 1 AND l.is_active = 1
GROUP BY pv.variant_id, l.location_id
HAVING available_count < 5
ORDER BY available_count ASC;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Additional indexes for better performance
CREATE INDEX idx_variants_product_color_size ON product_variants(product_id, color, size);
CREATE INDEX idx_inventory_variant_status ON inventory_items(variant_id, status);
CREATE INDEX idx_inventory_location_status ON inventory_items(location_id, status);
CREATE INDEX idx_transactions_date ON inventory_transactions(transaction_date);
CREATE INDEX idx_transactions_type ON inventory_transactions(transaction_type);

-- =====================================================
-- COMMENTS
-- =====================================================

-- This schema provides:
-- 1. Product variants with different colors, sizes, materials, and prices
-- 2. Multiple locations for inventory storage
-- 3. Individual item tracking with serial numbers
-- 4. Complete transaction history
-- 5. Stock levels per variant per location
-- 6. Low stock alerts and inventory summaries
-- 7. No impact on existing products, orders, or users tables

-- To use this system:
-- 1. Run this script to create new tables
-- 2. Test with sample data
-- 3. Build new APIs for variant management
-- 4. Create new admin interfaces
-- 5. Only integrate with existing system after thorough testing
