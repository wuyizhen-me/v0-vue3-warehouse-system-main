-- ============================================
-- 仓库管理系统 - 完整数据库初始化脚本
-- 数据库名称: warehouse_system
-- 版本: 1.0.0
-- 说明: 此脚本包含所有表结构、索引、视图、触发器和初始数据
-- ============================================

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS warehouse_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE warehouse_system;

-- ============================================
-- 1. 用户相关表
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'customer') DEFAULT 'customer',
  email VARCHAR(100),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户历史表
CREATE TABLE IF NOT EXISTS user_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  user_role ENUM('admin', 'customer') DEFAULT 'customer',
  action VARCHAR(255) NOT NULL,
  action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_action_time (action_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户行为记录表
CREATE TABLE IF NOT EXISTS user_behaviors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  user_role ENUM('admin', 'customer') DEFAULT 'customer',
  behavior_type VARCHAR(50) NOT NULL COMMENT '行为类型：view_product, search, add_to_quote, etc',
  product_id INT,
  search_keyword VARCHAR(255),
  metadata JSON COMMENT '其他行为数据',
  behavior_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_behavior_type (behavior_type),
  INDEX idx_behavior_time (behavior_time),
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. 商品相关表
-- ============================================

-- 商品表
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(100),
  brand VARCHAR(100),
  model VARCHAR(100),
  size VARCHAR(100),
  caliber VARCHAR(100),
  description TEXT,
  detailed_description TEXT,
  specifications JSON,
  unit VARCHAR(50) DEFAULT 'piece',
  weight DECIMAL(10,3),
  dimensions VARCHAR(100),
  color VARCHAR(50),
  material VARCHAR(100),
  single_volume DECIMAL(10,2),
  packing_quantity INT,
  carton_volume DECIMAL(10,2),
  image_url VARCHAR(500),
  image_alt VARCHAR(255),
  min_stock_alert INT DEFAULT 10,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sku (sku),
  INDEX idx_category (category),
  INDEX idx_brand (brand),
  INDEX idx_status (status),
  INDEX idx_name (name),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 商品图片表
CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
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

-- ============================================
-- 3. 供应商和客户表
-- ============================================

-- 供应商表
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

-- 客户表
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

-- ============================================
-- 4. 库存相关表
-- ============================================

-- 库存表
CREATE TABLE IF NOT EXISTS inventory_stock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL UNIQUE,
  quantity INT NOT NULL DEFAULT 0,
  available_quantity INT NOT NULL DEFAULT 0,
  reserved_quantity INT NOT NULL DEFAULT 0,
  min_stock_alert INT DEFAULT 10,
  max_stock_limit INT,
  warehouse_location VARCHAR(100),
  last_inbound_date DATE,
  last_outbound_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 入库记录表
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
  INDEX idx_supplier (supplier),
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 出库记录表
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

-- 库存变动记录表
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

-- ============================================
-- 5. 报价相关表
-- ============================================

-- 报价表
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
  INDEX idx_customer (customer_name),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 报价明细表
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

-- ============================================
-- 6. 聊天相关表
-- ============================================

-- 聊天室表
CREATE TABLE IF NOT EXISTS chat_rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_username VARCHAR(100) NOT NULL,
  admin_username VARCHAR(100) DEFAULT 'admin',
  last_message_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unread_count_customer INT DEFAULT 0,
  unread_count_admin INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customer (customer_username),
  INDEX idx_admin (admin_username),
  UNIQUE KEY unique_room (customer_username, admin_username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 聊天消息表
CREATE TABLE IF NOT EXISTS chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id INT NOT NULL,
  sender_username VARCHAR(100) NOT NULL,
  sender_role ENUM('admin', 'customer') NOT NULL,
  message_type ENUM('text', 'image', 'product', 'file') DEFAULT 'text',
  content TEXT NOT NULL,
  file_url TEXT,
  file_name VARCHAR(255),
  product_id INT,
  metadata JSON,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  INDEX idx_room (room_id),
  INDEX idx_sender (sender_username),
  INDEX idx_created_at (created_at),
  INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI聊天会话表
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_message_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (username) REFERENCES users(username),
  INDEX idx_username (username),
  INDEX idx_last_message_time (last_message_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI聊天消息表
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  sender_type ENUM('user', 'ai') NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  INDEX idx_session_id (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. 沟通日志表
-- ============================================

CREATE TABLE IF NOT EXISTS communication_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_name VARCHAR(100) NOT NULL,
  message TEXT,
  log_type ENUM('inbound', 'outbound') NOT NULL,
  log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_client (client_name),
  INDEX idx_log_time (log_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. 创建视图
-- ============================================

-- 库存概览视图
CREATE OR REPLACE VIEW stock_overview AS
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

-- 库存变动历史视图
CREATE OR REPLACE VIEW transaction_history AS
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

-- ============================================
-- 9. 创建触发器
-- ============================================

DELIMITER //

-- 入库触发器：自动更新库存
DROP TRIGGER IF EXISTS after_inbound_insert;
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

-- 出库触发器：自动更新库存
DROP TRIGGER IF EXISTS after_outbound_insert;
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

-- ============================================
-- 10. 插入初始数据
-- ============================================

-- 插入默认管理员账户
INSERT IGNORE INTO users (username, password_hash, role, email) 
VALUES ('admin', 'admin123', 'admin', 'admin@warehouse.com');

-- 插入测试客户账户
INSERT IGNORE INTO users (username, password_hash, role, email) 
VALUES ('customer', 'customer123', 'customer', 'customer@example.com');

-- 插入示例商品
INSERT IGNORE INTO products (name, code, category, brand, unit, min_stock_alert, status) VALUES
('无线蓝牙耳机', 'EARB001', '电子产品', 'SoundMax', 'piece', 20, 'active'),
('智能手机壳', 'CASE001', '配件', 'ProtectPro', 'piece', 50, 'active'),
('USB-C数据线', 'CABLE001', '配件', 'ConnectFast', 'piece', 30, 'active'),
('机械键盘', 'KB001', '电子产品', 'KeyMaster', 'piece', 15, 'active'),
('无线鼠标', 'MOUSE001', '电子产品', 'ClickPro', 'piece', 25, 'active');

-- 插入示例供应商
INSERT IGNORE INTO suppliers (supplier_code, company_name, contact_person, email, phone) VALUES
('SUP001', '深圳电子科技有限公司', '张经理', 'zhang@techsupplier.com', '13800138000'),
('SUP002', '数码配件批发商', '李总', 'li@accessorywholesale.com', '13900139000');

-- 插入示例客户
INSERT IGNORE INTO customers (customer_code, company_name, contact_person, email, phone) VALUES
('CUST001', '零售商店A', '王老板', 'wang@storea.com', '13700137000'),
('CUST002', '电商平台B', '赵经理', 'zhao@platformb.com', '13600136000');

-- 初始化库存
INSERT IGNORE INTO inventory_stock (product_id, quantity, available_quantity) VALUES
(1, 100, 100),
(2, 200, 200),
(3, 150, 150),
(4, 80, 80),
(5, 120, 120);

-- 插入入库记录
INSERT IGNORE INTO inventory_inbound (product_id, supplier_id, quantity, unit_price, total_price, batch_number, supplier, warehouse_location, status, inbound_date, created_by) VALUES
(1, 1, 50, 99.99, 4999.50, 'BATCH2024001', '深圳电子科技有限公司', 'A区-货架1', 'completed', '2024-01-15', 1),
(2, 2, 100, 19.99, 1999.00, 'BATCH2024002', '数码配件批发商', 'B区-货架3', 'completed', '2024-01-16', 1),
(3, 1, 80, 29.99, 2399.20, 'BATCH2024003', '深圳电子科技有限公司', 'A区-货架2', 'completed', '2024-01-17', 1);

-- 插入报价记录
INSERT IGNORE INTO quotations (quotation_number, customer_name, customer_email, customer_phone, total_amount, status, valid_until, created_by) VALUES
('QT2024001', '零售商店A', 'wang@storea.com', '13700137000', 2999.99, 'sent', '2024-12-31', 1),
('QT2024002', '电商平台B', 'zhao@platformb.com', '13600136000', 5999.99, 'draft', '2024-12-31', 1);

-- 插入报价明细
INSERT IGNORE INTO quotation_items (quotation_id, product_id, quantity, unit_price, total_price) VALUES
(1, 1, 20, 99.99, 1999.80),
(1, 2, 50, 19.99, 999.50),
(2, 1, 50, 99.99, 4999.50),
(2, 3, 50, 29.99, 1499.50);

-- ============================================
-- 11. 设置字符集和时区
-- ============================================

SET NAMES utf8mb4;
SET time_zone = '+8:00';

-- ============================================
-- 初始化完成
-- ============================================

SELECT '数据库初始化完成！' as message;
SELECT '管理员账号: admin / admin123' as login_info;
SELECT '客户账号: customer / customer123' as login_info;
