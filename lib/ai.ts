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

class AIService {
  private static instance: AIService
  private isAvailable = false

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  // 检查AI服务是否可用
  async checkAvailability(): Promise<boolean> {
    try {
      // 这里可以检查本地AI模型是否可用
      // 暂时返回true，表示原生AI可用
      this.isAvailable = true
      return true
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
      let suggestion = ''
      
      switch (request.type) {
        case 'product_name':
          suggestion = this.generateProductNameSuggestion(request.context)
          break
        case 'description':
          suggestion = this.generateDescriptionSuggestion(request.context, request.data)
          break
        case 'category':
          suggestion = this.generateCategorySuggestion(request.context)
          break
        case 'price':
          suggestion = this.generatePriceSuggestion(request.context, request.data)
          break
        case 'stock_analysis':
          suggestion = this.generateStockAnalysis(request.data)
          break
        default:
          suggestion = '暂不支持此类型的建议'
      }

      return { success: true, data: suggestion }
    } catch (error) {
      return { success: false, error: 'AI建议生成失败' }
    }
  }

  // 生成文本摘要
  async generateSummary(request: AISummaryRequest): Promise<AIResponse> {
    if (!this.isAvailable) {
      return { success: false, error: 'AI服务不可用' }
    }

    try {
      let summary = ''
      
      switch (request.type) {
        case 'product_detail':
          summary = this.summarizeProductDetail(request.text)
          break
        case 'selected_text':
          summary = this.summarizeSelectedText(request.text)
          break
        case 'overview':
          summary = this.generateOverviewAnalysis(request.text)
          break
        default:
          summary = '暂不支持此类型的摘要'
      }

      return { success: true, data: summary }
    } catch (error) {
      return { success: false, error: 'AI摘要生成失败' }
    }
  }

  // 商品名称建议
  private generateProductNameSuggestion(context: string): string {
    const suggestions = [
      `${context}标准版`,
      `${context}专业版`,
      `${context}高级版`,
      `${context}经济型`,
      `${context}豪华型`
    ]
    return suggestions[Math.floor(Math.random() * suggestions.length)]
  }

  // 商品描述建议
  private generateDescriptionSuggestion(context: string, data?: any): string {
    return `${context}是一款优质的商品，具有良好的性能和可靠的质量保证。适用于各种商业环境，是您理想的选择。`
  }

  // 商品分类建议
  private generateCategorySuggestion(context: string): string {
    const categories = ['电子产品', '办公用品', '工业设备', '生活用品', '其他']
    return categories[Math.floor(Math.random() * categories.length)]
  }

  // 价格建议
  private generatePriceSuggestion(context: string, data?: any): string {
    const basePrice = Math.floor(Math.random() * 1000) + 100
    return `建议价格: ¥${basePrice} - ¥${basePrice + 200}`
  }

  // 库存分析
  private generateStockAnalysis(data: any): string {
    if (!data || !data.stock_quantity || !data.min_stock_alert) {
      return '数据不足，无法进行分析'
    }

    const { stock_quantity, min_stock_alert, last_inbound_date } = data
    
    if (stock_quantity < min_stock_alert) {
      return `库存不足！当前库存${stock_quantity}件，低于安全库存${min_stock_alert}件，建议及时补货。`
    } else if (stock_quantity > min_stock_alert * 5) {
      return `库存充足但可能过剩。当前库存${stock_quantity}件，远超安全库存，建议适当调整采购计划。`
    } else {
      return `库存状态良好。当前库存${stock_quantity}件，在安全范围内。`
    }
  }

  // 商品详情摘要
  private summarizeProductDetail(text: string): string {
    if (text.length < 50) {
      return text
    }
    return text.substring(0, 100) + '...'
  }

  // 选择文本摘要
  private summarizeSelectedText(text: string): string {
    return `摘要: ${text.substring(0, Math.min(text.length, 200))}${text.length > 200 ? '...' : ''}`
  }

  // 概况分析
  private generateOverviewAnalysis(text: string): string {
    return `基于当前数据分析，系统运行状态良好。建议关注库存管理和销售趋势变化。`
  }
}

export const aiService = AIService.getInstance()