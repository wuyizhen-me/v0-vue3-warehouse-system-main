import { NextResponse } from "next/server"
import { query } from "@/lib/db"

interface UserHistory {
  id: number
  username: string
  user_role: "admin" | "customer"
  action: string
  action_time: Date
}

// GET - 获取用户历史记录
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get("username")
    const limit = parseInt(searchParams.get("limit") || "100")

    let sql = "SELECT * FROM user_history"
    const params: any[] = []

    if (username) {
      sql += " WHERE username = ?"
      params.push(username)
    }

    sql += " ORDER BY action_time DESC LIMIT ?"
    params.push(limit)

    const history = await query<UserHistory[]>(sql, params)

    return NextResponse.json({
      success: true,
      data: history,
    })
  } catch (error) {
    console.error("[History] Error fetching history:", error)
    return NextResponse.json({ success: false, error: "获取历史记录失败" }, { status: 500 })
  }
}

// POST - 添加历史记录
export async function POST(request: Request) {
  try {
    const { username, role, action } = await request.json()

    if (!username || !action) {
      return NextResponse.json({ success: false, error: "用户名和操作不能为空" }, { status: 400 })
    }

    await query(
      "INSERT INTO user_history (username, user_role, action) VALUES (?, ?, ?)",
      [username, role || "customer", action]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[History] Error adding history:", error)
    return NextResponse.json({ success: false, error: "添加历史记录失败" }, { status: 500 })
  }
}

// DELETE - 删除历史记录
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID不能为空" }, { status: 400 })
    }

    await query("DELETE FROM user_history WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[History] Error deleting history:", error)
    return NextResponse.json({ success: false, error: "删除历史记录失败" }, { status: 500 })
  }
}
