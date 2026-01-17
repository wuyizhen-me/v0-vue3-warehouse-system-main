import { NextResponse } from "next/server"
import { query } from "@/lib/db"

// GET - 获取仪表盘统计数据
export async function GET() {
  try {
    // 获取今日入库统计
    const todayInboundSql = `
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(quantity), 0) as total_quantity,
        COALESCE(SUM(total_price), 0) as total_amount
      FROM inventory_inbound
      WHERE DATE(inbound_date) = CURDATE()
      AND status = 'completed'
    `
    const todayInbound: any = await query(todayInboundSql, [])

    // 获取本月入库统计
    const monthInboundSql = `
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total_price), 0) as total_amount
      FROM inventory_inbound
      WHERE YEAR(inbound_date) = YEAR(CURDATE())
      AND MONTH(inbound_date) = MONTH(CURDATE())
      AND status = 'completed'
    `
    const monthInbound: any = await query(monthInboundSql, [])

    // 获取商品总数
    const productCountSql = `SELECT COUNT(*) as count FROM products`
    const productCount: any = await query(productCountSql, [])

    // 获取库存预警商品数
    const lowStockSql = `
      SELECT COUNT(*) as count
      FROM inventory_stock s
      WHERE s.quantity <= s.min_stock_alert
    `
    const lowStock: any = await query(lowStockSql, [])

    // 获取最近7天入库趋势
    const trendSql = `
      SELECT 
        DATE(inbound_date) as date,
        COUNT(*) as count,
        SUM(total_price) as amount
      FROM inventory_inbound
      WHERE inbound_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      AND status = 'completed'
      GROUP BY DATE(inbound_date)
      ORDER BY date ASC
    `
    const trend = await query(trendSql, [])

    return NextResponse.json({
      success: true,
      data: {
        today: {
          count: todayInbound[0].count,
          quantity: todayInbound[0].total_quantity,
          amount: Number.parseFloat(todayInbound[0].total_amount),
        },
        month: {
          count: monthInbound[0].count,
          amount: Number.parseFloat(monthInbound[0].total_amount),
        },
        products: {
          total: productCount[0].count,
        },
        alerts: {
          lowStock: lowStock[0].count,
        },
        trend,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching dashboard stats:", error)
    return NextResponse.json({ success: false, error: "获取统计数据失败" }, { status: 500 })
  }
}
