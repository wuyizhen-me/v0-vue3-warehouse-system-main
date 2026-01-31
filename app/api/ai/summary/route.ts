import { NextResponse } from "next/server"
import { aiService, type AISummaryRequest } from "@/lib/ai"

// POST - AI摘要生成
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { text, type, config } = body as AISummaryRequest & { config?: { apiKey: string; baseUrl: string; model: string } }

    if (!text || !type) {
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

    const result = await aiService.generateSummary({ text, type })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] AI摘要生成错误:", error)
    return NextResponse.json({ 
      success: false, 
      error: "AI摘要生成失败" 
    }, { status: 500 })
  }
}
