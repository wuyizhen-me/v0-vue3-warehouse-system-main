import { NextResponse } from "next/server"
import ExcelJS from "exceljs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { items, info, total, date } = body

    // 创建工作簿和工作表
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("报价表")

    // 设置列宽
    worksheet.columns = [
      { key: "序号", width: 8 },
      { key: "商品名称", width: 30 },
      { key: "SKU", width: 20 },
      { key: "数量", width: 12 },
      { key: "单价", width: 15 },
      { key: "小计", width: 15 },
    ]

    // 添加标题
    const titleRow = worksheet.addRow(["商品报价表"])
    titleRow.font = { size: 18, bold: true }
    titleRow.alignment = { horizontal: "center", vertical: "middle" }
    worksheet.mergeCells("A1:F1")
    titleRow.height = 30

    // 添加空行
    worksheet.addRow([])

    // 添加客户信息
    worksheet.addRow(["客户信息"])
    worksheet.addRow(["客户名称：", info.customer_name || "-"])
    worksheet.addRow(["联系方式：", info.customer_contact || "-"])
    worksheet.addRow([])

    // 添加报价信息
    worksheet.addRow(["报价信息"])
    worksheet.addRow(["报价日期：", date])
    worksheet.addRow(["有效期至：", info.valid_until])
    worksheet.addRow([])

    // 添加表头
    const headerRow = worksheet.addRow(["序号", "商品名称", "SKU", "数量", "单价(元)", "小计(元)"])
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    }
    headerRow.alignment = { horizontal: "center", vertical: "middle" }

    // 添加商品数据
    items.forEach((item: any, index: number) => {
      const row = worksheet.addRow([
        index + 1,
        item.product_name,
        item.product_sku,
        `${item.quantity} ${item.product_unit}`,
        item.unit_price,
        item.total_price,
      ])
      row.alignment = { vertical: "middle" }

      // 金额格式
      row.getCell(5).numFmt = "¥#,##0.00"
      row.getCell(6).numFmt = "¥#,##0.00"
    })

    // 添加合计行
    const totalRow = worksheet.addRow(["", "", "", "", "合计金额：", total])
    totalRow.font = { bold: true }
    totalRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0F0F0" },
    }
    totalRow.getCell(6).numFmt = "¥#,##0.00"
    totalRow.getCell(6).font = { bold: true, size: 12 }

    // 添加备注
    if (info.notes) {
      worksheet.addRow([])
      worksheet.addRow(["备注说明："])
      const notesRow = worksheet.addRow([info.notes])
      worksheet.mergeCells(`A${notesRow.number}:F${notesRow.number}`)
      notesRow.alignment = { wrapText: true }
    }

    // 添加边框
    const borderStyle = {
      top: { style: "thin" as const },
      left: { style: "thin" as const },
      bottom: { style: "thin" as const },
      right: { style: "thin" as const },
    }

    const startRow = 11 // 表头行号
    const endRow = startRow + items.length + 1 // 包含合计行

    for (let rowNum = startRow; rowNum <= endRow; rowNum++) {
      const row = worksheet.getRow(rowNum)
      for (let colNum = 1; colNum <= 6; colNum++) {
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
