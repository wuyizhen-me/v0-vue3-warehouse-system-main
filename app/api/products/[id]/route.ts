import { NextResponse } from "next/server"
import { query, type ProductWithStock } from "@/lib/db"

// GET - 获取单个商品详情
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const sql = `
      SELECT 
        p.*,
        COALESCE(s.quantity, 0) as stock_quantity,
        COALESCE(s.min_stock_alert, 10) as min_stock_alert,
        s.last_inbound_date,
        (
          SELECT unit_price 
          FROM inventory_inbound 
          WHERE product_id = p.id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) as price
      FROM products p
      LEFT JOIN inventory_stock s ON p.id = s.product_id
      WHERE p.id = ?
    `

    const products = await query<ProductWithStock[]>(sql, [id])

    if (products.length === 0) {
      return NextResponse.json({ success: false, error: "商品不存在" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: products[0],
    })
  } catch (error) {
    console.error("[v0] Error fetching product:", error)
    return NextResponse.json({ success: false, error: "获取商品详情失败" }, { status: 500 })
  }
}

// PUT - 更新商品信息
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await request.json()
    const { name, code, category, description, unit, brand, model, weight, dimensions, color, material, specifications } = body

    // 验证必填字段
    if (!name || !code || !unit) {
      return NextResponse.json({ 
        success: false, 
        error: "商品名称、编码和计量单位是必填项" 
      }, { status: 400 })
    }

    // 检查编码是否已存在（排除当前商品）
    const checkSql = "SELECT id FROM products WHERE code = ? AND id != ?"
    const existingProducts = await query<{ id: number }[]>(checkSql, [code, id])

    if (existingProducts.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: "编码已存在" 
      }, { status: 400 })
    }

    // 更新商品信息
    const updateSql = `
      UPDATE products SET
        name = ?,
        code = ?,
        category = ?,
        description = ?,
        unit = ?,
        brand = ?,
        model = ?,
        weight = ?,
        dimensions = ?,
        color = ?,
        material = ?,
        specifications = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `

    await query(updateSql, [
      name,
      code,
      category || null,
      description || null,
      unit,
      brand || null,
      model || null,
      weight || null,
      dimensions || null,
      color || null,
      material || null,
      specifications ? JSON.stringify(specifications) : null,
      id
    ])

    // 返回更新后的商品信息
    const selectSql = `
      SELECT 
        p.*,
        COALESCE(s.quantity, 0) as stock_quantity,
        COALESCE(s.min_stock_alert, 10) as min_stock_alert,
        s.last_inbound_date,
        (
          SELECT unit_price 
          FROM inventory_inbound 
          WHERE product_id = p.id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) as price
      FROM products p
      LEFT JOIN inventory_stock s ON p.id = s.product_id
      WHERE p.id = ?
    `

    const updatedProducts = await query<ProductWithStock[]>(selectSql, [id])

    return NextResponse.json({
      success: true,
      data: updatedProducts[0],
    })
  } catch (error) {
    console.error("[v0] Error updating product:", error)
    return NextResponse.json({ success: false, error: "更新商品信息失败" }, { status: 500 })
  }
}
