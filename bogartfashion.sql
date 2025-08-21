-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 21, 2025 at 12:28 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bogartfashion2`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `category_id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`category_id`, `name`) VALUES
(1, 'Men'),
(2, 'Women'),
(3, 'Kids'),
(4, 'Accessories'),
(5, 'Shoes'),
(6, 'Bags'),
(7, 'Jewelry'),
(8, 'Watches'),
(9, 'Sportswear'),
(10, 'Formal Wear');

-- --------------------------------------------------------

--
-- Table structure for table `contact_messages`
--

CREATE TABLE `contact_messages` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('new','read','replied','archived') DEFAULT 'new'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contact_messages`
--

INSERT INTO `contact_messages` (`id`, `name`, `email`, `message`, `created_at`, `status`) VALUES
(1, 'ggg', 'user1@gmail.com', 'dddd', '2025-08-17 04:59:52', 'new'),
(2, 'ggg', 'user1@gmail.com', 'dfdfdf', '2025-08-17 05:06:02', 'new'),
(3, 'ggg', 'user1@gmail.com', 'ddd', '2025-08-17 05:08:53', 'new'),
(4, 'ggg', 'user1@gmail.com', 'wsfsdfsdf', '2025-08-17 05:38:57', 'new');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_items`
--

CREATE TABLE `inventory_items` (
  `item_id` int(11) NOT NULL,
  `variant_id` int(11) NOT NULL,
  `location_id` int(11) NOT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'available',
  `condition` varchar(50) NOT NULL DEFAULT 'new',
  `purchase_cost` decimal(10,2) DEFAULT NULL,
  `supplier_batch` varchar(100) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory_items`
--

INSERT INTO `inventory_items` (`item_id`, `variant_id`, `location_id`, `serial_number`, `status`, `condition`, `purchase_cost`, `supplier_batch`, `expiry_date`, `notes`, `created_at`) VALUES
(1, 1, 1, NULL, 'available', 'new', NULL, NULL, NULL, NULL, '2025-08-17 15:32:03'),
(2, 1, 1, NULL, 'available', 'new', NULL, NULL, NULL, NULL, '2025-08-17 15:32:03'),
(3, 2, 1, NULL, 'available', 'new', NULL, NULL, NULL, NULL, '2025-08-17 15:32:03'),
(4, 2, 2, NULL, 'available', 'new', NULL, NULL, NULL, NULL, '2025-08-17 15:32:03'),
(5, 3, 1, NULL, 'available', 'new', NULL, NULL, NULL, NULL, '2025-08-17 15:32:03');

-- --------------------------------------------------------

--
-- Stand-in structure for view `inventory_summary`
-- (See below for the actual view)
--
CREATE TABLE `inventory_summary` (
`product_name` varchar(100)
,`variant_name` varchar(100)
,`variant_sku` varchar(100)
,`variant_price` decimal(10,2)
,`location_name` varchar(100)
,`location_type` varchar(50)
,`total_items` bigint(21)
,`available_count` bigint(21)
);

-- --------------------------------------------------------

--
-- Table structure for table `inventory_transactions`
--

CREATE TABLE `inventory_transactions` (
  `transaction_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `transaction_type` varchar(50) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `from_location_id` int(11) DEFAULT NULL,
  `to_location_id` int(11) DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `performed_by` int(11) DEFAULT NULL,
  `transaction_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `locations`
--

CREATE TABLE `locations` (
  `location_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` varchar(50) NOT NULL DEFAULT 'warehouse',
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `locations`
--

INSERT INTO `locations` (`location_id`, `name`, `type`, `address`, `city`, `country`, `is_active`, `created_at`) VALUES
(1, 'Main Warehouse', 'warehouse', NULL, 'Tel Aviv', 'Israel', 1, '2025-08-17 15:32:03'),
(2, 'Downtown Store', 'store', NULL, 'Tel Aviv', 'Israel', 1, '2025-08-17 15:32:03'),
(3, 'Online Fulfillment', 'online', NULL, 'Tel Aviv', 'Israel', 1, '2025-08-17 15:32:03');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `shipping_address` text DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `promotion_id` int(11) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `order_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`order_id`, `user_id`, `total_amount`, `shipping_address`, `payment_method`, `promotion_id`, `status`, `order_date`) VALUES
(1, 2, 79.99, 'Nof HaGalil 22', 'credit_card', NULL, 'pending', '2025-08-17 14:54:08'),
(2, 2, 79.99, 'Nof HaGalil ', 'credit_card', NULL, 'pending', '2025-08-17 14:54:21'),
(3, 2, 79.99, 'Nof HaGalil ', 'credit_card', NULL, 'pending', '2025-08-17 14:56:51'),
(4, 2, 159.98, 'Nof HaGalil 22', 'credit_card', NULL, 'pending', '2025-08-17 14:58:01');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `order_item_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `size` varchar(20) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`order_item_id`, `order_id`, `product_id`, `quantity`, `price`, `size`, `color`) VALUES
(1, 1, 3, 1, 79.99, NULL, NULL),
(2, 2, 3, 1, 79.99, NULL, NULL),
(3, 3, 3, 1, 79.99, NULL, NULL),
(4, 4, 3, 2, 79.99, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `product_id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `stock` int(11) DEFAULT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `size` varchar(20) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `material` varchar(100) DEFAULT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `season` enum('Spring','Summer','Fall','Winter','All Season') DEFAULT 'All Season',
  `gender` enum('Men','Women','Unisex','Kids') DEFAULT 'Unisex'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`product_id`, `name`, `description`, `image`, `price`, `stock`, `supplier_id`, `category_id`, `size`, `color`, `material`, `brand`, `season`, `gender`) VALUES
