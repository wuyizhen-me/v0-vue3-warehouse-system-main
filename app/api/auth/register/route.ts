import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { username, password, role = "customer", email, phone } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ success: false, error: "用户名和密码不能为空" }, { status: 400 })
    }

    // 检查用户名是否已存在
    const existing = await query<any[]>("SELECT id FROM users WHERE username = ?", [username])

    if (existing.length > 0) {
      return NextResponse.json({ success: false, error: "用户名已存在" }, { status: 400 })
    }

    // 创建用户（明文密码）
    const result: any = await query(
      "INSERT INTO users (username, password_hash, role, email, phone) VALUES (?, ?, ?, ?, ?)",
      [username, password, role, email || null, phone || null]
    )

    // 记录注册历史
    await query(
      "INSERT INTO user_history (username, user_role, action) VALUES (?, ?, ?)",
      [username, role, "注册账户"]
    )

    return NextResponse.json({
      success: true,
      data: { id: result.insertId, username, role },
    })
  } catch (error) {
    console.error("[Auth] Register error:", error)
    return NextResponse.json({ success: false, error: "注册失败" }, { status: 500 })
  }
}
