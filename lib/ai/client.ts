/**
 * AI客户端 - 支持对话ID持久化
 * 兼容通义千问API格式
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIClientConfig {
  apiKey: string
  baseUrl: string
  model: string
}

export interface AIResponse {
  id: string
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  created?: number
}

export class AIClient {
  private config: AIClientConfig

  constructor(config: AIClientConfig) {
    this.config = config
  }

  /**
   * 调用AI API
   * @param messages 消息列表
   * @param conversationId 可选的对话ID，用于接续上下文
   * @param stream 是否使用流式响应
   * @returns AI响应
   */
  async chat(
    messages: AIMessage[],
    conversationId?: string,
    stream: boolean = false
  ): Promise<AIResponse> {
    try {
      // 清理 baseUrl
      let baseUrl = this.config.baseUrl.trim().replace(/\/$/, '')
      baseUrl = baseUrl.replace(/\/v1\/chat\/completions$/, '')
      
      const apiUrl = `${baseUrl}/v1/chat/completions`
      
      const requestBody: any = {
        model: this.config.model,
        messages,
        stream
      }

      // 如果有对话ID，添加到请求中
      if (conversationId) {
        requestBody.conversation_id = conversationId
      }

      console.log('[AIClient] Calling API:', {
        url: apiUrl,
        model: this.config.model,
        hasConversationId: !!conversationId,
        conversationId,
        messageCount: messages.length
      })

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[AIClient] API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        throw new Error(`AI API请求失败: ${response.status} ${response.statusText}`)
      }

      const data: AIResponse = await response.json()
      
      console.log('[AIClient] API Response:', {
        id: data.id,
        hasChoices: !!data.choices && data.choices.length > 0,
        usage: data.usage
      })

      return data
    } catch (error) {
      console.error('[AIClient] Error calling AI API:', error)
      throw error
    }
  }

  /**
   * 简化的聊天方法
   * @param systemPrompt 系统提示词
   * @param userMessage 用户消息
   * @param conversationId 可选的对话ID
   * @param conversationHistory 可选的对话历史
   * @returns AI回复内容和对话ID
   */
  async simpleChat(
    systemPrompt: string,
    userMessage: string,
    conversationId?: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant', content: string }>
  ): Promise<{ content: string; conversationId: string }> {
    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt }
    ]

    // 添加对话历史
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory)
    }

    // 添加当前用户消息
    messages.push({ role: 'user', content: userMessage })

    const response = await this.chat(messages, conversationId)

    if (!response.choices || response.choices.length === 0) {
      throw new Error('AI API返回的响应格式错误')
    }

    return {
      content: response.choices[0].message.content,
      conversationId: response.id
    }
  }
}

/**
 * 创建AI客户端实例
 */
export function createAIClient(config?: Partial<AIClientConfig>): AIClient {
  const defaultConfig: AIClientConfig = {
    apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '',
    baseUrl: process.env.AI_BASE_URL || 'https://api.openai.com',
    model: process.env.AI_MODEL || 'gpt-3.5-turbo'
  }

  return new AIClient({ ...defaultConfig, ...config })
}
