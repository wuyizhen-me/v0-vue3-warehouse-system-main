-- ============================================
-- 数据库迁移脚本：将 sku 改为 code，删除 detailed_description
-- ============================================

USE warehouse_system;

-- 1. 修改 products 表：将 sku 列重命名为 code
ALTER TABLE products CHANGE sku code VARCHAR(100) UNIQUE NOT NULL;

-- 2. 修改 products 表：删除 detailed_description 列
ALTER TABLE products DROP COLUMN detailed_description;

-- 3. 更新视图：重新创建 stock_overview 视图
DROP VIEW IF EXISTS stock_overview;
CREATE VIEW stock_overview AS
SELECT 
  p.id,
  p.code,
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

-- 4. 更新视图：重新创建 transaction_history 视图
DROP VIEW IF EXISTS transaction_history;
CREATE VIEW transaction_history AS
SELECT 
  t.id,
  t.product_id,
  p.name as product_name,
  p.code,
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

-- 5. 更新索引：删除旧的 sku 索引，创建新的 code 索引
DROP INDEX idx_sku ON products;
CREATE INDEX idx_code ON products(code);

-- ============================================
-- 迁移完成
-- ============================================
SELECT '数据库迁移完成！' as message;
SELECT '已将 sku 列重命名为 code' as change_info;
SELECT '已删除 detailed_description 列' as change_info;
