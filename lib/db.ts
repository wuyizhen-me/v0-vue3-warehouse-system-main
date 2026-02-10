// MySQL数据库连接配置
import mysql from "mysql2/promise"

// 创建数据库连接池
export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "warehouse_system",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// 数据库查询辅助函数
export async function query<T>(sql: string, params?: any[]): Promise<T> {
  const [results] = await pool.execute(sql, params)
  return results as T
}

// 类型定义
export interface Product {
  id: number
  name: string
  code: string
  category: string
  description?: string
  unit: string
  image_url?: string
  image_alt?: string
  specifications?: any
  brand?: string
  model?: string
  weight?: number
  dimensions?: string
  color?: string
  material?: string
  created_at: Date
  updated_at: Date
}

export interface ProductImage {
  id: number
  product_id: number
  image_url: string
  image_alt?: string
  is_primary: boolean
  sort_order: number
  created_at: Date
  updated_at: Date
}

export interface InventoryInbound {
  id: number
  product_id: number
  quantity: number
  unit_price: number
  total_price: number
  batch_number: string
  supplier?: string
  warehouse_location?: string
  notes?: string
  status: "pending" | "completed" | "cancelled"
  inbound_date: string
  created_at: Date
  updated_at: Date
}

export interface InventoryStock {
  id: number
  product_id: number
  quantity: number
  min_stock_alert: number
  last_inbound_date?: string
  created_at: Date
  updated_at: Date
}

// 商品相关接口扩展
export interface ProductWithStock extends Product {
  stock_quantity: number
  min_stock_alert: number
}

export interface InboundWithProduct extends InventoryInbound {
  product_name: string
  product_code: string
  product_unit: string
}