(1, 'Classic White T-Shirt', 'Premium cotton t-shirt with modern fit', '/uploads/classic-white-tshirt.jpg', 29.99, 50, 1, 1, 'M', 'White', 'Cotton', 'Bogart', 'All Season', 'Men'),
(2, 'Elegant Black Dress', 'Sophisticated black dress for formal occasions', '/uploads/elegant-black-dress.jpg', 89.99, 25, 2, 2, 'L', 'Black', 'Polyester', 'Bogart', 'All Season', 'Women'),
(3, 'Denim Jacket', 'Classic denim jacket with vintage styling', '/uploads/denim-jacket.jpg', 79.99, 25, 1, 1, 'XL', 'Blue', 'Denim', 'Bogart', 'Spring', 'Men'),
(4, 'Summer Floral Dress', 'Light and breezy summer dress with floral pattern', '/uploads/summer-floral-dress.jpg', 65.99, 40, 2, 2, 'S', 'Pink', 'Cotton', 'Bogart', 'Summer', 'Women'),
(5, 'Leather Handbag', 'Premium leather handbag with gold hardware', '/uploads/leather-handbag.jpg', 129.99, 15, 3, 6, 'One Size', 'Brown', 'Leather', 'Bogart', 'All Season', 'Women');

-- --------------------------------------------------------

--
-- Table structure for table `product_variants`
--

CREATE TABLE `product_variants` (
  `variant_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `variant_name` varchar(100) NOT NULL,
  `variant_sku` varchar(100) DEFAULT NULL,
  `variant_price` decimal(10,2) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product_variants`
--

INSERT INTO `product_variants` (`variant_id`, `product_id`, `variant_name`, `variant_sku`, `variant_price`, `is_active`, `created_at`) VALUES
(1, 3, 'Blue Denim Jacket - Size S', 'DJ-BLU-S', 79.99, 1, '2025-08-17 15:32:03'),
(2, 3, 'Blue Denim Jacket - Size M', 'DJ-BLU-M', 79.99, 1, '2025-08-17 15:32:03'),
(3, 3, 'Blue Denim Jacket - Size L', 'DJ-BLU-L', 79.99, 1, '2025-08-17 15:32:03');

-- --------------------------------------------------------

--
-- Table structure for table `promotions`
--

CREATE TABLE `promotions` (
  `promotion_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('percentage','fixed','buy_x_get_y') NOT NULL,
  `value` varchar(50) NOT NULL,
  `min_quantity` int(11) DEFAULT 1,
  `max_quantity` int(11) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `applicable_products` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`applicable_products`)),
  `applicable_categories` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`applicable_categories`)),
  `code` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `promotions`
--

INSERT INTO `promotions` (`promotion_id`, `name`, `description`, `type`, `value`, `min_quantity`, `max_quantity`, `start_date`, `end_date`, `is_active`, `applicable_products`, `applicable_categories`, `code`, `created_at`, `updated_at`) VALUES
(1, 'Summer Fashion Sale 25% Off', 'Get 25% off on all summer collection', 'percentage', '25', 1, NULL, '2024-05-31', '2026-01-30', 1, '[]', '[]', 'SUMMER25', '2025-06-21 06:57:38', '2025-06-21 07:43:12'),
(2, '$20 Off on Orders Over $100', 'Get $20 discount on orders over $100', 'fixed', '20', 1, NULL, '2024-06-01', '2024-12-31', 0, NULL, NULL, 'SAVE20', '2025-06-21 06:57:38', '2025-08-05 21:50:57'),
(3, 'New Collection 15% Off', '15% discount on new arrivals', 'percentage', '15', 1, NULL, '2024-06-01', '2024-12-31', 0, NULL, NULL, 'NEW15', '2025-06-21 06:57:38', '2025-08-05 21:50:57');

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `storeName` varchar(255) NOT NULL DEFAULT 'BogartFashion',
  `contactEmail` varchar(255) NOT NULL DEFAULT 'contact@bogartfashion.com',
  `contactPhone` varchar(50) NOT NULL DEFAULT '+1-555-FASHION',
  `taxRate` decimal(5,2) NOT NULL DEFAULT 18.00,
  `emailNotifications` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `currency` varchar(10) DEFAULT 'USD'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `storeName`, `contactEmail`, `contactPhone`, `taxRate`, `emailNotifications`, `createdAt`, `updatedAt`, `currency`) VALUES
(1, 'BogartFashion', 'contact@bogartfashion.com', '+1-555-FASHION', 18.00, 1, '2025-06-07 04:48:02', '2025-06-22 09:39:08', 'USD');

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `supplier_id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `contact` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`supplier_id`, `name`, `email`, `phone`, `contact`) VALUES
(1, 'Bogart Fashion House', 'supplier@bogartfashion.com', '+1-555-1234', 'John Smith'),
(2, 'Elegant Styles Ltd', 'contact@elegantstyles.com', '+1-555-5678', 'Sarah Johnson'),
(3, 'Premium Accessories Co', 'info@premiumaccessories.com', '+1-555-9012', 'Mike Davis');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `resetPasswordToken` varchar(255) DEFAULT NULL,
  `resetPasswordExpires` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `email`, `phone`, `city`, `profile_image`, `password`, `role`, `created_at`, `resetPasswordToken`, `resetPasswordExpires`) VALUES
