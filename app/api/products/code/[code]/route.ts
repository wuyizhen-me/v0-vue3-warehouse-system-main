import { NextResponse } from "next/server"
import { query, type ProductWithStock } from "@/lib/db"

// GET - 根据product_id获取商品详情（接口地址保持code/，但参数改为product_id）
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  // 将code参数作为product_id使用
  const productId = code

  try {
    // 通过product_id获取完整商品信息（包含最新入库价格）
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
        ) as unit_price
      FROM products p
      LEFT JOIN inventory_stock s ON p.id = s.product_id
      WHERE p.id = ?
    `

    const products = await query<ProductWithStock[]>(sql, [productId])

    if (products.length === 0) {
      return NextResponse.json(
        { success: false, error: "商品不存在" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: products[0],
    })
  } catch (error) {
    console.error("[v0] Error fetching product by id:", error)
    return NextResponse.json(
      { success: false, error: "获取商品信息失败" },
      { status: 500 }
    )
  }
}
