import { NextResponse } from "next/server"
import { query } from "@/lib/db"

// GET - 获取某条留言的所有回复
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const messageId = params.id

    const replies = await query<any[]>(
      `SELECT * FROM messages 
       WHERE parent_id = ? 
       ORDER BY created_at ASC`,
      [messageId]
    )

    return NextResponse.json({
      success: true,
      data: replies,
    })
  } catch (error) {
    console.error("[Messages] Error fetching replies:", error)
    return NextResponse.json({ success: false, error: "获取回复失败" }, { status: 500 })
  }
}
