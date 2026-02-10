import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { ConversationManager } from "@/lib/ai/conversation-manager"
import { createAIClient } from "@/lib/ai/client"

// POST - AI客户助手处理请求
export async function POST(request: Request) {
  try {
    const { username, content, conversation, config } = await request.json()

    if (!username || !content) {
      return NextResponse.json({ 
        success: false, 
        error: "用户名和内容不能为空" 
      }, { status: 400 })
    }

    // 获取用户的对话ID
    const conversationId = await ConversationManager.getConversationId(username, 'customer')

    // 生成客户助手提示词（包含商品列表和用户历史记录）
    const systemPrompt = await generateCustomerPrompt(username)
    
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
      await ConversationManager.saveConversationId(username, 'customer', newConversationId)
    }

    return NextResponse.json({
      success: true,
      data: responseContent
    })
  } catch (error) {
    console.error("[AI Customer] Error processing request:", error)
    return NextResponse.json({ 
      success: false, 
      error: "处理请求失败" 
    }, { status: 500 })
  }
}

// 调用AI服务
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
      const defaultResponse = generateDefaultResponse(userContent)
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
    const defaultResponse = generateDefaultResponse(userContent)
    return { responseContent: defaultResponse, newConversationId: null }
  }
}

// 生成默认响应
function generateDefaultResponse(userContent: string): string {
  if (userContent.includes("商品") || userContent.includes("产品")) {
    return "您好！我可以帮您查询商品信息。请告诉我您想了解哪个商品？"
  } else if (userContent.includes("报价") || userContent.includes("价格")) {
    return "我可以帮您生成报价表。请告诉我您需要哪些商品的报价？"
  } else if (userContent.includes("留言") || userContent.includes("联系")) {
    return "我可以帮您给商家留言。请告诉我您想说什么？"
  } else if (userContent.includes("帮助")) {
    return `我可以帮助您：\n1. 查询商品信息\n2. 生成报价表\n3. 给商家留言\n请告诉我您需要什么帮助？`
  } else {
    return "您好！我是AI客服助手，很高兴为您服务。我可以帮您查询商品、生成报价表或给商家留言。"
  }
}

// 生成客户助手提示词
async function generateCustomerPrompt(username: string) {
  // 获取商品列表
  const products = await query<any[]>(
    `SELECT p.id, p.name, p.code, p.category, p.brand, 
            COALESCE(s.quantity, 0) as stock_quantity, p.unit, 
            p.description, p.image_url
     FROM products p
     LEFT JOIN inventory_stock s ON p.id = s.product_id
     WHERE p.status = 'active'
     ORDER BY p.updated_at DESC 
     LIMIT 50`
  )
  
  // 获取用户历史行为
  const userBehaviors = await query<any[]>(
    `SELECT behavior_type, product_id, search_keyword, behavior_time
     FROM user_behaviors
     WHERE username = ?
     ORDER BY behavior_time DESC
     LIMIT 20`,
    [username]
  )
  
  // 格式化商品列表
  const productList = products.map(p => 
    `- ID:${p.id} | ${p.name} (编码:${p.code}) | 分类:${p.category || '未分类'} | 品牌:${p.brand || '无'} | 库存:${p.stock_quantity}${p.unit || '件'}`
  ).join('\n')
  
  // 格式化用户行为
  const behaviorList = userBehaviors.map(b => {
    const time = new Date(b.behavior_time).toLocaleString('zh-CN')
    let desc = ''
    switch (b.behavior_type) {
      case 'view_product':
        desc = `查看了商品ID:${b.product_id}`
        break
      case 'search':
        desc = `搜索了"${b.search_keyword}"`
        break
      case 'add_to_quote':
        desc = `添加商品ID:${b.product_id}到报价单`
        break
      default:
        desc = b.behavior_type
    }
    return `- [${time}] ${desc}`
  }).join('\n')
  
  const systemPrompt = `你是一个智能客服助手，负责帮助客户处理商品咨询、报价请求和留言等事务。

当前可用商品列表（最近50个）：
${productList || '暂无商品'}

用户历史行为记录：
${behaviorList || '暂无历史记录'}

系统操作说明：
1. 显示指定商品：当用户询问特定商品信息时，使用格式【显示商品:{商品ID}】
2. 生成报价表：当用户需要报价表时，使用格式【生成报价表:{商品ID列表，用逗号分隔}】
3. 商家留言：当用户需要给商家留言时，使用格式【商家留言:{留言内容}】

请根据以上信息，为用户提供准确友好的回复：
- 当用户询问商品信息时，参考商品列表提供准确数据
- 根据用户以往行为记录，提供个性化的商品推荐
- 当用户需要报价时，帮助用户选择合适的商品并生成报价表
- 当用户需要留言时，帮助用户整理留言内容
- 提供友好的中文回复，并在需要时使用系统操作格式。`
    
  return systemPrompt
}
