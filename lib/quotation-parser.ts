export interface QuotationProduct {
  name: string
  sku?: string
  category?: string
  unit?: string
  price?: number
  description?: string
  brand?: string
  model?: string
  specifications?: string
}

export interface QuotationParseResult {
  success: boolean
  products: QuotationProduct[]
  error?: string
  totalCount: number
  validCount: number
}

export class QuotationParser {
  // 解析Excel文件（这里模拟解析CSV格式）
  static parseCSV(csvText: string): QuotationParseResult {
    try {
      const lines = csvText.split('\n').filter(line => line.trim())
      const products: QuotationProduct[] = []
      
      // 跳过标题行
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue
        
        const cells = this.parseCSVLine(line)
        if (cells.length < 2) continue
        
        const product: QuotationProduct = {
          name: cells[0]?.trim() || '',
          sku: cells[1]?.trim(),
          category: cells[2]?.trim(),
          unit: cells[3]?.trim() || '件',
          price: this.parsePrice(cells[4]),
          description: cells[5]?.trim(),
          brand: cells[6]?.trim(),
          model: cells[7]?.trim(),
          specifications: cells[8]?.trim()
        }
        
        // 验证必需字段
        if (product.name) {
          products.push(product)
        }
      }
      
      return {
        success: true,
        products,
        totalCount: products.length,
        validCount: products.length
      }
    } catch (error) {
      return {
        success: false,
        products: [],
        error: 'CSV解析失败: ' + (error as Error).message,
        totalCount: 0,
        validCount: 0
      }
    }
  }
  
  // 解析Excel文件（模拟）
  static parseExcel(buffer: ArrayBuffer): QuotationParseResult {
    // 这里应该使用实际的Excel解析库，如xlsx
    // 暂时返回模拟数据
    return {
      success: true,
      products: [
        {
          name: '示例商品1',
          sku: 'SKU001',
          category: '电子产品',
          unit: '件',
          price: 99.99,
          description: '这是一个示例商品'
        },
        {
          name: '示例商品2',
          sku: 'SKU002',
          category: '办公用品',
          unit: '盒',
          price: 25.50,
          description: '这是另一个示例商品'
        }
      ],
      totalCount: 2,
      validCount: 2
    }
  }
  
  // 解析CSV行（处理引号和逗号）
  private static parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current)
    return result
  }
  
  // 解析价格
  private static parsePrice(priceStr: string | undefined): number | undefined {
    if (!priceStr) return undefined
    
    const cleaned = priceStr.replace(/[^\d.]/g, '')
    const price = parseFloat(cleaned)
    
    return isNaN(price) ? undefined : price
  }
  
  // 生成CSV模板
  static generateTemplate(): string {
    return `商品名称,SKU编码,商品分类,计量单位,价格,商品描述,品牌,型号,规格参数
示例商品1,SKU001,电子产品,件,99.99,这是一个示例商品,品牌A,型号X,规格1
示例商品2,SKU002,办公用品,盒,25.50,这是另一个示例商品,品牌B,型号Y,规格2`
  }
}