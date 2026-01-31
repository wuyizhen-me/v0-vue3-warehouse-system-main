import { NextResponse } from "next/server"
import { QuotationParser, type QuotationParseResult } from "@/lib/quotation-parser"

// POST - 解析报价表文件
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ success: false, error: "请选择文件" }, { status: 400 })
    }

    let result: QuotationParseResult

    if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      const buffer = await file.arrayBuffer()
      result = await QuotationParser.parseExcel(buffer)
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "不支持的文件格式，请上传 Excel 文件（.xlsx 或 .xls）",
        },
        { status: 400 }
      )
    }

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || "文件解析失败" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        products: result.products,
        totalCount: result.totalCount,
        validCount: result.validCount,
        format: result.format,
      },
    })
  } catch (error) {
    console.error("[Quotations] 报价表导入错误:", error)
    return NextResponse.json({ success: false, error: "报价表导入失败" }, { status: 500 })
  }
}