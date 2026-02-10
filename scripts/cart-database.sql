-- ============================================
-- Shopping Cart Database Schema
-- ============================================

USE warehouse_system;

-- Shopping Cart Table
CREATE TABLE IF NOT EXISTS shopping_cart (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT 'User ID',
  product_id INT NOT NULL COMMENT 'Product ID',
  quantity INT NOT NULL DEFAULT 1 COMMENT 'Quantity',
  unit_price DECIMAL(10, 2) COMMENT 'Unit Price',
  notes VARCHAR(500) COMMENT 'Notes',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Key Constraint
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  
  -- Unique Constraint: One record per user per product
  UNIQUE KEY uk_user_product (user_id, product_id),
  
  -- Indexes
  INDEX idx_user_id (user_id),
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Shopping Cart Table';

-- Shopping Cart View (includes product info)
CREATE OR REPLACE VIEW shopping_cart_view AS
SELECT 
  c.id as cart_id,
  c.user_id,
  c.product_id,
  c.quantity,
  c.unit_price,
  c.notes,
  c.created_at,
  c.updated_at,
  p.name as product_name,
  p.code as product_code,
  p.category as product_category,
  p.unit as product_unit,
  p.image_url as product_image_url,
  COALESCE(c.unit_price, 0) as final_price,
  (c.quantity * COALESCE(c.unit_price, 0)) as total_price
FROM shopping_cart c
JOIN products p ON c.product_id = p.id;
