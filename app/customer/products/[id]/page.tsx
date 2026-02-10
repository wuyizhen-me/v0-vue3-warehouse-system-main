"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Package, DollarSign, AlertTriangle, ShoppingCart, Plus, Minus, Check, FileText } from "lucide-react"
import { getUserSession } from "@/lib/auth"
import { apiFetch } from "@/lib/api-client"

interface Product {
  id: number
  name: string
  code: string
  category: string
  description: string
  unit: string
  stock_quantity: number
  min_stock_alert: number
  last_inbound_date: string
  image_url?: string
  image_alt?: string
  specifications?: any
  brand?: string
  model?: string
  weight?: number
  dimensions?: string
  color?: string
  material?: string
  price?: number
}

export default function CustomerProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [addedSuccess, setAddedSuccess] = useState(false)

  useEffect(() => {
    if (productId) {
      fetchProductDetail()
    }
  }, [productId])

  const fetchProductDetail = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`)
      const result = await response.json()

      if (result.success) {
        setProduct(result.data)
      }
    } catch (error) {
      console.error("[v0] Error fetching product detail:", error)
    } finally {
      setLoading(false)
    }
  }

  // 添加到购物车
  const handleAddToCart = async () => {
    const user = getUserSession()
    if (!user) {
      router.push("/login")
      return
    }

    if (!product) return

    if (quantity > product.stock_quantity) {
      alert("购买数量超过库存")
      return
    }

    setAddingToCart(true)
    try {
      const response = await apiFetch("/api/cart", {
        method: "POST",
        body: JSON.stringify({
          product_id: parseInt(productId),
          quantity: quantity,
          unit_price: product.price
        })
      })

      const result = await response.json()
      if (result.success) {
        setAddedSuccess(true)
        setTimeout(() => setAddedSuccess(false), 2000)
      } else {
        alert(result.error || "添加失败")
      }
    } catch (error) {
      console.error("[v0] Error adding to cart:", error)
      alert("添加失败")
    } finally {
      setAddingToCart(false)
    }
  }

  // 添加到报价单
  const handleAddToQuotation = () => {
    router.push(`/quotations/create?productId=${productId}`)
  }

  // 格式化价格
  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return "-"
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
    }).format(price)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">商品不存在</p>
          <Button className="mt-4" onClick={() => router.push("/customer/products")}>
            返回商品列表
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{product.name}</h1>
              <p className="text-sm text-muted-foreground">编码: {product.code}</p>
            </div>
            <div className="flex items-center gap-4">
              {/* 数量选择 */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  max={product.stock_quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock_quantity, parseInt(e.target.value) || 1)))}
                  className="w-20 text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  disabled={quantity >= product.stock_quantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* 加入购物车按钮 */}
              <Button
                onClick={handleAddToCart}
                disabled={addingToCart || addedSuccess}
                className={addedSuccess ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {addingToCart ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                ) : addedSuccess ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <ShoppingCart className="mr-2 h-4 w-4" />
                )}
                {addingToCart ? "添加中..." : addedSuccess ? "已添加" : "加入购物车"}
              </Button>

              <Button variant="outline" onClick={handleAddToQuotation}>
                <FileText className="mr-2 h-4 w-4" />
                生成报价单
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 商品主图和基本信息 */}
        <div className="grid gap-6 mb-8 md:grid-cols-2">
          {/* 商品主图 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.image_alt || product.name}
                className="w-full h-[400px] object-cover rounded-md"
              />
            ) : (
              <div className="w-full h-[400px] flex items-center justify-center bg-muted rounded-md">
                <Package className="h-16 w-16 text-muted-foreground/50" />
                <span className="text-muted-foreground ml-2">暂无商品图片</span>
              </div>
            )}
          </div>
          
          {/* 商品基本信息 */}
          <div className="space-y-4">
            {/* 价格和库存概览 */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      <span className="text-sm text-muted-foreground">参考价格</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-700">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                  <div className="text-center border-l border-blue-200">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Package className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-muted-foreground">当前库存</span>
                    </div>
                    <p className="text-3xl font-bold text-green-700">
                      {product.stock_quantity}
                    </p>
                    <p className="text-xs text-muted-foreground">{product.unit}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <span className="text-xs text-muted-foreground block mb-1">分类</span>
                    <p className="font-medium text-primary">{product.category || "-"}</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <span className="text-xs text-muted-foreground block mb-1">品牌</span>
                    <p className="font-medium">{product.brand || "-"}</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <span className="text-xs text-muted-foreground block mb-1">型号</span>
                    <p className="font-medium">{product.model || "-"}</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <span className="text-xs text-muted-foreground block mb-1">计量单位</span>
                    <p className="font-medium">{product.unit}</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <span className="text-xs text-muted-foreground block mb-1">颜色</span>
                    <p className="font-medium">{product.color || "-"}</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <span className="text-xs text-muted-foreground block mb-1">材质</span>
                    <p className="font-medium">{product.material || "-"}</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <span className="text-xs text-muted-foreground block mb-1">重量</span>
                    <p className="font-medium">{product.weight ? `${product.weight}kg` : "-"}</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <span className="text-xs text-muted-foreground block mb-1">尺寸</span>
                    <p className="font-medium">{product.dimensions || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* 库存信息 */}
            <Card>
              <CardHeader>
                <CardTitle>库存信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-muted-foreground">当前库存</span>
                    <p className="text-2xl font-bold">
                      {product.stock_quantity} <span className="text-base font-normal">{product.unit}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground">安全库存</span>
                    <p className="text-lg font-medium">
                      {product.min_stock_alert} <span className="text-sm font-normal">{product.unit}</span>
                    </p>
                  </div>
                </div>
                {product.stock_quantity <= product.min_stock_alert && (
                  <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span>库存紧张</span>
                  </div>
                )}
                {product.last_inbound_date && (
                  <div className="text-sm text-muted-foreground">
                    最后入库时间: {new Date(product.last_inbound_date).toLocaleDateString("zh-CN")}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* 商品描述 */}
        <Card>
          <CardHeader>
            <CardTitle>商品描述</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed">{product.description || "暂无商品描述"}</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
