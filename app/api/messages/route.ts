import { NextResponse } from "next/server"
import { query } from "@/lib/db"

interface Message {
  id: number
  sender_username: string
  sender_role: "admin" | "customer"
  receiver_username?: string
  receiver_role?: "admin" | "customer"
  subject?: string
  content: string
  is_read: boolean
  parent_id?: number
  created_at: Date
  updated_at: Date
}

// GET - 获取留言
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get("username")
    const role = searchParams.get("role")
    const unreadOnly = searchParams.get("unread") === "true"

    let sql = `
      SELECT m.*, 
             (SELECT COUNT(*) FROM messages WHERE parent_id = m.id) as reply_count
      FROM messages m
      WHERE 1=1
    `
    const params: any[] = []

    if (username && role) {
      // 获取发送给该用户的消息或该用户发送的消息
      sql += ` AND (
        (m.receiver_username = ? AND m.receiver_role = ?) OR
        (m.sender_username = ? AND m.sender_role = ?)
      )`
      params.push(username, role, username, role)
    }

    if (unreadOnly) {
      sql += ` AND m.is_read = FALSE`
    }

    // 只显示顶级消息（非回复）
    sql += ` AND m.parent_id IS NULL`
    sql += ` ORDER BY m.created_at DESC`

    const messages = await query<any[]>(sql, params)

    return NextResponse.json({
      success: true,
      data: messages,
    })
  } catch (error) {
    console.error("[Messages] Error fetching messages:", error)
    return NextResponse.json({ success: false, error: "获取留言失败" }, { status: 500 })
  }
}

// POST - 发送留言
export async function POST(request: Request) {
  try {
    const { sender_username, sender_role, receiver_username, receiver_role, subject, content, parent_id } =
      await request.json()

    if (!sender_username || !content) {
      return NextResponse.json({ success: false, error: "发送者和内容不能为空" }, { status: 400 })
    }

    const result: any = await query(
      `INSERT INTO messages (sender_username, sender_role, receiver_username, receiver_role, subject, content, parent_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        sender_username,
        sender_role || "customer",
        receiver_username || null,
        receiver_role || null,
        subject || null,
        content,
        parent_id || null,
      ]
    )

    return NextResponse.json({
      success: true,
      data: { id: result.insertId },
    })
  } catch (error) {
    console.error("[Messages] Error sending message:", error)
    return NextResponse.json({ success: false, error: "发送留言失败" }, { status: 500 })
  }
}

// PATCH - 标记为已读
export async function PATCH(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, error: "消息ID不能为空" }, { status: 400 })
    }

    await query("UPDATE messages SET is_read = TRUE WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Messages] Error marking as read:", error)
    return NextResponse.json({ success: false, error: "标记失败" }, { status: 500 })
  }
}

// DELETE - 删除留言
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "消息ID不能为空" }, { status: 400 })
    }

    await query("DELETE FROM messages WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Messages] Error deleting message:", error)
    return NextResponse.json({ success: false, error: "删除留言失败" }, { status: 500 })
  }
}
