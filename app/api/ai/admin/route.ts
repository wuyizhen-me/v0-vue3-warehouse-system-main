import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { ConversationManager } from "@/lib/ai/conversation-manager"
import { createAIClient } from "@/lib/ai/client"

// POST - AI商家助手处理请求
export async function POST(request: Request) {
  try {
    const { username, content, conversation, config } = await request.json()

    if (!username || !content) {
      return NextResponse.json({ success: false, error: "用户名和内容不能为空" }, { status: 400 })
    }

    // 获取用户的对话ID
    const conversationId = await ConversationManager.getConversationId(username, 'admin')

    // 生成商家助手提示词（包含商品列表、未读消息列表和用户历史记录）
    const systemPrompt = await generateAdminPrompt(username)
    
    // 调用AI服务
    const { responseContent, newConversationId } = await callAIService(
      systemPrompt, 
      content, 
      conversation,
      conversationId,
      config || {
        apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY || "",
        baseUrl: process.env.AI_BASE_URL || "https://api.openai.com",
        model: process.env.AI_MODEL || "gpt-3.5-turbo"
      }
    )

    // 保存新的对话ID
    if (newConversationId) {
      await ConversationManager.saveConversationId(username, 'admin', newConversationId)
    }

    // 检查是否包含系统操作指令，如果没有，尝试解析AI响应
    if (!responseContent.includes("【创建商品:") && !responseContent.includes("【编辑商品:") && !responseContent.includes("【回复客户:")) {
      // 解析AI响应，提取可能的系统操作
      const parsedResponse = await parseAIResponse(responseContent, content)
      return NextResponse.json({
        success: true,
        data: parsedResponse
      })
    }

    return NextResponse.json({
      success: true,
      data: responseContent
    })
  } catch (error) {
    console.error("[AI Admin] Error processing request:", error)
    return NextResponse.json({ success: false, error: "处理请求失败" }, { status: 500 })
  }
}

// 调用AI服务（真实API调用）
async function callAIService(
  systemPrompt: string, 
  userContent: string, 
  conversation: any[],
  conversationId: string | null,
  config: { apiKey: string; baseUrl: string; model: string }
): Promise<{ responseContent: string; newConversationId: string | null }> {
  try {
    const apiKey = config.apiKey || process.env.AI_API_KEY || process.env.OPENAI_API_KEY || ""
    
    if (!apiKey) {
      console.error("AI_API_KEY is not set")
      // 如果API密钥未设置，返回默认响应
      const defaultResponse = await generateDefaultResponse(userContent)
      return { responseContent: defaultResponse, newConversationId: null }
    }
    
    // 使用AI客户端
    const aiClient = createAIClient(config)
    
    // 构建对话历史
    const conversationHistory = conversation.map((msg: any) => ({
      role: msg.sender === "user" ? "user" as const : "assistant" as const,
      content: msg.content
    }))
    
    const result = await aiClient.simpleChat(
      systemPrompt,
      userContent,
      conversationId || undefined,
      conversationHistory
    )
    
    return {
      responseContent: result.content,
      newConversationId: result.conversationId
    }
  } catch (error) {
    console.error("Error calling AI service:", error)
    // 如果API调用失败，返回默认响应
    const defaultResponse = await generateDefaultResponse(userContent)
    return { responseContent: defaultResponse, newConversationId: null }
  }
}

// 生成默认响应（当AI API不可用时使用）
async function generateDefaultResponse(userContent: string): Promise<string> {
  let aiResponse = ""
  
  if (userContent.includes("创建商品") || userContent.includes("添加商品")) {
    aiResponse = "我可以帮您创建商品。【创建商品:new】"
  } else if (userContent.includes("编辑商品") || userContent.includes("修改商品")) {
    const productId = userContent.match(/(\d+)/)?.[0]
    if (productId) {
      aiResponse = `我可以帮您编辑商品ID为${productId}的商品。【编辑商品:${productId}】`
      return aiResponse
    } 
    
    // 检查是否有具体的商品名称
    const productName = userContent.replace(/编辑商品|修改商品/g, "").trim()
    if (productName) {
      // 查找商品ID
      const products = await query<any[]>(
        `SELECT id FROM products WHERE name LIKE ? LIMIT 1`,
        [`%${productName}%`]
      )
      if (products.length > 0) {
        aiResponse = `我可以帮您编辑商品"${productName}"。【编辑商品:${products[0].id}】`
      } else {
        aiResponse = `未找到商品"${productName}"，请提供商品ID或更准确的商品名称。`
      }
    } else {
      aiResponse = "请提供要编辑的商品ID或商品名称。"
    }
  } else if (userContent.includes("未读消息") || userContent.includes("消息总结")) {
    // 获取未读消息数量
    const unreadMessages = await query<any[]>(
      `SELECT COUNT(*) as count FROM chat_messages WHERE is_read = FALSE`
    )
    aiResponse = `您有 ${unreadMessages[0].count} 条未读消息。`
  } else if (userContent.includes("帮助")) {
    aiResponse = `我可以帮助您：\n1. 创建商品 - 输入\"创建商品\"\n2. 编辑商品 - 输入\"编辑商品 [商品ID]\"或\"编辑商品 [商品名称]\"\n3. 查看未读消息 - 输入\"未读消息\"或\"消息总结\"`
  } else {
    aiResponse = `您好！我是您的AI商家助手。我可以帮助您创建商品、编辑商品和查看未读消息。您可以输入\"帮助\"查看更多功能。`
  }
  
  return aiResponse
}

