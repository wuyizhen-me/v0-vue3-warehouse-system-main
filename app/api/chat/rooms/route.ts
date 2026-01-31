import { NextResponse } from "next/server"
import { query } from "@/lib/db"

// GET - 获取聊天室列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get("username")
    const role = searchParams.get("role")

    if (!username || !role) {
      return NextResponse.json({ success: false, error: "用户名和角色不能为空" }, { status: 400 })
    }

    let rooms

    if (role === "admin") {
      // 管理员查看所有聊天室
      rooms = await query<any[]>(
        `SELECT r.*, 
                (SELECT content FROM chat_messages WHERE room_id = r.id ORDER BY created_at DESC LIMIT 1) as last_message,
                (SELECT created_at FROM chat_messages WHERE room_id = r.id ORDER BY created_at DESC LIMIT 1) as last_message_time
         FROM chat_rooms r
         ORDER BY r.last_message_time DESC`
      )
    } else {
      // 客户只查看自己的聊天室
      rooms = await query<any[]>(
        `SELECT r.*, 
                (SELECT content FROM chat_messages WHERE room_id = r.id ORDER BY created_at DESC LIMIT 1) as last_message,
                (SELECT created_at FROM chat_messages WHERE room_id = r.id ORDER BY created_at DESC LIMIT 1) as last_message_time
         FROM chat_rooms r
         WHERE r.customer_username = ?
         ORDER BY r.last_message_time DESC`,
        [username]
      )
    }

    return NextResponse.json({
      success: true,
      data: rooms,
    })
  } catch (error) {
    console.error("[Chat] Error fetching rooms:", error)
    return NextResponse.json({ success: false, error: "获取聊天室失败" }, { status: 500 })
  }
}

// POST - 创建或获取聊天室
export async function POST(request: Request) {
  try {
    const { customer_username, admin_username = "admin" } = await request.json()

    if (!customer_username) {
      return NextResponse.json({ success: false, error: "客户用户名不能为空" }, { status: 400 })
    }

    // 检查聊天室是否存在
    const existing = await query<any[]>(
      "SELECT * FROM chat_rooms WHERE customer_username = ? AND admin_username = ?",
      [customer_username, admin_username]
    )

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        data: existing[0],
      })
    }

    // 创建新聊天室
    const result: any = await query(
      "INSERT INTO chat_rooms (customer_username, admin_username) VALUES (?, ?)",
      [customer_username, admin_username]
    )

    return NextResponse.json({
      success: true,
      data: { id: result.insertId, customer_username, admin_username },
    })
  } catch (error) {
    console.error("[Chat] Error creating room:", error)
    return NextResponse.json({ success: false, error: "创建聊天室失败" }, { status: 500 })
  }
}
