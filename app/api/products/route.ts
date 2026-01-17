import { NextResponse } from "next/server"
import { query, type ProductWithStock } from "@/lib/db"

// GET - 获取所有商品列表（含库存信息）
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get("keyword")
    const category = searchParams.get("category")

    let sql = `
      SELECT 
        p.*,
        COALESCE(s.quantity, 0) as stock_quantity,
        COALESCE(s.min_stock_alert, 10) as min_stock_alert
      FROM products p
      LEFT JOIN inventory_stock s ON p.id = s.product_id
      WHERE 1=1
    `

    const params: any[] = []

    if (keyword) {
      sql += ` AND (p.name LIKE ? OR p.sku LIKE ?)`
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    if (category) {
      sql += ` AND p.category = ?`
      params.push(category)
    }

    sql += ` ORDER BY p.created_at DESC`

    const products = await query<ProductWithStock[]>(sql, params)

    return NextResponse.json({
      success: true,
      data: products,
    })
  } catch (error) {
    console.error("[v0] Error fetching products:", error)
    return NextResponse.json({ success: false, error: "获取商品列表失败" }, { status: 500 })
  }
}

// POST - 创建新商品或获取现有商品
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      name, 
      sku, 
      category, 
      description, 
      unit, 
      image_url, 
      image_alt, 
      detailed_description,
      specifications,
      brand,
      model,
      weight,
      dimensions,
      color,
      material
    } = body

    // 验证必填字段
    if (!name || !sku) {
      return NextResponse.json({ success: false, error: "商品名称和SKU为必填项" }, { status: 400 })
    }

    // 首先检查SKU是否已存在
    const checkSql = `SELECT id FROM products WHERE sku = ?`
    const existingProduct = await query<{ id: number }[]>(checkSql, [sku])

    if (existingProduct.length > 0) {
      // 如果SKU已存在，返回现有商品
      return NextResponse.json({
        success: true,
        data: { id: existingProduct[0].id, existing: true },
      })
    }

    // 创建新商品
    const insertSql = `
      INSERT INTO products (
        name, sku, category, description, unit, 
        image_url, image_alt, detailed_description, specifications,
        brand, model, weight, dimensions, color, material
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const result: any = await query(insertSql, [
      name, sku, category || null, description || null, unit || "件",
      image_url || null, image_alt || null, detailed_description || null, specifications || null,
      brand || null, model || null, weight || null, dimensions || null, color || null, material || null
    ])

    // 同时创建库存记录
    const stockSql = `
      INSERT INTO inventory_stock (product_id, quantity)
      VALUES (?, 0)
    `
    await query(stockSql, [result.insertId])

    return NextResponse.json({
      success: true,
      data: { id: result.insertId, existing: false },
    })
  } catch (error: any) {
    console.error("[v0] Error creating product:", error)
    return NextResponse.json({ success: false, error: "创建商品失败" }, { status: 500 })
  }
}
