import { NextResponse } from "next/server"
import { aiService, type AISuggestionRequest } from "@/lib/ai"

// POST - AI建议生成
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, context, data, config } = body as AISuggestionRequest & { config?: { apiKey: string; baseUrl: string; model: string } }

    if (!type || !context) {
      return NextResponse.json({ 
        success: false, 
        error: "缺少必要的参数" 
      }, { status: 400 })
    }

    // 如果请求中包含配置，则更新AI服务配置
    if (config && config.apiKey) {
      aiService.updateConfig({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl || 'https://api.openai.com',
        model: config.model || 'gpt-3.5-turbo'
      })
    }

    const result = await aiService.generateSuggestion({ type, context, data })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] AI建议生成错误:", error)
    return NextResponse.json({ 
      success: false, 
      error: "AI建议生成失败" 
    }, { status: 500 })
  }
}

// GET - 检查AI服务状态
export async function GET(request: Request) {
  try {
    const isAvailable = await aiService.checkAvailability()
    const config = aiService.getConfig()
    
    return NextResponse.json({
      success: true,
      data: {
        available: isAvailable,
        message: isAvailable ? "AI服务可用" : "AI服务不可用",
        config: {
          baseUrl: config.baseUrl,
          model: config.model,
          hasApiKey: !!config.apiKey
        }
      }
    })
  } catch (error) {
    console.error("[v0] AI服务状态检查错误:", error)
    return NextResponse.json({ 
      success: false, 
      error: "AI服务状态检查失败" 
    }, { status: 500 })
  }
}
