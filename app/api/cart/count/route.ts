import { NextResponse } from "next/server"
import { query } from "@/lib/db"

// 从请求头中获取用户信息
function getUserFromRequest(request: Request) {
  const userHeader = request.headers.get("x-user-info")
  if (userHeader) {
    try {
      return JSON.parse(userHeader)
    } catch {
      return null
    }
  }
  return null
}

// GET - 获取购物车商品数量
export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user || !user.id) {
      return NextResponse.json({
        success: true,
        data: { count: 0 }
      })
    }

    const result = await query(
      "SELECT SUM(quantity) as total_count FROM shopping_cart WHERE user_id = ?",
      [user.id]
    )

    const count = (result as any[])[0]?.total_count || 0

    return NextResponse.json({
      success: true,
      data: { count: parseInt(count) }
    })
  } catch (error) {
    console.error("[v0] Error fetching cart count:", error)
    return NextResponse.json(
      { success: false, error: "获取购物车数量失败" },
      { status: 500 }
    )
  }
}
