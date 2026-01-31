import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { username, role } = await request.json()

    if (username) {
      // 记录退出历史
      await query(
        "INSERT INTO user_history (username, user_role, action) VALUES (?, ?, ?)",
        [username, role || "customer", "退出登录"]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Auth] Logout error:", error)
    return NextResponse.json({ success: false, error: "退出失败" }, { status: 500 })
  }
}
