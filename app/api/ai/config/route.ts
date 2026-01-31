import { NextResponse } from "next/server"

// GET - 获取AI配置
export async function GET(request: Request) {
  try {
    // 从环境变量获取配置
    const config = {
      apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY || "",
      baseUrl: process.env.AI_BASE_URL || "https://api.openai.com",
      model: process.env.AI_MODEL || "gpt-3.5-turbo"
    }

    return NextResponse.json({
      success: true,
      data: config
    })
  } catch (error) {
    console.error("[AI Config] Error fetching config:", error)
    return NextResponse.json({
      success: false,
      error: "获取AI配置失败"
    }, { status: 500 })
  }
}

// POST - 测试AI配置
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { apiKey, baseUrl, model } = body

    if (!apiKey || !baseUrl) {
      return NextResponse.json({
        success: false,
        error: "API密钥和Base URL不能为空"
      }, { status: 400 })
    }

    // 测试AI连接
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: "Hello"
          }
        ],
        max_tokens: 5
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("AI API Test Error:", errorData)
      return NextResponse.json({
        success: false,
        error: "AI连接测试失败，请检查配置"
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "AI连接测试成功"
    })
  } catch (error) {
    console.error("[AI Config] Error testing config:", error)
    return NextResponse.json({
      success: false,
      error: "AI连接测试失败"
    }, { status: 500 })
  }
}
