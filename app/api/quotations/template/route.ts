import { NextResponse } from "next/server"
import { QuotationParser } from "@/lib/quotation-parser"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "1"

    let buffer: ArrayBuffer
    let filename: string

    if (format === "2") {
      buffer = await QuotationParser.generateTemplate2()
      filename = "报价单模板.xlsx"
    } else {
      buffer = await QuotationParser.generateTemplate1()
      filename = "商品导入模板.xlsx"
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    })
  } catch (error) {
    console.error("[Template] Error generating template:", error)
    return NextResponse.json({ success: false, error: "生成模板失败" }, { status: 500 })
  }
}
