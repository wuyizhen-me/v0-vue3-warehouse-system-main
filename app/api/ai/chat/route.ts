import { NextResponse } from "next/server"
import { query } from "@/lib/db"

// GET - 获取AI聊天记录
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get("username")
    const sessionId = searchParams.get("sessionId")

    if (!username) {
      return NextResponse.json({ success: false, error: "用户名不能为空" }, { status: 400 })
    }

    let messages

    if (sessionId) {
      // 获取特定会话的消息
      messages = await query<any[]>(
        `SELECT * FROM ai_chat_messages 
         WHERE session_id = ? 
         ORDER BY created_at ASC`,
        [sessionId]
      )
    } else {
      // 获取用户的所有AI聊天会话
      const sessions = await query<any[]>(
        `SELECT * FROM ai_chat_sessions 
         WHERE username = ? 
         ORDER BY last_message_time DESC`,
        [username]
      )
      return NextResponse.json({ success: true, data: sessions })
    }

    return NextResponse.json({
      success: true,
      data: messages,
    })
  } catch (error) {
    console.error("[AI Chat] Error fetching messages:", error)
    return NextResponse.json({ success: false, error: "获取AI聊天记录失败" }, { status: 500 })
  }
}

// POST - 发送AI聊天消息
export async function POST(request: Request) {
  try {
    const { username, content, session_id, sender_type = "user" } = await request.json()

    if (!username || !content) {
      return NextResponse.json({ success: false, error: "用户名和内容不能为空" }, { status: 400 })
    }

    let sessionId = session_id

    // 如果没有会话ID，创建新会话
    if (!sessionId) {
      const result: any = await query(
        `INSERT INTO ai_chat_sessions (username, title) 
         VALUES (?, ?)`,
        [username, "新会话"]
      )
      sessionId = result.insertId
    }

    // 插入消息
    const result: any = await query(
      `INSERT INTO ai_chat_messages (session_id, sender_type, content) 
       VALUES (?, ?, ?)`,
      [sessionId, sender_type, content]
    )

    // 更新会话最后消息时间
    await query(
      `UPDATE ai_chat_sessions 
       SET last_message_time = NOW() 
       WHERE id = ?`,
      [sessionId]
    )

    return NextResponse.json({
      success: true,
      data: { id: result.insertId, session_id: sessionId },
    })
  } catch (error) {
    console.error("[AI Chat] Error sending message:", error)
    return NextResponse.json({ success: false, error: "发送AI消息失败" }, { status: 500 })
  }
}
