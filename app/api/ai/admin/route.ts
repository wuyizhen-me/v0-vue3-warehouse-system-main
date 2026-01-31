import { NextResponse } from "next/server"
import { query } from "@/lib/db"

// POST - AI商家助手处理请求
export async function POST(request: Request) {
  try {
    const { username, content, conversation, config } = await request.json()

    if (!username || !content) {
      return NextResponse.json({ success: false, error: "用户名和内容不能为空" }, { status: 400 })
    }

    // 生成商家助手提示词（包含商品列表和未读消息列表）
    const systemPrompt = await generateAdminPrompt()
    
    // 调用AI服务
    const responseContent = await callAIService(
      systemPrompt, 
      content, 
      conversation,
      config || {
        apiKey: process.env.OPENAI_API_KEY || "",
        baseUrl: "https://api.openai.com",
        model: "gpt-3.5-turbo"
      }
    )

    // 检查是否包含系统操作指令，如果没有，尝试解析AI响应
    if (!responseContent.includes("【创建商品:") && !responseContent.includes("【编辑商品:")) {
      // 解析AI响应，提取可能的系统操作
      const parsedResponse = parseAIResponse(responseContent, content)
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
  config: { apiKey: string; baseUrl: string; model: string }
): Promise<string> {
  try {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY || ""
    const baseUrl = config.baseUrl || "https://api.openai.com"
    const model = config.model || "gpt-3.5-turbo"
    
    if (!apiKey) {
      console.error("OPENAI_API_KEY is not set")
      // 如果API密钥未设置，返回默认响应
      return generateDefaultResponse(userContent)
    }
    
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          ...conversation.map((msg: any) => ({
            role: msg.sender === "user" ? "user" : "assistant",
            content: msg.content
          })),
          { role: "user", content: userContent }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error("AI API Error:", errorData)
      return "抱歉，AI服务暂时不可用，请稍后重试。"
    }
    
    const data = await response.json()
    return data.choices[0].message.content || ""
  } catch (error) {
    console.error("Error calling AI service:", error)
    // 如果API调用失败，返回默认响应
    return generateDefaultResponse(userContent)
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
function parseAIResponse(aiResponse: string, userContent: string): string {
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
  
  // 默认返回AI原始响应
  return aiResponse
}

// 生成商家助手提示词
async function generateAdminPrompt() {
  // 获取商品列表
  const products = await query<any[]>(
    `SELECT id, name, sku, stock_quantity, min_stock_alert, price 
     FROM products 
     ORDER BY updated_at DESC 
     LIMIT 20`
  )
  
  // 获取未读消息列表
  const unreadMessages = await query<any[]>(
    `SELECT cm.id, cm.content, cm.created_at, u.username, u.nickname
     FROM chat_messages cm
     LEFT JOIN users u ON cm.sender_id = u.id
     WHERE cm.is_read = FALSE
     ORDER BY cm.created_at DESC
     LIMIT 10`
  )
  
  // 格式化商品列表
  const productList = products.map(p => 
    `- ID:${p.id} | ${p.name} (SKU:${p.sku}) | 库存:${p.stock_quantity} | 安全库存:${p.min_stock_alert} | 价格:¥${p.price}`
  ).join('\n')
  
  // 格式化未读消息列表
  const messageList = unreadMessages.map(m => 
    `- [${m.created_at}] ${m.nickname || m.username}: ${m.content?.substring(0, 50)}${m.content?.length > 50 ? '...' : ''}`
  ).join('\n')
  
  const systemPrompt = `你是一个智能商家助手，负责帮助商家管理商品和处理消息。

当前商品列表（最近20个）：
${productList || '暂无商品'}

未读消息列表（最近10条）：
${messageList || '暂无未读消息'}

系统操作说明：
1. 创建商品：当用户需要创建商品时，使用格式【创建商品:{商品ID}】
2. 编辑商品：当用户需要编辑商品时，使用格式【编辑商品:{商品ID}】
3. 未读消息：当用户需要查看未读消息时，直接返回未读消息数量

请根据以上商品列表和未读消息列表，为用户提供准确的回复：
- 当用户询问商品信息时，参考商品列表提供准确数据
- 当用户询问消息时，参考未读消息列表提供详细信息
- 当库存低于安全库存时，主动提醒用户补货
- 提供友好的中文回复，并在需要时使用系统操作格式。`
    
  return systemPrompt
}
