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
        COALESCE(s.min_stock_alert, 10) as min_stock_alert,
        (
          SELECT unit_price 
          FROM inventory_inbound 
          WHERE product_id = p.id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) as price
      FROM products p
      LEFT JOIN inventory_stock s ON p.id = s.product_id
      WHERE 1=1
    `

    const params: any[] = []

    if (keyword) {
      sql += ` AND (p.name LIKE ? OR p.code LIKE ?)`
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    if (category) {
      sql += ` AND p.category = ?`
      params.push(category)
    }

    sql += ` ORDER BY p.created_at DESC`

    const products = await query<ProductWithStock[]>(sql, params)

    const response = NextResponse.json({
      success: true,
      data: products,
    })
    
    // 添加缓存头，客户端缓存30秒
    response.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
    
    return response
  } catch (error) {
    console.error("[v0] Error fetching products:", error)
    return NextResponse.json({ success: false, error: "获取商品列表失败" }, { status: 500 })
  }
}

// POST - 创建新商品或更新现有商品
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      name, 
      code, 
      category, 
      description, 
      unit, 
      image_url, 
      image_alt, 
      specifications,
      brand,
      model,
      weight,
      dimensions,
      color,
      material
    } = body

    // 验证必填字段
    if (!name || !code) {
      return NextResponse.json({ success: false, error: "商品名称和编码为必填项" }, { status: 400 })
    }

    // 首先检查编码是否已存在
    const checkSql = `SELECT id FROM products WHERE code = ?`
    const existingProduct = await query<{ id: number }[]>(checkSql, [code])

    if (existingProduct.length > 0) {
      // 如果编码已存在，更新商品信息
      const updateSql = `
        UPDATE products SET 
          name = ?, 
          category = ?, 
          description = ?, 
          unit = ?, 
          image_url = ?, 
          image_alt = ?, 
          specifications = ?, 
          brand = ?, 
          model = ?, 
          weight = ?, 
          dimensions = ?, 
          color = ?, 
          material = ?, 
          updated_at = NOW()
        WHERE code = ?
      `
      
      await query(updateSql, [
        name, category || null, description || null, unit || "件",
        image_url || null, image_alt || null, specifications || null,
        brand || null, model || null, weight || null, dimensions || null, color || null, material || null,
        code
      ])
      
      return NextResponse.json({
        success: true,
        data: { id: existingProduct[0].id, existing: true },
      })
    }

    // 创建新商品
    const insertSql = `
      INSERT INTO products (
        name, code, category, description, unit, 
        image_url, image_alt, specifications,
        brand, model, weight, dimensions, color, material
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const result: any = await query(insertSql, [
      name, code, category || null, description || null, unit || "件",
      image_url || null, image_alt || null, specifications || null,
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
    console.error("[v0] Error creating/updating product:", error)
    return NextResponse.json({ success: false, error: "创建/更新商品失败" }, { status: 500 })
  }
}

// PUT - 更新商品信息
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { 
      id, 
      name, 
      code, 
      category, 
      description, 
      unit, 
      image_url, 
      image_alt, 
      specifications,
      brand,
      model,
      weight,
      dimensions,
      color,
      material
    } = body

    // 验证必填字段
    if (!id || !name || !code) {
      return NextResponse.json({ success: false, error: "商品ID、名称和编码为必填项" }, { status: 400 })
    }

    // 更新商品信息
    const updateSql = `
      UPDATE products SET 
        name = ?, 
        code = ?, 
        category = ?, 
        description = ?, 
        unit = ?, 
        image_url = ?, 
        image_alt = ?, 
        specifications = ?, 
        brand = ?, 
        model = ?, 
        weight = ?, 
        dimensions = ?, 
        color = ?, 
        material = ?, 
        updated_at = NOW()
      WHERE id = ?
    `
    
    await query(updateSql, [
      name, code, category || null, description || null, unit || "件",
      image_url || null, image_alt || null, specifications || null,
      brand || null, model || null, weight || null, dimensions || null, color || null, material || null,
      id
    ])
    
    return NextResponse.json({
      success: true,
      message: "商品更新成功"
    })
  } catch (error: any) {
    console.error("[v0] Error updating product:", error)
    return NextResponse.json({ success: false, error: "更新商品失败" }, { status: 500 })
  }
}

// DELETE - 删除商品
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "商品ID不能为空" }, { status: 400 })
    }

    // 开始事务
    await query("START TRANSACTION")

    try {
      // 删除库存记录
      await query("DELETE FROM inventory_stock WHERE product_id = ?", [id])
      // 删除商品
      await query("DELETE FROM products WHERE id = ?", [id])
      // 提交事务
      await query("COMMIT")
    } catch (error) {
      // 回滚事务
      await query("ROLLBACK")
      throw error
    }

    return NextResponse.json({ success: true, message: "商品删除成功" })
  } catch (error) {
    console.error("[v0] Error deleting product:", error)
    return NextResponse.json({ success: false, error: "删除商品失败" }, { status: 500 })
  }
}
