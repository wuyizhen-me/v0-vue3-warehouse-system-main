import { NextResponse } from "next/server"
import { query } from "@/lib/db"

interface LoginUser {
  id: number
  username: string
  password_hash: string
  role: "admin" | "customer"
  email?: string
  phone?: string
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ success: false, error: "用户名和密码不能为空" }, { status: 400 })
    }

    // 查询用户
    const users = await query<LoginUser[]>("SELECT * FROM users WHERE username = ?", [username])

    if (users.length === 0) {
      return NextResponse.json({ success: false, error: "用户名或密码错误" }, { status: 401 })
    }

    const user = users[0]

    // 验证密码（明文比对）
    if (password !== user.password_hash) {
      return NextResponse.json({ success: false, error: "用户名或密码错误" }, { status: 401 })
    }

    // 记录登录历史
    await query(
      "INSERT INTO user_history (username, user_role, action) VALUES (?, ?, ?)",
      [username, user.role, "登录系统"]
    )

    // 返回用户信息（不包含密码）
    const { password_hash, ...userInfo } = user

    return NextResponse.json({
      success: true,
      data: userInfo,
    })
  } catch (error) {
    console.error("[Auth] Login error:", error)
    return NextResponse.json({ success: false, error: "登录失败" }, { status: 500 })
  }
}
