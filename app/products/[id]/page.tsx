"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, FileText, AlertTriangle, Edit3, Save, X, Loader2, Package, DollarSign } from "lucide-react"
import { AISelectedTextSummary } from "@/components/ai-selected-text-summary"
import { ImageUpload } from "@/components/image-upload"
import { getUserSession, isAdmin, type User } from "@/lib/auth"

interface Product {
  id: number
  name: string
  sku: string
  category: string
  description: string
  unit: string
  stock_quantity: number
  min_stock_alert: number
  last_inbound_date: string
  image_url?: string
  image_alt?: string
  detailed_description?: string
  specifications?: any
  brand?: string
  model?: string
  weight?: number
  dimensions?: string
  color?: string
  material?: string
  price?: number
}

interface InboundRecord {
  id: number
  quantity: number
  unit_price: number
  total_price: number
  batch_number: string
  supplier: string
  inbound_date: string
  status: string
}

export default function ProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Product>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>("")
  const [user, setUser] = useState<User | null>(null)
  const [quantityInput, setQuantityInput] = useState<string>("")
  const [quantityError, setQuantityError] = useState<string>("")

  useEffect(() => {
    // 获取当前用户信息
    const currentUser = getUserSession()
    setUser(currentUser)
    
    if (productId) {
      fetchProductDetail()
    }
  }, [productId])

  useEffect(() => {
    if (product) {
      setFormData(product)
      setQuantityInput(product.stock_quantity.toString())
    }
  }, [product])

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

  const handleEditToggle = () => {
    if (isEditing) {
      // 取消编辑，重置表单数据
      setFormData(product || {})
      setQuantityInput(product?.stock_quantity.toString() || "")
      setQuantityError("")
    }
    setIsEditing(!isEditing)
    setError("")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuantityInput(value)
    
    // 验证输入
    const numValue = parseInt(value)
    if (value === "") {
      setQuantityError("")
      setFormData(prev => ({ ...prev, stock_quantity: 0 }))
    } else if (isNaN(numValue) || numValue < 0) {
      setQuantityError("请输入有效的数量")
    } else {
      setQuantityError("")
      setFormData(prev => ({ ...prev, stock_quantity: numValue }))
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.sku) {
      setError("商品名称和SKU为必填项")
      return
    }

    if (quantityError) {
      setError("请修正数量输入")
      return
    }

    setSaving(true)
    setError("")

    try {
      const response = await fetch(`/api/products`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: productId,
          ...formData
        })
      })

      const result = await response.json()

      if (result.success) {
        // 保存成功，刷新商品信息
        await fetchProductDetail()
        setIsEditing(false)
      } else {
        setError(result.error || "保存失败")
      }
    } catch (error) {
      console.error("[v0] Error saving product:", error)
      setError("保存失败，请重试")
    } finally {
      setSaving(false)
    }
  }

  // 生成报价表
  const handleGenerateQuotation = () => {
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
          <Button className="mt-4" onClick={() => router.push("/")}>
            返回首页
          </Button>
        </div>
      </div>
    )
  }

  const isUserAdmin = isAdmin(user)

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
              <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    保存
                  </Button>
                  <Button variant="outline" onClick={handleEditToggle}>
                    <X className="mr-2 h-4 w-4" />
                    取消
                  </Button>
                </>
              ) : (
                <>
                  {/* 只有商家可以编辑 */}
                  {isUserAdmin && (
                    <Button variant="outline" onClick={handleEditToggle}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      编辑
                    </Button>
                  )}
                  <Button onClick={handleGenerateQuotation}>
                    <FileText className="mr-2 h-4 w-4" />
                    生成报价表
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        
        {/* 商品主图和基本信息 */}
        <div className="grid gap-6 mb-8 md:grid-cols-2">
          {/* 商品主图 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {isEditing && isUserAdmin ? (
              <ImageUpload
                value={formData.image_url}
                onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                onAltChange={(alt) => setFormData(prev => ({ ...prev, image_alt: alt }))}
                altValue={formData.image_alt}
              />
            ) : (
              product.image_url ? (
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
              )
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
                {isEditing && isUserAdmin ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">商品名称 *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU *</Label>
                      <Input
                        id="sku"
                        name="sku"
                        value={formData.sku || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">分类</Label>
                        <Input
                          id="category"
                          name="category"
                          value={formData.category || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unit">计量单位</Label>
                        <Input
                          id="unit"
                          name="unit"
                          value={formData.unit || "件"}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">参考价格 (¥)</Label>
                        <Input
                          id="price"
                          name="price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price || ""}
                          onChange={handleInputChange}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stock_quantity">库存数量</Label>
                        <Input
                          id="stock_quantity"
                          value={quantityInput}
                          onChange={handleQuantityChange}
                          type="number"
                          min="0"
                          className={quantityError ? "border-red-500" : ""}
                        />
                        {quantityError && (
                          <p className="text-xs text-red-500">{quantityError}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="brand">品牌</Label>
                        <Input
                          id="brand"
                          name="brand"
                          value={formData.brand || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="model">型号</Label>
                        <Input
                          id="model"
                          name="model"
                          value={formData.model || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="color">颜色</Label>
                        <Input
                          id="color"
                          name="color"
                          value={formData.color || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="material">材质</Label>
                        <Input
                          id="material"
                          name="material"
                          value={formData.material || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weight">重量 (kg)</Label>
                        <Input
                          id="weight"
                          name="weight"
                          type="number"
                          step="0.01"
                          value={formData.weight || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dimensions">尺寸</Label>
                        <Input
                          id="dimensions"
                          name="dimensions"
                          value={formData.dimensions || ""}
                          onChange={handleInputChange}
                          placeholder="长x宽x高"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 p-3 rounded-lg transition-all hover:bg-muted/50">
                      <span className="text-xs text-muted-foreground block mb-1">分类</span>
                      <p className="font-medium text-primary">{product.category || "-"}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg transition-all hover:bg-muted/50">
                      <span className="text-xs text-muted-foreground block mb-1">品牌</span>
                      <p className="font-medium">{product.brand || "-"}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg transition-all hover:bg-muted/50">
                      <span className="text-xs text-muted-foreground block mb-1">型号</span>
                      <p className="font-medium">{product.model || "-"}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg transition-all hover:bg-muted/50">
                      <span className="text-xs text-muted-foreground block mb-1">计量单位</span>
                      <p className="font-medium">{product.unit}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg transition-all hover:bg-muted/50">
                      <span className="text-xs text-muted-foreground block mb-1">颜色</span>
                      <p className="font-medium">{product.color || "-"}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg transition-all hover:bg-muted/50">
                      <span className="text-xs text-muted-foreground block mb-1">材质</span>
                      <p className="font-medium">{product.material || "-"}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg transition-all hover:bg-muted/50">
                      <span className="text-xs text-muted-foreground block mb-1">重量</span>
                      <p className="font-medium">{product.weight ? `${product.weight}kg` : "-"}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg transition-all hover:bg-muted/50">
                      <span className="text-xs text-muted-foreground block mb-1">尺寸</span>
                      <p className="font-medium">{product.dimensions || "-"}</p>
                    </div>
                  </div>
                )}
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
                    <span>库存不足，请及时补货</span>
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
        
        {/* 商品详细介绍 */}
        <div className="space-y-6">
          {/* 商品描述 */}
          <Card>
            <CardHeader>
              <CardTitle>商品描述</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing && isUserAdmin ? (
                <Textarea
                  name="description"
                  value={formData.description || ""}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="请输入商品描述..."
                />
              ) : (
                <p className="text-base leading-relaxed">{product.description || "暂无商品描述"}</p>
              )}
            </CardContent>
          </Card>
          
          {/* 详细描述 */}
          <Card>
            <CardHeader>
              <CardTitle>详细介绍</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing && isUserAdmin ? (
                <Textarea
                  name="detailed_description"
                  value={formData.detailed_description || ""}
                  onChange={handleInputChange}
                  rows={6}
                  placeholder="请输入详细介绍..."
                />
              ) : (
                product.detailed_description ? (
                  <div className="prose max-w-none">
                    <p className="text-base leading-relaxed whitespace-pre-line">{product.detailed_description}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">暂无详细介绍</p>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* AI文本选择摘要 */}
      <AISelectedTextSummary />
    </div>
  )
}
