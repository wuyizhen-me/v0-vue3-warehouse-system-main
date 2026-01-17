-- 仓库管理系统数据库初始化脚本
-- 数据库名称: warehouse_system

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS warehouse_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE warehouse_system;

-- 1. 商品表
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(100),
  brand VARCHAR(100),
  model VARCHAR(100),
  description TEXT,
  detailed_description TEXT,
  specifications JSON,
  unit VARCHAR(50) DEFAULT 'piece',
  weight DECIMAL(10,3),
  dimensions VARCHAR(100),
  color VARCHAR(50),
  material VARCHAR(100),
  image_url VARCHAR(500),
  image_alt VARCHAR(255),
  min_stock_alert INT DEFAULT 10,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sku (sku),
  INDEX idx_category (category),
  INDEX idx_brand (brand),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 商品图片表
CREATE TABLE IF NOT EXISTS product_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  image_alt VARCHAR(255) DEFAULT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_is_primary (is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 供应商表
CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_code VARCHAR(50) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_supplier_code (supplier_code),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 客户表
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_code VARCHAR(50) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  credit_limit DECIMAL(12, 2),
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customer_code (customer_code),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 库存表
CREATE TABLE IF NOT EXISTS inventory_stock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL UNIQUE,
  quantity INT NOT NULL DEFAULT 0,
  available_quantity INT NOT NULL DEFAULT 0,
  reserved_quantity INT NOT NULL DEFAULT 0,
  min_stock_alert INT DEFAULT 10,
  max_stock_limit INT,
  last_inbound_date DATE,
  last_outbound_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 入库记录表
CREATE TABLE IF NOT EXISTS inventory_inbound (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  supplier_id INT,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  batch_number VARCHAR(100) NOT NULL,
  supplier VARCHAR(255),
  warehouse_location VARCHAR(100),
  notes TEXT,
  status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
  inbound_date DATE NOT NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  INDEX idx_batch (batch_number),
  INDEX idx_status (status),
  INDEX idx_date (inbound_date),
  INDEX idx_supplier (supplier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 出库记录表
CREATE TABLE IF NOT EXISTS inventory_outbound (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  customer_id INT,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  order_number VARCHAR(100),
  customer VARCHAR(255),
  warehouse_location VARCHAR(100),
  notes TEXT,
  status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
  outbound_date DATE NOT NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  INDEX idx_order (order_number),
  INDEX idx_status (status),
  INDEX idx_date (outbound_date),
  INDEX idx_customer (customer)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. 报价表
CREATE TABLE IF NOT EXISTS quotations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quotation_number VARCHAR(100) UNIQUE NOT NULL,
  customer_id INT,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  total_amount DECIMAL(12, 2) NOT NULL,
  status ENUM('draft', 'sent', 'accepted', 'rejected', 'expired') DEFAULT 'draft',
  valid_until DATE,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  INDEX idx_quotation_number (quotation_number),
  INDEX idx_status (status),
  INDEX idx_customer (customer_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. 报价明细表
CREATE TABLE IF NOT EXISTS quotation_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quotation_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_quotation_id (quotation_id),
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. 库存变动记录表
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  transaction_type ENUM('inbound', 'outbound', 'adjustment', 'transfer') NOT NULL,
  quantity INT NOT NULL,
  reference_id INT,
  reference_type VARCHAR(50),
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_transaction_type (transaction_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 添加外键约束（避免循环依赖，最后添加）

-- 创建库存自动更新触发器
DELIMITER //

-- 先删除已存在的触发器（如果存在）
DROP TRIGGER IF EXISTS after_inbound_insert;

-- 入库触发器
CREATE TRIGGER after_inbound_insert
AFTER INSERT ON inventory_inbound
FOR EACH ROW
BEGIN
  IF NEW.status = 'completed' THEN
    INSERT INTO inventory_transactions (product_id, transaction_type, quantity, reference_id, reference_type, created_by)
    VALUES (NEW.product_id, 'inbound', NEW.quantity, NEW.id, 'inventory_inbound', NEW.created_by);
    
    INSERT INTO inventory_stock (product_id, quantity, available_quantity)
    VALUES (NEW.product_id, NEW.quantity, NEW.quantity)
    ON DUPLICATE KEY UPDATE
      quantity = quantity + NEW.quantity,
      available_quantity = available_quantity + NEW.quantity,
      last_inbound_date = NEW.inbound_date;
  END IF;
END//

-- 先删除已存在的触发器（如果存在）
DROP TRIGGER IF EXISTS after_outbound_insert;

-- 出库触发器
CREATE TRIGGER after_outbound_insert
AFTER INSERT ON inventory_outbound
FOR EACH ROW
BEGIN
  IF NEW.status = 'completed' THEN
    INSERT INTO inventory_transactions (product_id, transaction_type, quantity, reference_id, reference_type, created_by)
    VALUES (NEW.product_id, 'outbound', -NEW.quantity, NEW.id, 'inventory_outbound', NEW.created_by);
    
    UPDATE inventory_stock 
    SET quantity = quantity - NEW.quantity,
        available_quantity = available_quantity - NEW.quantity,
        last_outbound_date = NEW.outbound_date
    WHERE product_id = NEW.product_id;
  END IF;
END//

DELIMITER ;

-- 插入示例数据
INSERT INTO products (name, sku, category, brand, unit, min_stock_alert) VALUES
('Wireless Bluetooth Headphones', 'EARB001', 'Electronics', 'SoundMax', 'piece', 20),
('Smartphone Case', 'CASE001', 'Accessories', 'ProtectPro', 'piece', 50),
('USB-C Cable', 'CABLE001', 'Accessories', 'ConnectFast', 'piece', 30);

INSERT INTO suppliers (supplier_code, company_name, contact_person, email, phone) VALUES
('SUP001', 'Tech Electronics Co., Ltd.', 'Manager Zhang', 'zhang@techsupplier.com', '13800138000'),
('SUP002', 'Digital Accessories Wholesaler', 'General Manager Li', 'li@accessorywholesale.com', '13900139000');

INSERT INTO customers (customer_code, company_name, contact_person, email, phone) VALUES
('CUST001', 'Retail Store A', 'Owner Wang', 'wang@storea.com', '13700137000'),
('CUST002', 'E-commerce Platform B', 'Manager Zhao', 'zhao@platformb.com', '13600136000');

-- 初始化库存
INSERT INTO inventory_stock (product_id, quantity, available_quantity) VALUES
(1, 100, 100),
(2, 200, 200),
(3, 150, 150);

-- 插入入库记录
INSERT INTO inventory_inbound (product_id, supplier_id, quantity, unit_price, total_price, batch_number, supplier, warehouse_location, status, inbound_date, created_by) VALUES
(1, 1, 50, 99.99, 4999.50, 'BATCH2024001', 'Tech Electronics Co., Ltd.', 'Area A-Shelf 1', 'completed', '2024-01-15', 1),
(2, 2, 100, 19.99, 1999.00, 'BATCH2024002', 'Digital Accessories Wholesaler', 'Area B-Shelf 3', 'completed', '2024-01-16', 1);

-- 插入报价记录
INSERT INTO quotations (quotation_number, customer_name, customer_email, customer_phone, total_amount, status, valid_until, created_by) VALUES
('QT2024001', '零售商店A', 'wang@storea.com', '13700137000', 2999.99, 'sent', '2024-02-15', 1),
('QT2024002', '电商平台B', 'zhao@platformb.com', '13600136000', 5999.99, 'draft', '2024-02-20', 1);

INSERT INTO quotation_items (quotation_id, product_id, quantity, unit_price, total_price) VALUES
(1, 1, 20, 99.99, 1999.80),
(1, 2, 50, 19.99, 999.50),
(2, 1, 50, 99.99, 4999.50),
(2, 3, 50, 19.99, 999.50);

-- 创建视图：库存概览
CREATE VIEW stock_overview AS
SELECT 
  p.id,
  p.sku,
  p.name,
  p.category,
  p.brand,
  COALESCE(s.quantity, 0) as current_stock,
  COALESCE(s.available_quantity, 0) as available_stock,
  COALESCE(s.reserved_quantity, 0) as reserved_stock,
  p.min_stock_alert,
  CASE 
    WHEN COALESCE(s.quantity, 0) <= p.min_stock_alert THEN 'low_stock'
    WHEN COALESCE(s.quantity, 0) = 0 THEN 'out_of_stock'
    ELSE 'normal'
  END as stock_status,
  s.last_inbound_date,
  s.last_outbound_date
FROM products p
LEFT JOIN inventory_stock s ON p.id = s.product_id
WHERE p.status = 'active';

-- 创建视图：库存变动历史
CREATE VIEW transaction_history AS
SELECT 
  t.id,
  t.product_id,
  p.name as product_name,
  p.sku,
  t.transaction_type,
  t.quantity,
  t.reference_id,
  t.reference_type,
  t.notes,
  t.created_at,
  t.created_by
FROM inventory_transactions t
JOIN products p ON t.product_id = p.id
ORDER BY t.created_at DESC;

-- 创建索引优化查询性能
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_inbound_date_created ON inventory_inbound(inbound_date, created_at);
CREATE INDEX idx_outbound_date_created ON inventory_outbound(outbound_date, created_at);
CREATE INDEX idx_transactions_created ON inventory_transactions(created_at);
CREATE INDEX idx_quotations_created ON quotations(created_at);

-- 设置字符集和时区
SET NAMES utf8mb4;
SET time_zone = '+8:00';

-- 权限设置（根据实际需求调整）
-- CREATE USER 'warehouse_user'@'localhost' IDENTIFIED BY 'your_password';
-- GRANT ALL PRIVILEGES ON warehouse_system.* TO 'warehouse_user'@'localhost';
-- FLUSH PRIVILEGES;