(1, 'Yamen Rock', 'yamen.rock@gmail.com', '+972523746547', 'Nof HaGalil', '/uploads/image-1755408848409-855308088.jpg', '$2b$10$tlyty4yLWI57KolR3xp61uAUoPfVddMPP8R.e64G0EumLK/Qgb37C', 'user', '2025-08-06 04:27:47', '0ffcf48252605acfe2019106e9421507dc8c8f1f', 1755411544783),
(2, 'user1 user1', 'user1@gmail.com', NULL, NULL, NULL, '$2b$10$rJ6TYBvpc8T40XX9jl./xeohYV91RDUH4VNPp40SRlsfj06No.xYa', 'user', '2025-08-17 04:53:33', NULL, NULL),
(3, 'Admin Admin', 'admin@gmail.com', '', '', '/uploads/image-1755442815151-417563055.jpeg', '$2b$10$ZMBB4FW4TrzomaHrqvxyfuPnrGZ9bBlvSNFS7Ar.TiWsWeXBC5y4W', 'admin', '2025-08-17 13:53:51', NULL, NULL);

-- --------------------------------------------------------

--
-- Structure for view `inventory_summary`
--
DROP TABLE IF EXISTS `inventory_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `inventory_summary`  AS SELECT `p`.`name` AS `product_name`, `pv`.`variant_name` AS `variant_name`, `pv`.`variant_sku` AS `variant_sku`, `pv`.`variant_price` AS `variant_price`, `l`.`name` AS `location_name`, `l`.`type` AS `location_type`, count(`ii`.`item_id`) AS `total_items`, count(case when `ii`.`status` = 'available' then 1 end) AS `available_count` FROM (((`product_variants` `pv` join `products` `p` on(`pv`.`product_id` = `p`.`product_id`)) join `inventory_items` `ii` on(`pv`.`variant_id` = `ii`.`variant_id`)) join `locations` `l` on(`ii`.`location_id` = `l`.`location_id`)) WHERE `pv`.`is_active` = 1 AND `l`.`is_active` = 1 GROUP BY `pv`.`variant_id`, `l`.`location_id` ORDER BY `p`.`name` ASC, `pv`.`variant_name` ASC, `l`.`name` ASC ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`category_id`);

--
-- Indexes for table `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `inventory_items`
--
ALTER TABLE `inventory_items`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `variant_id` (`variant_id`),
  ADD KEY `location_id` (`location_id`),
  ADD KEY `status` (`status`);

--
-- Indexes for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  ADD PRIMARY KEY (`transaction_id`),
  ADD KEY `item_id` (`item_id`),
  ADD KEY `transaction_type` (`transaction_type`);

--
-- Indexes for table `locations`
--
ALTER TABLE `locations`
  ADD PRIMARY KEY (`location_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `promotion_id` (`promotion_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`order_item_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`product_id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `supplier_id` (`supplier_id`);

--
-- Indexes for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD PRIMARY KEY (`variant_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `promotions`
--
ALTER TABLE `promotions`
  ADD PRIMARY KEY (`promotion_id`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`supplier_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `contact_messages`
--
ALTER TABLE `contact_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `inventory_items`
--
ALTER TABLE `inventory_items`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  MODIFY `transaction_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `locations`
--
ALTER TABLE `locations`
  MODIFY `location_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `order_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `product_variants`
--
ALTER TABLE `product_variants`
  MODIFY `variant_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `promotions`
--
ALTER TABLE `promotions`
  MODIFY `promotion_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `supplier_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`promotion_id`);

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`);

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`),
  ADD CONSTRAINT `products_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;