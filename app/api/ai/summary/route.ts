import { NextResponse } from "next/server"
import { aiService, type AISummaryRequest } from "@/lib/ai"

// POST - AI摘要生成
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { text, type } = body as AISummaryRequest

    if (!text || !type) {
      return NextResponse.json({ 
        success: false, 
        error: "缺少必要的参数" 
      }, { status: 400 })
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