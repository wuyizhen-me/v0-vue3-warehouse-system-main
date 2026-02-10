import { NextResponse } from "next/server"
import { query, type InboundWithProduct } from "@/lib/db"

// GET - 获取商品的入库历史记录
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const sql = `
      SELECT 
        i.*,
        p.name as product_name,
        p.code as product_code,
        p.unit as product_unit
      FROM inventory_inbound i
      JOIN products p ON i.product_id = p.id
      WHERE i.product_id = ?
      ORDER BY i.inbound_date DESC, i.created_at DESC
    `

    const records = await query<InboundWithProduct[]>(sql, [id])

    return NextResponse.json({
      success: true,
      data: records,
    })
  } catch (error) {
    console.error("[v0] Error fetching inbound history:", error)
    return NextResponse.json({ success: false, error: "获取入库历史失败" }, { status: 500 })
  }
}
