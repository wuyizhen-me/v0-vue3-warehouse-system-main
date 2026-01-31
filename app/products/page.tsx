"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Eye, AlertCircle, Upload, Trash2 } from "lucide-react"

interface Product {
  id: number
  name: string
  sku: string
  category: string
  unit: string
  stock_quantity: number
  min_stock_alert: number
}

export default function ProductsPage() {
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
          product.sku.toLowerCase().includes(searchKeyword.toLowerCase()) ||
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

  // 删除商品
  const deleteProduct = async (productId: number, productName: string) => {
    if (confirm(`确定要删除商品 "${productName}" 吗？此操作不可恢复。`)) {
      try {
        const response = await fetch(`/api/products?id=${productId}`, {
          method: "DELETE"
        })
        
        const result = await response.json()
        
        if (result.success) {
          // 重新加载商品列表
          fetchProducts()
        } else {
          alert(`删除失败: ${result.error || "未知错误"}`)
        }
      } catch (error) {
        console.error("[v0] Error deleting product:", error)
        alert("删除失败，请稍后重试")
      }
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
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">商品管理</h1>
              <p className="text-sm text-muted-foreground">查看和管理商品信息</p>
            </div>
            <Button onClick={() => router.push("/quotations/import")}>
              <Upload className="mr-2 h-4 w-4" />
              报价表导入
            </Button>
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
                    onClick={() => router.push(`/products/${product.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <h3 className="mb-1 font-semibold">{product.name}</h3>
                          <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
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
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button variant="ghost" size="sm" className="flex-1" onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/products/${product.id}`)
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          查看详情
                        </Button>
                        <Button variant="ghost" size="sm" className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700" onClick={(e) => {
                          e.stopPropagation()
                          deleteProduct(product.id, product.name)
                        }}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除
                        </Button>
                      </div>
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
