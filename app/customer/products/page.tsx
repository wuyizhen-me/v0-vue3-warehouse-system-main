"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Eye, AlertCircle } from "lucide-react"

interface Product {
  id: number
  name: string
  code: string
  category: string
  unit: string
  stock_quantity: number
  min_stock_alert: number
  price: number
  image_url?: string
}

export default function CustomerProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState("")

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (!searchKeyword.trim()) {
      setFilteredProducts(products)
    } else {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          product.code.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          product.category?.toLowerCase().includes(searchKeyword.toLowerCase()),
      )
      setFilteredProducts(filtered)
    }
  }, [searchKeyword, products])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products")
      const result = await response.json()

      if (result.success) {
        setProducts(result.data)
        setFilteredProducts(result.data)
      }
    } catch (error) {
      console.error("[v0] Error fetching products:", error)
    } finally {
      setLoading(false)
    }
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
            <Button variant="ghost" size="icon" onClick={() => router.push("/customer")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">商品管理</h1>
              <p className="text-sm text-muted-foreground">查看商品信息</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>商品列表</CardTitle>
                <CardDescription>共 {filteredProducts.length} 件商品</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索商品名称或SKU"
                  className="pl-9"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProducts.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="cursor-pointer transition-all hover:shadow-md"
                    onClick={() => router.push(`/customer/products/${product.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <h3 className="mb-1 font-semibold">{product.name}</h3>
                          <p className="text-xs text-muted-foreground">编码: {product.code}</p>
                        </div>
                        {product.stock_quantity <= product.min_stock_alert && (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">库存</span>
                          <span
                            className={`font-medium ${product.stock_quantity <= product.min_stock_alert ? "text-red-600" : ""}`}
                          >
                            {product.stock_quantity} {product.unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">分类</span>
                          <span className="text-sm">{product.category || "-"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">价格</span>
                          <span className="font-medium text-green-600">¥{product.price ? Number(product.price).toFixed(2) : "0.00"}</span>
                        </div>
                      </div>

                      <Button variant="ghost" size="sm" className="mt-4 w-full">
                        <Eye className="mr-2 h-4 w-4" />
                        查看详情
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">暂无商品</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
