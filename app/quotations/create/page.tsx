"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, Trash2, Eye } from "lucide-react"

interface QuotationItem {
  product_id: number
  product_name: string
  product_sku: string
  product_unit: string
  quantity: number
  unit_price: number
  total_price: number
}

function QuotationCreateForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productId = searchParams.get("productId")

  const [items, setItems] = useState<QuotationItem[]>([])
  const [quotationInfo, setQuotationInfo] = useState({
    customer_name: "",
    customer_contact: "",
    valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    notes: "",
  })

  useEffect(() => {
    if (productId) {
      fetchProductAndAdd(productId)
    }
  }, [productId])

  const fetchProductAndAdd = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`)
      const result = await response.json()

      if (result.success) {
        const product = result.data

        // 获取入库历史以计算平均价格
        const historyResponse = await fetch(`/api/products/${id}/inbound-history`)
        const historyResult = await historyResponse.json()

        let averagePrice = 0
        if (historyResult.success && historyResult.data.length > 0) {
          averagePrice =
            historyResult.data.reduce((sum: number, record: any) => sum + record.unit_price, 0) /
            historyResult.data.length
        }

        addItem({
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          product_unit: product.unit,
          quantity: 1,
          unit_price: Math.ceil(averagePrice * 1.2),
          total_price: Math.ceil(averagePrice * 1.2),
        })
      }
    } catch (error) {
      console.error("[v0] Error fetching product:", error)
    }
  }

  const addItem = (item: QuotationItem) => {
    setItems([...items, item])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof QuotationItem, value: any) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    }

    if (field === "quantity" || field === "unit_price") {
      newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price
    }

    setItems(newItems)
  }

  const calculateTotalAmount = () => {
    return items.reduce((sum, item) => sum + item.total_price, 0)
  }

  const handlePreview = () => {
    sessionStorage.setItem(
      "quotation_preview",
      JSON.stringify({
        items,
        info: quotationInfo,
        total: calculateTotalAmount(),
        date: new Date().toISOString().slice(0, 10),
      }),
    )
    router.push("/quotations/preview")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
    }).format(amount)
  }

  return (
    <>
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">创建报价表</h1>
              <p className="text-sm text-muted-foreground">填写报价信息并生成报价单</p>
            </div>
            <Button onClick={handlePreview} disabled={items.length === 0}>
              <Eye className="mr-2 h-4 w-4" />
              预览报价表
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 客户信息 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>客户信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">客户名称</Label>
                  <Input
                    id="customer_name"
                    placeholder="请输入客户名称"
                    value={quotationInfo.customer_name}
                    onChange={(e) =>
                      setQuotationInfo({
                        ...quotationInfo,
                        customer_name: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_contact">联系方式</Label>
                  <Input
                    id="customer_contact"
                    placeholder="电话或邮箱"
                    value={quotationInfo.customer_contact}
                    onChange={(e) =>
                      setQuotationInfo({
                        ...quotationInfo,
                        customer_contact: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valid_until">有效期至</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={quotationInfo.valid_until}
                    onChange={(e) =>
                      setQuotationInfo({
                        ...quotationInfo,
                        valid_until: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">备注说明</Label>
                  <Textarea
                    id="notes"
                    placeholder="可填写付款方式、交货时间等信息"
                    rows={4}
                    value={quotationInfo.notes}
                    onChange={(e) =>
                      setQuotationInfo({
                        ...quotationInfo,
                        notes: e.target.value,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>报价汇总</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">商品种类</span>
                    <span className="font-medium">{items.length} 种</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">商品总数</span>
                    <span className="font-medium">{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">合计金额</span>
                      <span className="text-2xl font-bold text-primary">{formatCurrency(calculateTotalAmount())}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 商品列表 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>商品清单</CardTitle>
                    <CardDescription>添加需要报价的商品</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push("/products")}>
                    <Plus className="mr-2 h-4 w-4" />
                    选择商品
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {items.length > 0 ? (
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <Card key={index} className="border-2">
                        <CardContent className="p-4">
                          <div className="mb-3 flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{item.product_name}</h4>
                              <p className="text-sm text-muted-foreground">SKU: {item.product_sku}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>

                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                              <Label>数量</Label>
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(index, "quantity", Number.parseInt(e.target.value) || 1)}
                                />
                                <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm">
                                  {item.product_unit}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>单价</Label>
                              <div className="flex gap-2">
                                <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm">¥</div>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  value={item.unit_price}
                                  onChange={(e) =>
                                    updateItem(index, "unit_price", Number.parseFloat(e.target.value) || 0)
                                  }
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>小计</Label>
                              <div className="flex h-10 items-center rounded-md border bg-primary/10 px-3 font-semibold text-primary">
                                {formatCurrency(item.total_price)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <p>还没有添加商品</p>
                    <Button variant="outline" className="mt-4 bg-transparent" onClick={() => router.push("/products")}>
                      去选择商品
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}

export default function CreateQuotationPage() {
  return (
    <div className="min-h-screen bg-muted/40">
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        }
      >
        <QuotationCreateForm />
      </Suspense>
    </div>
  )
}
