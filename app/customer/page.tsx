"use client"

import React, { useEffect, useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getUserSession, clearUserSession, type User } from "@/lib/auth"
import { Package, Search, FileText, LogOut, User as UserIcon, MessageCircle } from "lucide-react"

// 懒加载AI客服组件
const AICustomerChat = React.lazy(() => import("@/components/ai-customer-chat"));

interface Product {
  id: number
  name: string
  sku: string
  price: number
  stock_quantity: number
  size?: string
  material?: string
  colour?: string
  warehouse_location?: string
  image_url?: string
  category?: string
  unit?: string
}

export default function CustomerPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState("")

  useEffect(() => {
    const currentUser = getUserSession()
    if (!currentUser) {
      router.push("/login")
      return
    }
    setUser(currentUser)
    
    // 并行请求，减少加载时间
    Promise.all([
      fetchProducts(),
      fetchRecommendations(currentUser),
      fetchUnreadMessages(currentUser)
    ])
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

  const fetchRecommendations = async (currentUser: User) => {
    try {
      const response = await fetch(`/api/behaviors/suggestions?username=${currentUser.username}`)
      const result = await response.json()

      if (result.success) {
        setRecommendations(result.data.recommendations || [])
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error)
    }
  }

  const fetchUnreadMessages = async (currentUser: User) => {
    try {
      const response = await fetch(
        `/api/messages?username=${currentUser.username}&role=${currentUser.role}&unread=true`
      )
      const result = await response.json()

      if (result.success) {
        setUnreadMessages(result.data.length)
      }
    } catch (error) {
      console.error("Error fetching unread messages:", error)
    }
  }

  const recordBehavior = async (behaviorType: string, productId?: number, searchKeyword?: string) => {
    if (!user) return

    try {
      await fetch("/api/behaviors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          role: user.role,
          behavior_type: behaviorType,
          product_id: productId,
          search_keyword: searchKeyword,
        }),
      })
    } catch (error) {
      console.error("Error recording behavior:", error)
    }
  }

  const handleSearch = () => {
    fetchProducts(searchKeyword)
    recordBehavior("search", undefined, searchKeyword)
  }

  const handleProductView = (productId: number) => {
    recordBehavior("view_product", productId)
  }

  const handleLogout = async () => {
    if (user) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, role: user.role }),
      })
    }
    clearUserSession()
    router.push("/login")
  }



  if (!user) return null

  return (
    <div className="min-h-screen bg-muted/40">
      {/* 头部 */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">仓库管理系统 - 客户端</h1>
              <p className="text-sm text-muted-foreground">欢迎，{user.username}</p>
            </div>
            <div className="pr-12">
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                退出登录
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 功能卡片 */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card className="cursor-pointer transition-all hover:shadow-lg" onClick={() => router.push("/customer/products")}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-blue-500 p-3 text-white">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">商品列表</h3>
                <p className="text-sm text-muted-foreground">查看所有商品</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-all hover:shadow-lg" onClick={() => router.push("/quotations")}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-green-500 p-3 text-white">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">报价单</h3>
                <p className="text-sm text-muted-foreground">查看报价信息</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-all hover:shadow-lg" onClick={() => router.push("/customer/chat")}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="relative rounded-lg bg-purple-500 p-3 text-white">
                <UserIcon className="h-6 w-6" />
                {unreadMessages > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs">
                    {unreadMessages}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-semibold">在线客服</h3>
                <p className="text-sm text-muted-foreground">
                  {unreadMessages > 0 ? `${unreadMessages} 条未读` : "与店家聊天"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-all hover:shadow-lg" onClick={() => fetchRecommendations(user!)}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-orange-500 p-3 text-white">
                <Search className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">AI 推荐</h3>
                <p className="text-sm text-muted-foreground">智能商品推荐</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索栏 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>商品搜索</CardTitle>
            <CardDescription>搜索商品名称或SKU</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="输入商品名称或SKU..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                搜索
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI 推荐商品 */}
        {recommendations.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>为您推荐</CardTitle>
                <CardDescription>基于您的浏览历史和搜索记录</CardDescription>
              </div>
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/ai/suggest', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        type: 'product_name', 
                        context: '智能', 
                        data: { products: recommendations } 
                      })
                    });
                    const result = await response.json();
                    if (result.success) {
                      alert(`AI建议: ${result.data}`);
                    } else {
                      alert(`AI建议生成失败: ${result.error}`);
                    }
                  } catch (error) {
                    console.error('AI建议请求失败:', error);
                    alert('AI建议请求失败');
                  }
                }}
                variant="secondary"
              >
                AI建议
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recommendations.slice(0, 6).map((product) => (
                  <div
                    key={product.id}
                    className="cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md"
                    onClick={() => handleProductView(product.id)}
                  >
                    <h4 className="mb-1 font-semibold">{product.name}</h4>
                    <p className="mb-2 text-sm text-muted-foreground">{product.recommendation_reason}</p>
                    <p className="text-lg font-bold text-green-600">¥{product.price?.toFixed(2) || "0.00"}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* AI客服气泡 - 懒加载 */}
      <Suspense fallback={null}>
        <AICustomerChat user={user} products={products} />
      </Suspense>
    </div>
  )
}
