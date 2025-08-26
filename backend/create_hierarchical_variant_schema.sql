-- Hierarchical Variant Schema Migration (Non-destructive)
-- MariaDB/MySQL compatible
-- Creates product attribute infrastructure while keeping existing tables intact

START TRANSACTION;

-- 1) Master list of attributes (e.g., Color, Size)
CREATE TABLE IF NOT EXISTS product_attributes (
  attribute_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  UNIQUE KEY uq_attribute_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2) Attribute values (e.g., Red, Blue, S, M)
CREATE TABLE IF NOT EXISTS product_attribute_values (
  value_id INT AUTO_INCREMENT PRIMARY KEY,
  attribute_id INT NOT NULL,
  value VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  UNIQUE KEY uq_attr_value (attribute_id, slug),
  KEY idx_attribute_id (attribute_id),
  CONSTRAINT fk_attr_values_attribute
    FOREIGN KEY (attribute_id) REFERENCES product_attributes(attribute_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3) Which attributes a product uses and their display order
CREATE TABLE IF NOT EXISTS product_attribute_options (
  product_id INT NOT NULL,
  attribute_id INT NOT NULL,
  display_order INT NOT NULL DEFAULT 1,
  is_required TINYINT(1) DEFAULT 1,
  PRIMARY KEY (product_id, attribute_id),
  KEY idx_pao_attribute_id (attribute_id),
  CONSTRAINT fk_pao_product
    FOREIGN KEY (product_id) REFERENCES products(product_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pao_attribute
    FOREIGN KEY (attribute_id) REFERENCES product_attributes(attribute_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4) Link variant to chosen values (combination mapping)
-- Assumes existing table product_variants (variant_id PK)
CREATE TABLE IF NOT EXISTS product_variant_attributes (
  variant_id INT NOT NULL,
  attribute_id INT NOT NULL,
  value_id INT NOT NULL,
  PRIMARY KEY (variant_id, attribute_id),
  KEY idx_pva_value_id (value_id),
  CONSTRAINT fk_pva_variant
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pva_attribute
    FOREIGN KEY (attribute_id) REFERENCES product_attributes(attribute_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pva_value
    FOREIGN KEY (value_id) REFERENCES product_attribute_values(value_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Optional seed data for common attributes
INSERT IGNORE INTO product_attributes (attribute_id, name, slug, is_active)
VALUES
  (1, 'Color', 'color', 1),
  (2, 'Size', 'size', 1);

-- Seed values for Color
INSERT IGNORE INTO product_attribute_values (value_id, attribute_id, value, slug, is_active)
VALUES
  (1, 1, 'Red', 'red', 1),
  (2, 1, 'Blue', 'blue', 1),
  (3, 1, 'Black', 'black', 1),
  (4, 1, 'White', 'white', 1);

-- Seed values for Size
INSERT IGNORE INTO product_attribute_values (value_id, attribute_id, value, slug, is_active)
VALUES
  (101, 2, 'XS', 'xs', 1),
  (102, 2, 'S', 's', 1),
  (103, 2, 'M', 'm', 1),
  (104, 2, 'L', 'l', 1),
  (105, 2, 'XL', 'xl', 1),
  (106, 2, 'XXL', 'xxl', 1);

COMMIT;

-- Rollback helper (manual):
-- DROP TABLE IF EXISTS product_variant_attributes;
-- DROP TABLE IF EXISTS product_attribute_options;
-- DROP TABLE IF EXISTS product_attribute_values;
-- DROP TABLE IF EXISTS product_attributes;


