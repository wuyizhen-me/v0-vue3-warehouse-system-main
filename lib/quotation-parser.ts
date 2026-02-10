export interface QuotationProduct {
  name: string
  code?: string
  category?: string
  unit?: string
  price?: number
  quantity?: number
  description?: string
  brand?: string
  model?: string
  specifications?: string
  material?: string
  color?: string
  dimensions?: string
  weight?: number
}

export interface QuotationParseResult {
  success: boolean
  products: QuotationProduct[]
  error?: string
  totalCount: number
  validCount: number
  format?: "format1" | "format2"
}

export class QuotationParser {
  // 解析 Excel 文件（使用 exceljs）
  static async parseExcel(buffer: ArrayBuffer): Promise<QuotationParseResult> {
    try {
      const ExcelJS = (await import("exceljs")).default

      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)

      const worksheet = workbook.worksheets[0]
      if (!worksheet) {
        return {
          success: false,
          products: [],
          error: "Excel 文件为空",
          totalCount: 0,
          validCount: 0,
        }
      }

      const products: QuotationProduct[] = []
      const rows: any[][] = []

      // 读取所有行
      worksheet.eachRow((row, rowNumber) => {
        const values: any[] = []
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          values[colNumber - 1] = cell.value
        })
        rows.push(values)
      })

      if (rows.length < 2) {
        return {
          success: false,
          products: [],
          error: "Excel 文件内容为空",
          totalCount: 0,
          validCount: 0,
        }
      }

      // 读取标题行，自动识别格式
      const headers = rows[0].map((h) => String(h || "").trim().toLowerCase())

      // 格式1: 商品名称,SKU编码,商品分类,计量单位,价格,商品描述,品牌,型号,规格参数
      // 格式2: 商品名称,SKU,数量,单价,小计,规格
      const isFormat1 =
        headers.includes("商品名称") && headers.includes("sku编码") && headers.includes("商品分类")
      const isFormat2 =
        headers.includes("商品名称") && headers.includes("数量") && headers.includes("单价")

      if (!isFormat1 && !isFormat2) {
        return {
          success: false,
          products: [],
          error: "无法识别 Excel 格式，请使用标准模板",
          totalCount: 0,
          validCount: 0,
        }
      }

      // 解析数据行
      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i]
        if (!cells || cells.length < 2) continue

        let product: QuotationProduct

        if (isFormat1) {
          // 格式1解析
          product = {
            name: String(cells[0] || "").trim(),
            code: String(cells[1] || "").trim(),
            category: String(cells[2] || "").trim(),
            unit: String(cells[3] || "").trim() || "件",
            price: this.parseNumber(cells[4]),
            description: String(cells[5] || "").trim(),
            brand: String(cells[6] || "").trim(),
            model: String(cells[7] || "").trim(),
            material: String(cells[8] || "").trim(),
            color: String(cells[9] || "").trim(),
            dimensions: String(cells[10] || "").trim(),
            weight: this.parseNumber(cells[11]),
            specifications: String(cells[12] || "").trim(),
          }
        } else {
          // 格式2解析
          product = {
            name: String(cells[0] || "").trim(),
            code: String(cells[1] || "").trim(),
            material: String(cells[2] || "").trim(),
            color: String(cells[3] || "").trim(),
            dimensions: String(cells[4] || "").trim(),
            weight: this.parseNumber(cells[5]),
            quantity: this.parseNumber(cells[6]),
            price: this.parseNumber(cells[7]),
            specifications: String(cells[9] || "").trim(),
          }
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
        validCount: products.length,
        format: isFormat1 ? "format1" : "format2",
      }
    } catch (error) {
      return {
        success: false,
        products: [],
        error: "Excel 解析失败: " + (error as Error).message,
        totalCount: 0,
        validCount: 0,
      }
    }
  }

  // 解析数字
  private static parseNumber(value: any): number | undefined {
    if (value === null || value === undefined || value === "") return undefined

    const num = typeof value === "number" ? value : parseFloat(String(value).replace(/[^\d.]/g, ""))

    return isNaN(num) ? undefined : num
  }

  // 生成 Excel 模板 - 格式1（商品管理用）
  static async generateTemplate1(): Promise<ArrayBuffer> {
    const ExcelJS = (await import("exceljs")).default
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("商品导入模板")

    // 设置列
    worksheet.columns = [
      { header: "商品名称", key: "name", width: 20 },
      { header: "SKU编码", key: "sku", width: 15 },
      { header: "商品分类", key: "category", width: 15 },
      { header: "计量单位", key: "unit", width: 10 },
      { header: "价格", key: "price", width: 10 },
      { header: "商品描述", key: "description", width: 30 },
      { header: "品牌", key: "brand", width: 15 },
      { header: "型号", key: "model", width: 15 },
      { header: "材质", key: "material", width: 15 },
      { header: "颜色", key: "color", width: 15 },
      { header: "尺寸", key: "dimensions", width: 15 },
      { header: "重量", key: "weight", width: 10 },
      { header: "规格参数", key: "specifications", width: 20 },
    ]

    // 添加示例数据
    worksheet.addRow({
      name: "示例商品1",
      sku: "SKU001",
      category: "电子产品",
      unit: "件",
      price: 99.99,
      description: "这是一个示例商品",
      brand: "品牌A",
      model: "型号X",
      material: "塑料",
      color: "黑色",
      dimensions: "100x100x50mm",
      weight: 0.5,
      specifications: "规格1",
    })

    worksheet.addRow({
      name: "示例商品2",
      sku: "SKU002",
      category: "办公用品",
      unit: "盒",
      price: 25.5,
      description: "这是另一个示例商品",
      brand: "品牌B",
      model: "型号Y",
      material: "纸质",
      color: "白色",
      dimensions: "200x300mm",
      weight: 0.2,
      specifications: "规格2",
    })

    // 设置标题行样式
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    }

    return await workbook.xlsx.writeBuffer()
  }

  // 生成 Excel 模板 - 格式2（报价单用）
  static async generateTemplate2(): Promise<ArrayBuffer> {
    const ExcelJS = (await import("exceljs")).default
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("报价单模板")

    // 设置列
    worksheet.columns = [
      { header: "商品名称", key: "name", width: 25 },
      { header: "商品编码", key: "code", width: 15 },
      { header: "材质", key: "material", width: 12 },
      { header: "颜色", key: "color", width: 12 },
      { header: "尺寸", key: "dimensions", width: 15 },
      { header: "重量", key: "weight", width: 10 },
      { header: "数量", key: "quantity", width: 10 },
      { header: "单价", key: "price", width: 12 },
      { header: "小计", key: "total", width: 12 },
      { header: "规格", key: "specifications", width: 20 },
    ]

    // 添加示例数据
    worksheet.addRow({
      name: "示例商品1",
      code: "CODE001",
      material: "塑料",
      color: "黑色",
      dimensions: "100x100x50mm",
      weight: 0.5,
      quantity: 10,
      price: 99.99,
      total: 999.9,
      specifications: "规格1",
    })

    worksheet.addRow({
      name: "示例商品2",
      code: "CODE002",
      material: "纸质",
      color: "白色",
      dimensions: "200x300mm",
      weight: 0.2,
      quantity: 5,
      price: 25.5,
      total: 127.5,
      specifications: "规格2",
    })

    // 设置标题行样式
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    }

    return await workbook.xlsx.writeBuffer()
  }
}