// 解析AI响应，提取可能的系统操作
async function parseAIResponse(aiResponse: string, userContent: string): Promise<string> {
  // 检查是否包含创建商品的意图
  if ((userContent.includes("创建商品") || userContent.includes("添加商品")) && !aiResponse.includes("【创建商品:")) {
    return `【创建商品:new】`
  }
  
  // 检查是否包含编辑商品的意图
  if ((userContent.includes("编辑商品") || userContent.includes("修改商品")) && !aiResponse.includes("【编辑商品:")) {
    const productId = userContent.match(/(\d+)/)?.[0]
    if (productId) {
      return `【编辑商品:${productId}】`
    }
  }
  
  // 检查是否包含回复客户的意图
  if ((userContent.includes("回复") || userContent.includes("发送")) && 
      (userContent.includes("客户") || userContent.includes("消息")) && 
      !aiResponse.includes("【回复客户:")) {
    // 尝试从用户内容中提取客户名和回复内容
    const customerMatch = userContent.match(/客户[：:]\s*(\w+)/)
    const messageIdMatch = userContent.match(/消息ID[：:]\s*(\d+)/)
    
    if (customerMatch || messageIdMatch) {
      let customerUsername = customerMatch?.[1]
      
      // 如果有消息ID，从数据库获取客户用户名
      if (messageIdMatch && !customerUsername) {
        const messages = await query<any[]>(
          `SELECT cr.customer_username 
           FROM chat_messages cm
           JOIN chat_rooms cr ON cm.room_id = cr.id
           WHERE cm.id = ?`,
          [messageIdMatch[1]]
        )
        if (messages.length > 0) {
          customerUsername = messages[0].customer_username
        }
      }
      
      if (customerUsername) {
        // 提取回复内容
        const replyContent = userContent
          .replace(/回复|发送|客户[：:]\s*\w+|消息ID[：:]\s*\d+/g, '')
          .trim()
        
        if (replyContent) {
          return `【回复客户:${customerUsername}|类型:text|内容:${replyContent}】`
        }
      }
    }
  }
  
  // 默认返回AI原始响应
  return aiResponse
}

// 生成商家助手提示词
async function generateAdminPrompt(username: string) {
  // 获取商品列表
  const products = await query<any[]>(
    `SELECT p.id, p.name, p.code, COALESCE(s.quantity, 0) as stock_quantity, 
            p.min_stock_alert, p.unit, p.description
     FROM products p
     LEFT JOIN inventory_stock s ON p.id = s.product_id
     WHERE p.status = 'active'
     ORDER BY p.updated_at DESC 
     LIMIT 30`
  )
  
  // 获取未读消息列表（来自客户的消息）
  const unreadMessages = await query<any[]>(
    `SELECT cm.id, cm.content, cm.created_at, cm.sender_username, cr.customer_username
     FROM chat_messages cm
     JOIN chat_rooms cr ON cm.room_id = cr.id
     WHERE cm.is_read = FALSE AND cm.sender_role = 'customer'
     ORDER BY cm.created_at DESC
     LIMIT 10`
  )
  
  // 获取用户历史行为（最近的操作记录）
  const userHistory = await query<any[]>(
    `SELECT action, action_time 
     FROM user_history 
     WHERE username = ? 
     ORDER BY action_time DESC 
     LIMIT 10`,
    [username]
  )
  
  // 格式化商品列表
  const productList = products.map(p => 
    `- ID:${p.id} | ${p.name} (编码:${p.code}) | 库存:${p.stock_quantity}${p.unit || '件'} | 安全库存:${p.min_stock_alert}${p.unit || '件'}${p.stock_quantity <= p.min_stock_alert ? ' ⚠️库存不足' : ''}`
  ).join('\n')
  
  // 格式化未读消息列表
  const messageList = unreadMessages.map(m => {
    const time = new Date(m.created_at).toLocaleString('zh-CN')
    return `- [消息ID:${m.id}] [${time}] 客户${m.customer_username}: ${m.content?.substring(0, 100)}${m.content?.length > 100 ? '...' : ''}`
  }).join('\n')
  
  // 格式化用户历史
  const historyList = userHistory.map(h => {
    const time = new Date(h.action_time).toLocaleString('zh-CN')
    return `- [${time}] ${h.action}`
  }).join('\n')
  
  const systemPrompt = `你是一个智能商家助手，负责帮助商家管理商品、处理客户消息和生成报价。

当前商品列表（最近30个）：
${productList || '暂无商品'}

未读客户消息列表（最近10条）：
${messageList || '暂无未读消息'}

用户最近操作记录：
${historyList || '暂无历史记录'}

系统操作说明：
1. 创建商品：当用户需要创建商品时，使用格式【创建商品:new】
2. 编辑商品：当用户需要编辑商品时，使用格式【编辑商品:{商品ID}】
3. 回复客户：当用户需要回复客户消息时，使用以下格式：
   【回复客户:{客户用户名}|类型:{text/product/quotation}|内容:{回复内容或商品ID或报价单号}】
   
   回复类型说明：
   - text: 文本回复，内容为文本消息
   - product: 发送商品，内容为商品ID，可以用逗号分隔多个商品ID
   - quotation: 发送报价表，内容为报价单号

回复客户示例：
- 文本回复：【回复客户:customer123|类型:text|内容:您好，我们的产品质量很好】
- 发送商品：【回复客户:customer123|类型:product|内容:1,2,3】（发送商品ID为1,2,3的商品）
- 发送报价表：【回复客户:customer123|类型:quotation|内容:QT2024001】

请根据以上信息，为用户提供准确的回复：
- 当用户询问商品信息时，参考商品列表提供准确数据
- 当用户询问消息时，参考未读消息列表提供详细信息
- 当库存低于安全库存时，主动提醒用户补货
- 当用户需要回复客户时，使用【回复客户】格式
- 根据用户以往记录（操作历史）提供个性化建议
- 提供友好的中文回复，并在需要时使用系统操作格式。`
    
  return systemPrompt
}
