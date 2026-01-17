import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

export async function POST(request: NextRequest) {
  try {
    const { host, port, user, password, database } = await request.json()

    // 创建数据库连接
    const connection = await mysql.createConnection({
      host: host || 'localhost',
      port: parseInt(port) || 3306,
      user: user || 'root',
      password: password || '',
      database: database || 'warehouse',
      connectTimeout: 5000, // 5秒超时
    })

    // 测试连接
    await connection.ping()
    
    // 关闭连接
    await connection.end()

    return NextResponse.json({
      success: true,
      message: '数据库连接成功'
    })

  } catch (error) {
    console.error('数据库连接测试失败:', error)
    
    let errorMessage = '数据库连接失败'
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        errorMessage = '数据库连接被拒绝，请检查主机地址和端口'
      } else if (error.message.includes('ER_ACCESS_DENIED_ERROR')) {
        errorMessage = '用户名或密码错误'
      } else if (error.message.includes('ER_BAD_DB_ERROR')) {
        errorMessage = '数据库不存在'
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 })
  }
}