import { NextResponse } from "next/server"
import { query } from "@/lib/db"

// POST - 商家回复客户
export async function POST(request: Request) {
  try {
    const { customerUsername, replyType, replyContent, adminUsername } = await request.json()

    if (!customerUsername || !replyType || !replyContent || !adminUsername) {
      return NextResponse.json({ 
        success: false, 
        error: "缺少必要参数" 
      }, { status: 400 })
    }

    // 查找或创建聊天室
    let room = await query<any[]>(
      `SELECT id FROM chat_rooms 
       WHERE customer_username = ? AND admin_username = ?`,
      [customerUsername, adminUsername]
    )

    let roomId: number

    if (room.length === 0) {
      // 创建新聊天室
      const result: any = await query(
        `INSERT INTO chat_rooms (customer_username, admin_username) 
         VALUES (?, ?)`,
        [customerUsername, adminUsername]
      )
      roomId = result.insertId
    } else {
      roomId = room[0].id
    }

    // 根据回复类型处理消息
    let messageType: 'text' | 'product' | 'file' = 'text'
    let messageContent = replyContent
    let metadata: any = null

    switch (replyType) {
      case 'text':
        messageType = 'text'
        break
      
      case 'product':
        messageType = 'product'
        // 解析商品ID列表
        const productIds = replyContent.split(',').map((id: string) => id.trim())
        
        // 获取商品信息
        const products = await query<any[]>(
          `SELECT p.id, p.name, p.code, COALESCE(s.quantity, 0) as stock_quantity, p.unit, p.image_url
           FROM products p
           LEFT JOIN inventory_stock s ON p.id = s.product_id
           WHERE p.id IN (${productIds.map(() => '?').join(',')})`,
          productIds
        )
        
        if (products.length === 0) {
          return NextResponse.json({ 
            success: false, 
            error: "未找到指定的商品" 
          }, { status: 404 })
        }
        
        // 构建商品消息内容
        messageContent = `商家向您推荐了以下商品：\n${products.map(p => 
          `📦 ${p.name} (编码: ${p.code})\n   库存: ${p.stock_quantity}${p.unit || '件'}`
        ).join('\n\n')}`
        
        metadata = { products }
        break
      
      case 'quotation':
        messageType = 'file'
        // 获取报价单信息
        const quotations = await query<any[]>(
          `SELECT id, quotation_number, total_amount, status, valid_until
           FROM quotations
           WHERE quotation_number = ?`,
          [replyContent]
        )
        
        if (quotations.length === 0) {
          return NextResponse.json({ 
            success: false, 
            error: "未找到指定的报价单" 
          }, { status: 404 })
        }
        
        const quotation = quotations[0]
        messageContent = `商家向您发送了报价单：\n📋 报价单号: ${quotation.quotation_number}\n💰 总金额: ¥${quotation.total_amount}\n📅 有效期至: ${quotation.valid_until}\n状态: ${quotation.status}`
        
        metadata = { quotation }
        break
      
      default:
        return NextResponse.json({ 
          success: false, 
          error: "不支持的回复类型" 
        }, { status: 400 })
    }

    // 插入消息
    const result: any = await query(
      `INSERT INTO chat_messages 
       (room_id, sender_username, sender_role, message_type, content, metadata) 
       VALUES (?, ?, 'admin', ?, ?, ?)`,
      [roomId, adminUsername, messageType, messageContent, JSON.stringify(metadata)]
    )

    // 更新聊天室
    await query(
      `UPDATE chat_rooms 
       SET last_message_time = NOW(), 
           unread_count_customer = unread_count_customer + 1 
       WHERE id = ?`,
      [roomId]
    )

    return NextResponse.json({
      success: true,
      data: {
        messageId: result.insertId,
        roomId
      }
    })
  } catch (error) {
    console.error("[Chat Reply] Error:", error)
    return NextResponse.json({ 
      success: false, 
      error: "回复客户失败" 
    }, { status: 500 })
  }
}
