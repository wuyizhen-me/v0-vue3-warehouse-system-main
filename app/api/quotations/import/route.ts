import { NextResponse } from "next/server"
import { QuotationParser, type QuotationParseResult } from "@/lib/quotation-parser"
import { query } from "@/lib/db"

// POST - 解析报价表文件
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: "请选择文件" 
      }, { status: 400 })
    }

    let result: QuotationParseResult
    
    if (file.name.endsWith('.csv')) {
      const text = await file.text()
      result = QuotationParser.parseCSV(text)
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const buffer = await file.arrayBuffer()
      result = QuotationParser.parseExcel(buffer)
    } else {
      return NextResponse.json({ 
        success: false, 
        error: "不支持的文件格式，请上传CSV或Excel文件" 
      }, { status: 400 })
    }
    
    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error || "文件解析失败" 
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        products: result.products,
        totalCount: result.totalCount,
        validCount: result.validCount
      }
    })
  } catch (error) {
    console.error("[v0] 报价表导入错误:", error)
    return NextResponse.json({ 
      success: false, 
      error: "报价表导入失败" 
    }, { status: 500 })
  }
}

// GET - 获取CSV模板
export async function GET(request: Request) {
  try {
    const template = QuotationParser.generateTemplate()
    
    return new Response(template, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="quotation_template.csv"'
      }
    })
  } catch (error) {
    console.error("[v0] 模板生成错误:", error)
    return NextResponse.json({ 
      success: false, 
      error: "模板生成失败" 
    }, { status: 500 })
  }
}