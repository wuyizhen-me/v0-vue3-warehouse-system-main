import { NextResponse } from "next/server"
import { query } from "@/lib/db"

// GET - 获取聊天消息
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get("room_id")

    if (!roomId) {
      return NextResponse.json({ success: false, error: "聊天室ID不能为空" }, { status: 400 })
    }

    const messages = await query<any[]>(
      `SELECT m.*, p.name as product_name, p.image_url as product_image
       FROM chat_messages m
       LEFT JOIN products p ON m.product_id = p.id
       WHERE m.room_id = ?
       ORDER BY m.created_at ASC`,
      [roomId]
    )

    return NextResponse.json({
      success: true,
      data: messages,
    })
  } catch (error) {
    console.error("[Chat] Error fetching messages:", error)
    return NextResponse.json({ success: false, error: "获取消息失败" }, { status: 500 })
  }
}

// POST - 发送消息
export async function POST(request: Request) {
  try {
    const { room_id, sender_username, sender_role, message_type = "text", content, file_url, file_name, product_id, metadata } =
      await request.json()

    if (!room_id || !sender_username || !content) {
      return NextResponse.json({ success: false, error: "必填字段不能为空" }, { status: 400 })
    }

    // 插入消息
    const result: any = await query(
      `INSERT INTO chat_messages (room_id, sender_username, sender_role, message_type, content, file_url, file_name, product_id, metadata) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        room_id,
        sender_username,
        sender_role || "customer",
        message_type,
        content,
        file_url || null,
        file_name || null,
        product_id || null,
        metadata ? JSON.stringify(metadata) : null,
      ]
    )

    // 更新聊天室最后消息时间和未读数
    const unreadField = sender_role === "admin" ? "unread_count_customer" : "unread_count_admin"
    await query(
      `UPDATE chat_rooms 
       SET last_message_time = NOW(), ${unreadField} = ${unreadField} + 1 
       WHERE id = ?`,
      [room_id]
    )

    return NextResponse.json({
      success: true,
      data: { id: result.insertId },
    })
  } catch (error) {
    console.error("[Chat] Error sending message:", error)
    return NextResponse.json({ success: false, error: "发送消息失败" }, { status: 500 })
  }
}

// PATCH - 标记消息为已读
export async function PATCH(request: Request) {
  try {
    const { room_id, role } = await request.json()

    if (!room_id || !role) {
      return NextResponse.json({ success: false, error: "聊天室ID和角色不能为空" }, { status: 400 })
    }

    // 标记对方发送的消息为已读
    const senderRole = role === "admin" ? "customer" : "admin"
    await query(
      "UPDATE chat_messages SET is_read = TRUE WHERE room_id = ? AND sender_role = ? AND is_read = FALSE",
      [room_id, senderRole]
    )

    // 重置未读计数
    const unreadField = role === "admin" ? "unread_count_admin" : "unread_count_customer"
    await query(`UPDATE chat_rooms SET ${unreadField} = 0 WHERE id = ?`, [room_id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Chat] Error marking as read:", error)
    return NextResponse.json({ success: false, error: "标记失败" }, { status: 500 })
  }
}
