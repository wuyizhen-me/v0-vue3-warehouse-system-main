import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    // 测试数据库连接
    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()
    
    return NextResponse.json({
      success: true,
      message: "数据库连接正常",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("[v0] Database connection error:", error)
    return NextResponse.json({
      success: false,
      error: "数据库连接失败",
      message: "请检查数据库配置是否正确，数据库是否正在运行",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}