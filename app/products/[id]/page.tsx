"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, FileText, AlertTriangle, Edit3, Save, X } from "lucide-react"
import { AISuggestion } from "@/components/ai-suggestion"
import { AISelectedTextSummary } from "@/components/ai-selected-text-summary"

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
  const [inboundHistory, setInboundHistory] = useState<InboundRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Product>>({})
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (productId) {
      fetchProductDetail()
      fetchInboundHistory()
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
    }
  }

  const fetchInboundHistory = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/inbound-history`)
      const result = await response.json()

      if (result.success) {
        setInboundHistory(result.data)
      }
    } catch (error) {
      console.error("[v0] Error fetching inbound history:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
    }).format(amount)
  }

  // 计算平均价格
  const averagePrice =
    inboundHistory.length > 0
      ? inboundHistory.reduce((sum, record) => sum + record.unit_price, 0) / inboundHistory.length
      : 0

  // 生成报价表
  const handleGenerateQuotation = () => {
    router.push(`/quotations/create?productId=${productId}`)
  }

  // 开始编辑
  const handleEdit = () => {
    if (product) {
      setEditForm(product)
      setIsEditing(true)
    }
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditForm({})
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    try {
      let imageUrl = editForm.image_url
      
      // 如果有新图片，先上传
      if (imageFile) {
        const uploadedUrl = await uploadImage()
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
      }

      const updateData = {
        ...editForm,
        image_url: imageUrl
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setProduct(result.data)
        setIsEditing(false)
        setEditForm({})
        setImageFile(null)
        setImagePreview(null)
      } else {
        alert('保存失败：' + result.message)
      }
    } catch (error) {
      console.error('保存失败：', error)
      alert('保存失败，请重试')
    }
  }

  // 处理表单字段变化
  const handleFieldChange = (field: keyof Product, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // 上传图片
  const uploadImage = async () => {
    if (!imageFile) return null

    const formData = new FormData()
    formData.append('image', imageFile)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      if (result.success) {
        return result.url
      } else {
        throw new Error(result.error || '上传失败')
      }
    } catch (error) {
      console.error('图片上传失败:', error)
      alert('图片上传失败，请重试')
      return null
    }
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
            {isEditing ? (
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit}>
                  <Save className="mr-2 h-4 w-4" />
                  保存
                </Button>
                <Button variant="outline" onClick={handleCancelEdit}>
                  <X className="mr-2 h-4 w-4" />
                  取消
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleEdit}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  编辑
                </Button>
                <Button onClick={handleGenerateQuotation}>
                  <FileText className="mr-2 h-4 w-4" />
                  生成报价表
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 商品基本信息 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>商品信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 商品图片 */}
                {(product.image_url || isEditing) && (
                  <div>
                    <Label className="text-sm text-muted-foreground">商品图片</Label>
                    {isEditing ? (
                      <div className="mt-2 space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          选择图片
                        </Button>
                        {imagePreview && (
                          <img
                            src={imagePreview}
                            alt="预览"
                            className="mt-2 h-32 w-32 rounded-md border object-cover"
                          />
                        )}
                        {!imagePreview && editForm.image_url && (
                          <img
                            src={editForm.image_url}
                            alt={editForm.image_alt || product.name}
                            className="mt-2 h-32 w-32 rounded-md border object-cover"
                          />
                        )}
                        {isEditing && (
                          <Input
                            placeholder="图片描述"
                            value={editForm.image_alt || ''}
                            onChange={(e) => handleFieldChange('image_alt', e.target.value)}
                            className="mt-2"
                          />
                        )}
                      </div>
                    ) : (
                      product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.image_alt || product.name}
                          className="mt-2 h-32 w-32 rounded-md border object-cover"
                        />
                      )
                    )}
                  </div>
                )}
                <div>
                  <Label className="text-sm text-muted-foreground">商品名称</Label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={editForm.name || ''}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        className="mt-1"
                      />
                      <AISuggestion
                        type="product_name"
                        context={editForm.name || ''}
                        onSuggestion={(suggestion) => handleFieldChange('name', suggestion)}
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <p className="font-medium">{product.name}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">SKU编码</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.sku || ''}
                      onChange={(e) => handleFieldChange('sku', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-mono text-sm">{product.sku}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">商品分类</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.category || ''}
                      onChange={(e) => handleFieldChange('category', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium">{product.category || "-"}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">计量单位</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.unit || ''}
                      onChange={(e) => handleFieldChange('unit', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium">{product.unit}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">品牌</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.brand || ''}
                      onChange={(e) => handleFieldChange('brand', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium">{product.brand || "-"}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">型号</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.model || ''}
                      onChange={(e) => handleFieldChange('model', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium">{product.model || "-"}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">重量(kg)</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editForm.weight || ''}
                      onChange={(e) => handleFieldChange('weight', parseFloat(e.target.value) || 0)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium">{product.weight ? `${product.weight}kg` : "-"}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">尺寸</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.dimensions || ''}
                      onChange={(e) => handleFieldChange('dimensions', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium">{product.dimensions || "-"}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">颜色</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.color || ''}
                      onChange={(e) => handleFieldChange('color', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium">{product.color || "-"}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">材质</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.material || ''}
                      onChange={(e) => handleFieldChange('material', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium">{product.material || "-"}</p>
                  )}
                </div>
                {(product.description || isEditing) && (
                  <div>
                    <Label className="text-sm text-muted-foreground">商品描述</Label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editForm.description || ''}
                          onChange={(e) => handleFieldChange('description', e.target.value)}
                          className="mt-1"
                          rows={3}
                        />
                        <AISuggestion
                          type="description"
                          context={editForm.name || ''}
                          data={{ description: editForm.description || '' }}
                          onSuggestion={(suggestion) => handleFieldChange('description', suggestion)}
                          className="w-full"
                        />
                      </div>
                    ) : (
                      <p className="text-sm">{product.description}</p>
                    )}
                  </div>
                )}
                {(product.detailed_description || isEditing) && (
                  <div>
                    <Label className="text-sm text-muted-foreground">详细描述</Label>
                    {isEditing ? (
                      <Textarea
                        value={editForm.detailed_description || ''}
                        onChange={(e) => handleFieldChange('detailed_description', e.target.value)}
                        className="mt-1"
                        rows={4}
                      />
                    ) : (
                      <p className="text-sm">{product.detailed_description}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI库存分析 */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>AI库存分析</CardTitle>
              </CardHeader>
              <CardContent>
                <AISuggestion
                  type="stock_analysis"
                  context="库存分析"
                  data={{
                    stock_quantity: product.stock_quantity,
                    min_stock_alert: product.min_stock_alert,
                    last_inbound_date: product.last_inbound_date
                  }}
                  className="w-full"
                />
              </CardContent>
            </Card>

            {/* 库存信息 */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>库存信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground">当前库存</span>
                  <p className="text-2xl font-bold">
                    {product.stock_quantity} {product.unit}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">预警数量</span>
                  <p className="font-medium">
                    {product.min_stock_alert} {product.unit}
                  </p>
                </div>
                {product.stock_quantity <= product.min_stock_alert && (
                  <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span>库存不足，请及时补货</span>
                  </div>
                )}
                {product.last_inbound_date && (
                  <div>
                    <span className="text-sm text-muted-foreground">最后入库日期</span>
                    <p className="font-medium">{product.last_inbound_date}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 价格统计 */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>价格统计</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground">平均入库价</span>
                  <p className="text-xl font-bold text-primary">{formatCurrency(averagePrice)}</p>
                </div>
                {inboundHistory.length > 0 && (
                  <>
                    <div>
                      <span className="text-sm text-muted-foreground">最高价格</span>
                      <p className="font-medium">
                        {formatCurrency(Math.max(...inboundHistory.map((r) => r.unit_price)))}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">最低价格</span>
                      <p className="font-medium">
                        {formatCurrency(Math.min(...inboundHistory.map((r) => r.unit_price)))}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 入库历史 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>入库历史</CardTitle>
                <CardDescription>共 {inboundHistory.length} 条入库记录</CardDescription>
              </CardHeader>
              <CardContent>
                {inboundHistory.length > 0 ? (
                  <div className="space-y-4">
                    {inboundHistory.map((record) => (
                      <Card key={record.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            <div>
                              <span className="text-sm text-muted-foreground">入库日期</span>
                              <p className="font-medium">{record.inbound_date}</p>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">入库数量</span>
                              <p className="font-medium">
                                {record.quantity} {product.unit}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">单价</span>
                              <p className="font-medium">{formatCurrency(record.unit_price)}</p>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">总金额</span>
                              <p className="font-semibold text-primary">{formatCurrency(record.total_price)}</p>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">批次号</span>
                              <p className="font-mono text-xs">{record.batch_number}</p>
                            </div>
                            {record.supplier && (
                              <div>
                                <span className="text-sm text-muted-foreground">供应商</span>
                                <p className="font-medium">{record.supplier}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">暂无入库记录</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* AI文本选择摘要 */}
      <AISelectedTextSummary />
    </div>
  )
}
