import { NextResponse } from "next/server"
import ExcelJS from "exceljs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { items } = body
    
    // 获取当前日期
    const date = new Date().toISOString().split("T")[0]

    // 创建工作簿和工作表
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("报价表")

    // 设置列宽，与模板保持一致
    worksheet.columns = [
      { key: "商品名称", width: 20 },
      { key: "SKU编码", width: 15 },
      { key: "商品分类", width: 15 },
      { key: "计量单位", width: 10 },
      { key: "价格", width: 10 },
      { key: "商品描述", width: 30 },
      { key: "品牌", width: 15 },
      { key: "型号", width: 15 },
      { key: "材质", width: 12 },
      { key: "颜色", width: 12 },
      { key: "尺寸", width: 15 },
      { key: "重量", width: 10 },
      { key: "规格参数", width: 15 },
    ]

    // 添加表头，与模板保持一致
    const headerRow = worksheet.addRow([
      "商品名称", "SKU编码", "商品分类", "计量单位", "价格", "商品描述", 
      "品牌", "型号", "材质", "颜色", "尺寸", "重量", "规格参数"
    ])
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    }
    headerRow.alignment = { horizontal: "center", vertical: "middle" }

    // 添加商品数据
    items.forEach((item: any) => {
      const row = worksheet.addRow([
        item.product_name,
        item.product_code,
        item.product_category || "-",
        item.product_unit || "件",
        item.unit_price,
        item.product_description || "-",
        item.brand || "-",
        item.model || "-",
        item.material || "-",
        item.color || "-",
        item.dimensions || "-",
        item.weight || "-",
        item.specifications || "-",
      ])
      row.alignment = { vertical: "middle" }
    })

    // 添加边框
    const borderStyle = {
      top: { style: "thin" as const },
      left: { style: "thin" as const },
      bottom: { style: "thin" as const },
      right: { style: "thin" as const },
    }

    const startRow = 1 // 表头行号
    const endRow = startRow + items.length // 包含数据行

    for (let rowNum = startRow; rowNum <= endRow; rowNum++) {
      const row = worksheet.getRow(rowNum)
      for (let colNum = 1; colNum <= 13; colNum++) {
        row.getCell(colNum).border = borderStyle
      }
    }

    // 生成Buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // 返回Excel文件
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="quotation_${date}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("[v0] Error exporting excel:", error)
    return NextResponse.json({ success: false, error: "导出Excel失败" }, { status: 500 })
  }
}
