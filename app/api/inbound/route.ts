import { NextResponse } from "next/server"
import { query, type InboundWithProduct } from "@/lib/db"

// GET - 获取入库记录列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    let sql = `
      SELECT 
        i.*,
        p.name as product_name,
        p.sku as product_sku,
        p.unit as product_unit
      FROM inventory_inbound i
      JOIN products p ON i.product_id = p.id
      WHERE 1=1
    `

    const params: any[] = []

    if (status) {
      sql += ` AND i.status = ?`
      params.push(status)
    }

    if (startDate) {
      sql += ` AND i.inbound_date >= ?`
      params.push(startDate)
    }

    if (endDate) {
      sql += ` AND i.inbound_date <= ?`
      params.push(endDate)
    }

    sql += ` ORDER BY i.inbound_date DESC, i.created_at DESC`

    const records = await query<InboundWithProduct[]>(sql, params)

    return NextResponse.json({
      success: true,
      data: records,
    })
  } catch (error) {
    console.error("[v0] Error fetching inbound records:", error)
    return NextResponse.json({ success: false, error: "获取入库记录失败" }, { status: 500 })
  }
}

// POST - 创建入库记录
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { product_id, quantity, unit_price, supplier, warehouse_location, notes, inbound_date } = body

    // 验证必填字段
    if (!product_id || !quantity || !unit_price) {
      return NextResponse.json({ success: false, error: "商品、数量和单价为必填项" }, { status: 400 })
    }

    // 计算总价
    const total_price = quantity * unit_price

    // 生成批次号
    const batch_number = `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString().slice(-6)}`

    // 插入入库记录
    const sql = `
      INSERT INTO inventory_inbound 
      (product_id, quantity, unit_price, total_price, batch_number, supplier, warehouse_location, notes, inbound_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
    `

    const result: any = await query(sql, [
      product_id,
      quantity,
      unit_price,
      total_price,
      batch_number,
      supplier || null,
      warehouse_location || null,
      notes || null,
      inbound_date || new Date().toISOString().slice(0, 10),
    ])

    // 更新库存
    const updateStockSql = `
      INSERT INTO inventory_stock (product_id, quantity, last_inbound_date)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        quantity = quantity + VALUES(quantity),
        last_inbound_date = VALUES(last_inbound_date)
    `

    await query(updateStockSql, [product_id, quantity, inbound_date || new Date().toISOString().slice(0, 10)])

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertId,
        batch_number,
      },
    })
  } catch (error) {
    console.error("[v0] Error creating inbound record:", error)
    return NextResponse.json({ success: false, error: "创建入库记录失败" }, { status: 500 })
  }
}
