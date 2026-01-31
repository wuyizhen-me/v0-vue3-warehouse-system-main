import { NextResponse } from "next/server"
import { query } from "@/lib/db"

interface CommunicationLog {
  id: number
  client_name: string
  message: string
  log_type: "inbound" | "outbound"
  log_time: Date
}

// GET - 获取沟通日志
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const client = searchParams.get("client")
    const limit = parseInt(searchParams.get("limit") || "100")

    let sql = "SELECT * FROM communication_logs"
    const params: any[] = []

    if (client) {
      sql += " WHERE client_name LIKE ?"
      params.push(`%${client}%`)
    }

    sql += " ORDER BY log_time DESC LIMIT ?"
    params.push(limit)

    const logs = await query<CommunicationLog[]>(sql, params)

    return NextResponse.json({
      success: true,
      data: logs,
    })
  } catch (error) {
    console.error("[Communications] Error fetching logs:", error)
    return NextResponse.json({ success: false, error: "获取沟通日志失败" }, { status: 500 })
  }
}

// POST - 添加沟通日志
export async function POST(request: Request) {
  try {
    const { client_name, message, log_type } = await request.json()

    if (!client_name || !log_type) {
      return NextResponse.json({ success: false, error: "客户名称和类型不能为空" }, { status: 400 })
    }

    if (!["inbound", "outbound"].includes(log_type)) {
      return NextResponse.json({ success: false, error: "类型必须是 inbound 或 outbound" }, { status: 400 })
    }

    const result: any = await query(
      "INSERT INTO communication_logs (client_name, message, log_type) VALUES (?, ?, ?)",
      [client_name, message || null, log_type]
    )

    return NextResponse.json({
      success: true,
      data: { id: result.insertId },
    })
  } catch (error) {
    console.error("[Communications] Error adding log:", error)
    return NextResponse.json({ success: false, error: "添加沟通日志失败" }, { status: 500 })
  }
}

// DELETE - 删除沟通日志
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID不能为空" }, { status: 400 })
    }

    await query("DELETE FROM communication_logs WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Communications] Error deleting log:", error)
    return NextResponse.json({ success: false, error: "删除沟通日志失败" }, { status: 500 })
  }
}
