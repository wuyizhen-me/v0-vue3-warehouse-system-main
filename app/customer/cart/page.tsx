"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Trash2, ShoppingCart, Plus, Minus, FileText, Package } from "lucide-react"
import { getUserSession } from "@/lib/auth"
import { apiFetch } from "@/lib/api-client"

interface CartItem {
  id: number
  user_id: number
  product_id: number
  quantity: number
  unit_price: number
  notes: string
  product_name: string
  product_category: string
  product_unit: string
  product_image_url: string
  product_price: number
  final_price: number
  total_price: number
}

interface CartSummary {
  totalCount: number
  totalAmount: number
}

export default function ShoppingCartPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [summary, setSummary] = useState<CartSummary>({ totalCount: 0, totalAmount: 0 })
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)

  useEffect(() => {
    const user = getUserSession()
    if (!user) {
      router.push("/login")
      return
    }
    fetchCart()
  }, [router])

  const fetchCart = async () => {
    try {
      const response = await apiFetch("/api/cart")
      const result = await response.json()

      if (result.success) {
        setCartItems(result.data.items)
        setSummary(result.data.summary)
      }
    } catch (error) {
      console.error("[v0] Error fetching cart:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return

    setUpdating(productId)
    try {
      const response = await apiFetch("/api/cart", {
        method: "PUT",
        body: JSON.stringify({ product_id: productId, quantity: newQuantity })
      })

      const result = await response.json()
      if (result.success) {
        await fetchCart()
      }
    } catch (error) {
      console.error("[v0] Error updating cart:", error)
    } finally {
      setUpdating(null)
    }
  }

  const removeItem = async (productId: number) => {
    try {
      const response = await apiFetch(`/api/cart?product_id=${productId}`, {
        method: "DELETE"
      })

      const result = await response.json()
      if (result.success) {
        await fetchCart()
      }
    } catch (error) {
      console.error("[v0] Error removing item:", error)
    }
  }

  const clearCart = async () => {
    if (!confirm("确定要清空购物车吗？")) return

    try {
      const response = await apiFetch("/api/cart", {
        method: "DELETE"
      })

      const result = await response.json()
      if (result.success) {
        await fetchCart()
      }
    } catch (error) {
      console.error("[v0] Error clearing cart:", error)
    }
  }

  const generateQuotation = () => {
    const productIds = cartItems.map(item => item.product_id).join(",")
    router.push(`/quotations/create?productIds=${productIds}`)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShoppingCart className="h-6 w-6" />
                购物车
              </h1>
              <p className="text-sm text-muted-foreground">
                共 {summary.totalCount} 件商品
              </p>
            </div>
            {cartItems.length > 0 && (
              <Button variant="outline" onClick={clearCart}>
                <Trash2 className="mr-2 h-4 w-4" />
                清空购物车
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {cartItems.length === 0 ? (
          <Card className="py-16">
            <CardContent className="text-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">购物车是空的</p>
              <Button onClick={() => router.push("/customer/products")}>
                去逛逛商品
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* 购物车商品列表 */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.product_id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* 商品图片 */}
                      <div className="w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden">
                        {item.product_image_url ? (
                          <img
                            src={item.product_image_url}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>

                      {/* 商品信息 */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{item.product_name}</h3>
                        <p className="text-sm text-muted-foreground">商品ID: {item.product_id}</p>
                        <p className="text-sm text-muted-foreground">分类: {item.product_category || "-"}</p>
                        
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-lg font-bold text-primary">
                            ¥{Number(item.final_price).toFixed(2)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            单位: {item.product_unit}
                          </span>
                        </div>
                      </div>

                      {/* 操作区 */}
                      <div className="flex flex-col items-end justify-between">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => removeItem(item.product_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        {/* 数量调整 */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            disabled={updating === item.product_id || item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {updating === item.product_id ? "..." : item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            disabled={updating === item.product_id}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* 小计 */}
                    <div className="mt-3 pt-3 border-t flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        单价: ¥{Number(item.final_price).toFixed(2)} × {item.quantity}
                      </span>
                      <span className="font-bold text-lg">
                        小计: ¥{Number(item.total_price).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 订单汇总 */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>订单汇总</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">商品总数</span>
                    <span>{summary.totalCount} 件</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">商品种类</span>
                    <span>{cartItems.length} 种</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">合计</span>
                      <span className="text-2xl font-bold text-primary">
                        ¥{Number(summary.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={generateQuotation}
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    生成报价单
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push("/customer/products")}
                  >
                    继续购物
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
