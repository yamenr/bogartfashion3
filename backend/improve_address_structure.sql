-- Improve Address Fields Structure
-- Add structured address fields (Street, City, Zip, Phone) to orders and users tables

-- First, backup current data
CREATE TABLE orders_backup AS SELECT * FROM orders;
CREATE TABLE users_backup AS SELECT * FROM users;

-- Add new structured address fields to orders table
ALTER TABLE orders 
ADD COLUMN street_address VARCHAR(255) AFTER user_id,
ADD COLUMN city VARCHAR(100) AFTER street_address,
ADD COLUMN zip_code VARCHAR(20) AFTER city,
ADD COLUMN phone VARCHAR(20) AFTER zip_code;

-- Add new structured address fields to users table
ALTER TABLE users 
ADD COLUMN street_address VARCHAR(255) AFTER email,
ADD COLUMN zip_code VARCHAR(20) AFTER city;

-- Update existing orders with structured data (basic parsing)
-- This is a simple migration - you may want to review and manually update some addresses
UPDATE orders SET 
    street_address = CASE 
        WHEN shipping_address LIKE '%Nof HaGalil%' THEN 'Nof HaGalil'
        ELSE shipping_address 
    END,
    city = CASE 
        WHEN shipping_address LIKE '%Nof HaGalil%' THEN 'Nof HaGalil'
        ELSE 'Unknown'
    END,
    zip_code = '00000',
    phone = '000-000-0000';

-- Update existing users with structured data
UPDATE users SET 
    street_address = CASE 
        WHEN city IS NOT NULL THEN city
        ELSE 'Unknown'
    END,
    zip_code = '00000'
WHERE street_address IS NULL;

-- Verify the new structure
DESCRIBE orders;
DESCRIBE users;

-- Show sample data to confirm changes
SELECT order_id, user_id, street_address, city, zip_code, phone, shipping_address 
FROM orders 
LIMIT 5;

SELECT user_id, username, email, street_address, city, zip_code, phone 
FROM users 
LIMIT 5;
