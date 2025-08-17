-- Simple Advanced Inventory Management System Schema
-- This is developed in parallel and does NOT affect the current system

USE bogartfashion2;

-- =====================================================
-- STEP 1: Create locations table first
-- =====================================================

CREATE TABLE IF NOT EXISTS `locations` (
  `location_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `type` varchar(50) NOT NULL DEFAULT 'warehouse',
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`location_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- STEP 2: Create product variants table
-- =====================================================

CREATE TABLE IF NOT EXISTS `product_variants` (
  `variant_id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `variant_name` varchar(100) NOT NULL,
  `variant_sku` varchar(100) DEFAULT NULL,
  `variant_price` decimal(10,2) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`variant_id`),
  KEY `product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- STEP 3: Create inventory items table
-- =====================================================

CREATE TABLE IF NOT EXISTS `inventory_items` (
  `item_id` int(11) NOT NULL AUTO_INCREMENT,
  `variant_id` int(11) NOT NULL,
  `location_id` int(11) NOT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'available',
  `condition` varchar(50) NOT NULL DEFAULT 'new',
  `purchase_cost` decimal(10,2) DEFAULT NULL,
  `supplier_batch` varchar(100) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`item_id`),
  KEY `variant_id` (`variant_id`),
  KEY `location_id` (`location_id`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- STEP 4: Create inventory transactions table
-- =====================================================

CREATE TABLE IF NOT EXISTS `inventory_transactions` (
  `transaction_id` int(11) NOT NULL AUTO_INCREMENT,
  `item_id` int(11) NOT NULL,
  `transaction_type` varchar(50) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `from_location_id` int(11) DEFAULT NULL,
  `to_location_id` int(11) DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `performed_by` int(11) DEFAULT NULL,
  `transaction_date` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`transaction_id`),
  KEY `item_id` (`item_id`),
  KEY `transaction_type` (`transaction_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- STEP 5: Add sample data
-- =====================================================

-- Insert sample locations
INSERT INTO `locations` (`name`, `type`, `city`, `country`) VALUES
('Main Warehouse', 'warehouse', 'Tel Aviv', 'Israel'),
('Downtown Store', 'store', 'Tel Aviv', 'Israel'),
('Online Fulfillment', 'online', 'Tel Aviv', 'Israel');

-- Insert sample product variants
INSERT INTO `product_variants` (`product_id`, `variant_name`, `variant_sku`, `variant_price`) VALUES
(3, 'Blue Denim Jacket - Size S', 'DJ-BLU-S', 79.99),
(3, 'Blue Denim Jacket - Size M', 'DJ-BLU-M', 79.99),
(3, 'Blue Denim Jacket - Size L', 'DJ-BLU-L', 79.99);

-- Insert sample inventory items
INSERT INTO `inventory_items` (`variant_id`, `location_id`, `status`, `condition`) VALUES
(1, 1, 'available', 'new'),
(1, 1, 'available', 'new'),
(2, 1, 'available', 'new'),
(2, 2, 'available', 'new'),
(3, 1, 'available', 'new');

-- =====================================================
-- STEP 6: Create simple views
-- =====================================================

-- View: Current inventory levels
CREATE OR REPLACE VIEW `inventory_summary` AS
SELECT 
    p.name as product_name,
    pv.variant_name,
    pv.variant_sku,
    pv.variant_price,
    l.name as location_name,
    l.type as location_type,
    COUNT(ii.item_id) as total_items,
    COUNT(CASE WHEN ii.status = 'available' THEN 1 END) as available_count
FROM product_variants pv
JOIN products p ON pv.product_id = p.product_id
JOIN inventory_items ii ON pv.variant_id = ii.variant_id
JOIN locations l ON ii.location_id = l.location_id
WHERE pv.is_active = 1 AND l.is_active = 1
GROUP BY pv.variant_id, l.location_id
ORDER BY p.name, pv.variant_name, l.name;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Advanced Inventory System Created Successfully!' as status;
SELECT COUNT(*) as locations_count FROM locations;
SELECT COUNT(*) as variants_count FROM product_variants;
SELECT COUNT(*) as items_count FROM inventory_items;
