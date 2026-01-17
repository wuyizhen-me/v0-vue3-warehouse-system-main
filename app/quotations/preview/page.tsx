"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Printer } from "lucide-react"

interface QuotationItem {
  product_name: string
  product_sku: string
  product_unit: string
  quantity: number
  unit_price: number
  total_price: number
}

interface QuotationData {
  items: QuotationItem[]
  info: {
    customer_name: string
    customer_contact: string
    valid_until: string
    notes: string
  }
  total: number
  date: string
}

export default function QuotationPreviewPage() {
  const router = useRouter()
  const [quotation, setQuotation] = useState<QuotationData | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const data = sessionStorage.getItem("quotation_preview")
    if (data) {
      setQuotation(JSON.parse(data))
    } else {
      router.push("/quotations/create")
    }
  }, [router])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
    }).format(amount)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadExcel = async () => {
    if (!quotation) return

    setDownloading(true)

    try {
      // 调用API生成Excel
      const response = await fetch("/api/quotations/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quotation),
      })

      if (!response.ok) {
        throw new Error("导出失败")
      }

      // 下载文件
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `报价表_${quotation.info.customer_name || "未命名"}_${quotation.date}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert("导出成功！")
    } catch (error) {
      console.error("[v0] Error downloading excel:", error)
      alert("导出失败，请重试")
    } finally {
      setDownloading(false)
    }
  }

  if (!quotation) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-card print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">报价表预览</h1>
              <p className="text-sm text-muted-foreground">确认无误后可下载或打印</p>
            </div>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              打印
            </Button>
            <Button onClick={handleDownloadExcel} disabled={downloading}>
              <Download className="mr-2 h-4 w-4" />
              {downloading ? "导出中..." : "导出Excel"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 print:py-4">
        <Card className="mx-auto max-w-4xl">
          <CardHeader className="border-b bg-card pb-8 pt-8">
            <div className="text-center">
              <h1 className="mb-2 text-3xl font-bold">商品报价表</h1>
              <p className="text-sm text-muted-foreground">QUOTATION</p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold">客户信息</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">客户名称：</span>
                    {quotation.info.customer_name || "-"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">联系方式：</span>
                    {quotation.info.customer_contact || "-"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">报价信息</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">报价日期：</span>
                    {quotation.date}
                  </p>
                  <p>
                    <span className="text-muted-foreground">有效期至：</span>
                    {quotation.info.valid_until}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            {/* 商品表格 */}
            <div className="mb-6 overflow-hidden rounded-lg border">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="border-r p-3 text-left text-sm font-semibold">序号</th>
                    <th className="border-r p-3 text-left text-sm font-semibold">商品名称</th>
                    <th className="border-r p-3 text-left text-sm font-semibold">SKU</th>
                    <th className="border-r p-3 text-center text-sm font-semibold">数量</th>
                    <th className="border-r p-3 text-right text-sm font-semibold">单价</th>
                    <th className="p-3 text-right text-sm font-semibold">小计</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="border-r p-3 text-sm">{index + 1}</td>
                      <td className="border-r p-3 text-sm">{item.product_name}</td>
                      <td className="border-r p-3 font-mono text-xs">{item.product_sku}</td>
                      <td className="border-r p-3 text-center text-sm">
                        {item.quantity} {item.product_unit}
                      </td>
                      <td className="border-r p-3 text-right text-sm">{formatCurrency(item.unit_price)}</td>
                      <td className="p-3 text-right text-sm font-medium">{formatCurrency(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 bg-muted/50">
                  <tr>
                    <td colSpan={5} className="p-3 text-right font-semibold">
                      合计金额：
                    </td>
                    <td className="p-3 text-right text-lg font-bold text-primary">{formatCurrency(quotation.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 备注 */}
            {quotation.info.notes && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="mb-2 font-semibold">备注说明</h4>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{quotation.info.notes}</p>
              </div>
            )}

            {/* 签字区域 */}
            <div className="mt-8 grid gap-8 border-t pt-8 md:grid-cols-2 print:grid-cols-2">
              <div>
                <p className="mb-4 text-sm text-muted-foreground">供应商签字：</p>
                <div className="h-16 border-b border-dashed" />
              </div>
              <div>
                <p className="mb-4 text-sm text-muted-foreground">客户签字：</p>
                <div className="h-16 border-b border-dashed" />
              </div>
            </div>

            {/* 底部说明 */}
            <div className="mt-8 text-center text-xs text-muted-foreground">
              <p>本报价单在有效期内有效，过期需重新确认价格</p>
              <p className="mt-1">感谢您的支持与信任！</p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* 打印样式 */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  )
}
