import { NextResponse } from "next/server"
import { query } from "@/lib/db"

interface UserBehavior {
  id: number
  username: string
  user_role: "admin" | "customer"
  behavior_type: string
  product_id?: number
  search_keyword?: string
  metadata?: any
  behavior_time: Date
}

// GET - 获取用户行为记录
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get("username")
    const behaviorType = searchParams.get("type")
    const limit = parseInt(searchParams.get("limit") || "100")

    let sql = "SELECT * FROM user_behaviors WHERE 1=1"
    const params: any[] = []

    if (username) {
      sql += " AND username = ?"
      params.push(username)
    }

    if (behaviorType) {
      sql += " AND behavior_type = ?"
      params.push(behaviorType)
    }

    sql += " ORDER BY behavior_time DESC LIMIT ?"
    params.push(limit)

    const behaviors = await query<UserBehavior[]>(sql, params)

    return NextResponse.json({
      success: true,
      data: behaviors,
    })
  } catch (error) {
    console.error("[Behaviors] Error fetching behaviors:", error)
    return NextResponse.json({ success: false, error: "获取行为记录失败" }, { status: 500 })
  }
}

// POST - 记录用户行为
export async function POST(request: Request) {
  try {
    const { username, role, behavior_type, product_id, search_keyword, metadata } = await request.json()

    if (!username || !behavior_type) {
      return NextResponse.json({ success: false, error: "用户名和行为类型不能为空" }, { status: 400 })
    }

    const result: any = await query(
      `INSERT INTO user_behaviors (username, user_role, behavior_type, product_id, search_keyword, metadata) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, role || "customer", behavior_type, product_id || null, search_keyword || null, metadata ? JSON.stringify(metadata) : null]
    )

    return NextResponse.json({
      success: true,
      data: { id: result.insertId },
    })
  } catch (error) {
    console.error("[Behaviors] Error recording behavior:", error)
    return NextResponse.json({ success: false, error: "记录行为失败" }, { status: 500 })
  }
}
