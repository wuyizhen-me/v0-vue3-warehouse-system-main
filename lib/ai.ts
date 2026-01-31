export interface AIResponse {
  success: boolean
  data?: string
  error?: string
}

export interface AISuggestionRequest {
  type: 'product_name' | 'description' | 'category' | 'price' | 'stock_analysis'
  context: string
  data?: any
}

export interface AISummaryRequest {
  text: string
  type: 'product_detail' | 'selected_text' | 'overview'
}

export interface AIConfig {
  apiKey: string
  baseUrl: string
  model: string
}

class AIService {
  private static instance: AIService
  private isAvailable = false
  private config: AIConfig = {
    apiKey: '',
    baseUrl: 'https://api.openai.com',
    model: 'gpt-3.5-turbo'
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  constructor() {
    // 从环境变量中读取AI配置（作为默认值）
    this.config.apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || ''
    this.config.baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com'
    this.config.model = process.env.AI_MODEL || 'gpt-3.5-turbo'
  }

  // 更新配置
  updateConfig(config: Partial<AIConfig>) {
    this.config = { ...this.config, ...config }
    this.checkAvailability()
  }

  // 获取当前配置
  getConfig(): AIConfig {
    return { ...this.config }
  }

  // 检查AI服务是否可用
  async checkAvailability(): Promise<boolean> {
    try {
      this.isAvailable = !!this.config.apiKey && !!this.config.baseUrl
      return this.isAvailable
    } catch (error) {
      this.isAvailable = false
      return false
    }
  }

  // 生成AI建议
  async generateSuggestion(request: AISuggestionRequest): Promise<AIResponse> {
    if (!this.isAvailable) {
      return { success: false, error: 'AI服务不可用' }
    }

    try {
      let prompt = ''
      
      switch (request.type) {
        case 'product_name':
          prompt = `基于以下上下文生成5个专业的商品名称建议：\n"${request.context}"\n\n要求：\n1. 名称简洁专业\n2. 突出商品特点\n3. 适合商业使用\n4. 用中文输出\n5. 格式为：1. 建议名称1\n2. 建议名称2\n...`
          break
        case 'description':
          prompt = `为商品生成详细的中文描述：\n\n商品信息：\n- 上下文：${request.context}\n- 额外数据：${JSON.stringify(request.data || {})}\n\n要求：\n1. 突出商品的优势和特点\n2. 语言流畅自然\n3. 适合电商平台\n4. 长度适中（100-200字）`
          break
        case 'category':
          prompt = `为商品推荐合适的中文分类：\n\n商品信息：${request.context}\n\n要求：\n1. 分类准确，符合商业分类标准\n2. 可以是多级分类，用" > "分隔\n3. 输出单个最合适的分类`
          break
        case 'price':
          prompt = `为商品提供价格建议：\n\n商品信息：\n- 上下文：${request.context}\n- 相关数据：${JSON.stringify(request.data || {})}\n\n要求：\n1. 基于商品特点提供合理的价格区间\n2. 考虑市场定位\n3. 用中文输出，格式为："建议价格：¥X - ¥Y"`
          break
        case 'stock_analysis':
          prompt = `分析商品库存情况并提供建议：\n\n库存数据：${JSON.stringify(request.data)}\n\n要求：\n1. 基于库存数量和安全库存进行分析\n2. 提供明确的建议（如补货、调整采购计划等）\n3. 语言简洁明了\n4. 用中文输出`
          break
        default:
          return { success: false, error: '暂不支持此类型的建议' }
      }

      const response = await this.callOpenAI(prompt)
      return { success: true, data: response }
    } catch (error) {
      console.error('AI建议生成失败:', error)
      return { success: false, error: 'AI建议生成失败' }
    }
  }

  // 生成文本摘要
  async generateSummary(request: AISummaryRequest): Promise<AIResponse> {
    if (!this.isAvailable) {
      return { success: false, error: 'AI服务不可用' }
    }

    try {
      let prompt = ''
      
      switch (request.type) {
        case 'product_detail':
          prompt = `请为以下商品详情生成一个简洁的中文摘要：\n\n${request.text}\n\n要求：\n1. 突出商品的核心特点和优势\n2. 长度控制在150字以内\n3. 语言流畅自然\n4. 适合用于产品列表展示`
          break
        case 'selected_text':
          prompt = `请为以下文本生成一个精准的中文摘要：\n\n${request.text}\n\n要求：\n1. 保留核心信息\n2. 简明扼要\n3. 不超过100字\n4. 用中文输出`
          break
        case 'overview':
          prompt = `请基于以下数据生成一个综合性的中文概况分析：\n\n${request.text}\n\n要求：\n1. 全面分析数据趋势和关键点\n2. 提供有价值的见解和建议\n3. 语言专业严谨\n4. 用中文输出`
          break
        default:
          return { success: false, error: '暂不支持此类型的摘要' }
      }

      const response = await this.callOpenAI(prompt)
      return { success: true, data: response }
    } catch (error) {
      console.error('AI摘要生成失败:', error)
      return { success: false, error: 'AI摘要生成失败' }
    }
  }

  // 调用OpenAI API
  private async callOpenAI(prompt: string): Promise<string> {
    try {
      // 清理 baseUrl，移除末尾的斜杠和路径
      let baseUrl = this.config.baseUrl.trim()
      // 移除末尾的斜杠
      baseUrl = baseUrl.replace(/\/$/, '')
      // 如果 baseUrl 包含 /v1/chat/completions，移除它
      baseUrl = baseUrl.replace(/\/v1\/chat\/completions$/, '')
      
      const apiUrl = `${baseUrl}/v1/chat/completions`
      
      console.log('[AI] Calling OpenAI API:', {
        baseUrl: this.config.baseUrl,
        cleanedBaseUrl: baseUrl,
        apiUrl,
        model: this.config.model,
        hasApiKey: !!this.config.apiKey
      })

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的仓库管理系统AI助手，使用中文回答问题。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      })

      // 首先检查响应状态
      if (!response.ok) {
        let errorMessage = 'OpenAI API请求失败'
        let errorData: any = {}
        try {
          const text = await response.text()
          console.error('[AI] API Error Response Text:', text)
          try {
            errorData = JSON.parse(text)
          } catch {
            errorData = { raw: text }
          }
          console.error('[AI] OpenAI API Error:', errorData)
          errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}: ${response.statusText}`
        } catch (e) {
          console.error('[AI] Failed to parse error response:', e)
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      // 解析响应数据
      let data: any
      try {
        const text = await response.text()
        console.log('[AI] API Response Text:', text.substring(0, 500))
        data = JSON.parse(text)
      } catch (e) {
        console.error('[AI] Failed to parse response JSON:', e)
        throw new Error('无法解析API响应')
      }

      console.log('[AI] Parsed API Response:', {
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : [],
        hasChoices: data && Array.isArray(data.choices),
        choicesLength: data && data.choices ? data.choices.length : 0
      })

      // 验证响应数据结构
      if (!data) {
        throw new Error('API返回空数据')
      }

      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        console.error('[AI] Invalid API response structure:', JSON.stringify(data, null, 2))
        throw new Error(`API响应格式错误：缺少choices字段。响应内容: ${JSON.stringify(data).substring(0, 200)}`)
      }

      const firstChoice = data.choices[0]
      if (!firstChoice.message || typeof firstChoice.message.content !== 'string') {
        console.error('[AI] Invalid choice structure:', firstChoice)
        throw new Error('API响应格式错误：缺少message.content字段')
      }

      return firstChoice.message.content
    } catch (error) {
      console.error('[AI] 调用OpenAI API失败:', error)
      throw error
    }
  }
}

export const aiService = AIService.getInstance()
