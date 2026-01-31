"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { getUserSession, isAdmin } from "@/lib/auth"
import { ArrowLeft, Plus, Minus, FileDown, Search } from "lucide-react"
import Image from "next/image"

interface Product {
  id: number
  name: string
  sku: string
  price: number
  stock_quantity: number
  image_url?: string
  dimensions?: string
  material?: string
  color?: string
  category?: string
  description?: string
  brand?: string
  model?: string
  specifications?: string
  unit?: string
}

interface QuotationItem {
  product: Product
  quantity: number
}

export default function CreateQuotationPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedItems, setSelectedItems] = useState<QuotationItem[]>([])
  const [searchKeyword, setSearchKeyword] = useState("")
  const [loading, setLoading] = useState(true)
  const [clientName, setClientName] = useState("")

  // 初始化用户会话和商品列表
  useEffect(() => {
    const currentUser = getUserSession()
    if (!currentUser) {
      router.push("/login")
      return
    }
    setUser(currentUser)
    fetchProducts()
  }, [router])
  
  // 处理URL参数，只在组件首次渲染时运行
  useEffect(() => {
    // 检查URL参数中是否包含产品ID
    const params = new URLSearchParams(window.location.search)
    const productId = params.get("productId")
    const productIds = params.get("productIds")
    
    if (productId || productIds) {
      // 延迟处理，确保products已经加载完成
      const timer = setTimeout(() => {
        if (productId) {
          // 单个产品ID
          const product = products.find(p => p.id === parseInt(productId))
          if (product) {
            addToQuotation(product)
          }
        } else if (productIds) {
          // 多个产品ID
          const ids = productIds.split(",").map(id => parseInt(id))
          ids.forEach(id => {
            const product = products.find(p => p.id === id)
            if (product) {
              addToQuotation(product)
            }
          })
        }
      }, 1000)
      
      // 清除定时器
      return () => clearTimeout(timer)
    }
  }, [])

  const fetchProducts = async (keyword = "") => {
    try {
      const url = keyword ? `/api/products?keyword=${encodeURIComponent(keyword)}` : "/api/products"
      const response = await fetch(url)
      const result = await response.json()

      if (result.success) {
        setProducts(result.data)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchProducts(searchKeyword)
  }

  const addToQuotation = (product: Product) => {
    const existing = selectedItems.find((item) => item.product.id === product.id)
    if (existing) {
      setSelectedItems(
        selectedItems.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      )
    } else {
      setSelectedItems([...selectedItems, { product, quantity: 1 }])
    }
  }

  const removeFromQuotation = (productId: number) => {
    setSelectedItems(selectedItems.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromQuotation(productId)
      return
    }
    setSelectedItems(
      selectedItems.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    )
  }

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + (item.product.price || 0) * item.quantity, 0)
  }

  const exportQuotation = async () => {
    if (selectedItems.length === 0) {
      alert("请至少选择一个商品")
      return
    }

    try {
      // 计算总价
      const total = selectedItems.reduce((sum, item) => sum + (item.product.price || 0) * item.quantity, 0)
      
      // 准备报价单数据
      const quotationData = {
        items: selectedItems.map((item) => ({
          product_name: item.product.name,
          product_sku: item.product.sku || "",
          product_category: item.product.category || "-",
          product_unit: item.product.unit || "件",
          unit_price: item.product.price || 0,
          product_description: item.product.description || "-",
          brand: item.product.brand || "-",
          model: item.product.model || "-",
          material: item.product.material || "-",
          color: item.product.color || "-",
          dimensions: item.product.dimensions || "-",
          weight: item.product.weight || "-",
          specifications: item.product.specifications || "-",
        }))
      }

      // 保存到sessionStorage，以便预览页面使用
      sessionStorage.setItem("quotation_preview", JSON.stringify(quotationData))
      
      // 调用API导出Excel
      const response = await fetch("/api/quotations/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quotationData),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `报价单_${clientName || "客户"}_${new Date().toISOString().split("T")[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert("导出失败")
      }
    } catch (error) {
      console.error("Error exporting quotation:", error)
      alert("导出失败")
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push("/quotations")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">创建报价单</h1>
                <p className="text-sm text-muted-foreground">选择商品并生成报价表</p>
              </div>
            </div>
            <Button onClick={exportQuotation} disabled={selectedItems.length === 0}>
              <FileDown className="mr-2 h-4 w-4" />
              导出报价单
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 商品列表 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>商品列表</CardTitle>
                <CardDescription>点击商品添加到报价单</CardDescription>
              </CardHeader>
              <CardContent>
                {/* 搜索 */}
                <div className="mb-4 flex gap-2">
                  <Input
                    placeholder="搜索商品名称或SKU..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button onClick={handleSearch}>
                    <Search className="mr-2 h-4 w-4" />
                    搜索
                  </Button>
                </div>

                {/* 商品网格 */}
                {loading ? (
                  <div className="py-8 text-center">加载中...</div>
                ) : products.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">暂无商品</div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md"
                        onClick={() => addToQuotation(product)}
                      >
                        <div className="flex gap-3">
                          {product.image_url && (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              width={80}
                              height={80}
                              className="rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold">{product.name}</h3>
                            <p className="text-sm text-muted-foreground">{product.sku || "-"}</p>
                            <p className="mt-1 text-lg font-bold text-green-600">
                              ¥{product.price ? product.price.toFixed(2) : "0.00"}
                            </p>
                            <p className="text-xs text-muted-foreground">库存: {product.stock_quantity || 0}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 报价单预览 */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>报价单预览</CardTitle>
                <CardDescription>已选择 {selectedItems.length} 件商品</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-2">
                  <Label htmlFor="client-name">客户名称</Label>
                  <Input
                    id="client-name"
                    placeholder="请输入客户名称"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  {selectedItems.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      点击左侧商品添加到报价单
                    </p>
                  ) : (
                    selectedItems.map((item) => (
                      <div key={item.product.id} className="rounded-lg border p-3">
                        <div className="mb-2 flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.product.name}</h4>
                            <p className="text-sm text-muted-foreground">{item.product.sku}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromQuotation(item.product.id)}
                          >
                            ×
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(item.product.id, parseInt(e.target.value) || 0)
                              }
                              className="h-8 w-16 text-center"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              ¥{(item.product.price || 0).toFixed(2)} × {item.quantity}
                            </p>
                            <p className="font-semibold text-green-600">
                              ¥{((item.product.price || 0) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {selectedItems.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span>总计:</span>
                      <span className="text-green-600">¥{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
