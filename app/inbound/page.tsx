"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, Loader2 } from "lucide-react"
import { ImageUpload } from "@/components/image-upload"

export default function InboundPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    product_name: "",
    product_code: "",
    product_unit: "件",
    product_category: "",
    product_image_url: "",
    product_image_alt: "",
    product_description: "",
    quantity: "",
    unit_price: "",
    supplier: "",
    warehouse_location: "",
    notes: "",
    inbound_date: new Date().toISOString().slice(0, 10),
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // 验证表单
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.product_name.trim()) {
      newErrors.product_name = "请输入商品名称"
    }

    if (!formData.quantity || Number.parseInt(formData.quantity) <= 0) {
      newErrors.quantity = "入库数量必须大于0"
    }

    if (!formData.unit_price || Number.parseFloat(formData.unit_price) <= 0) {
      newErrors.unit_price = "单价必须大于0"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 提交入库
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      // 首先创建商品（如果不存在）
      const createProductResponse = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.product_name,
          code: formData.product_code || formData.product_name,
          category: formData.product_category || "未分类",
          unit: formData.product_unit,
          description: formData.product_description,
          image_url: formData.product_image_url,
          image_alt: formData.product_image_alt,
        }),
      })

      const productResult = await createProductResponse.json()
      
      if (!productResult.success) {
        alert(`创建商品失败：${productResult.error}`)
        setSubmitting(false)
        return
      }

      const productId = productResult.data.id

      // 然后创建入库记录
      const response = await fetch("/api/inbound", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: Number.parseInt(formData.quantity),
          unit_price: Number.parseFloat(formData.unit_price),
          supplier: formData.supplier,
          warehouse_location: formData.warehouse_location,
          notes: formData.notes,
          inbound_date: formData.inbound_date,
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert(`入库成功！批次号：${result.data.batch_number}`)
        // 重置表单
        setFormData({
          product_name: "",
          product_code: "",
          product_unit: "件",
          product_category: "",
          product_image_url: "",
          product_image_alt: "",
          product_description: "",
          quantity: "",
          unit_price: "",
          supplier: "",
          warehouse_location: "",
          notes: "",
          inbound_date: new Date().toISOString().slice(0, 10),
        })
      } else {
        alert(`入库失败：${result.error}`)
      }
    } catch (error) {
      console.error("[v0] Error submitting inbound:", error)
      alert("入库失败，请重试")
    } finally {
      setSubmitting(false)
    }
  }

  // 计算总价
  const totalPrice =
    formData.quantity && formData.unit_price
      ? (Number.parseInt(formData.quantity) * Number.parseFloat(formData.unit_price)).toFixed(2)
      : "0.00"

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">商品入库</h1>
              <p className="text-sm text-muted-foreground">录入新商品入库信息</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">批量导入</h3>
                  <p className="text-sm text-muted-foreground">通过报价表批量导入商品入库</p>
                </div>
                <Button onClick={() => router.push("/quotations/import")} variant="outline">
                  报价表导入
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>入库表单</CardTitle>
            <CardDescription>请填写完整的入库信息，确保数据准确</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 商品信息 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product_name">
                    商品名称 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="product_name"
                    placeholder="请输入商品名称"
                    value={formData.product_name}
                    onChange={(e) => {
                      setFormData({ ...formData, product_name: e.target.value })
                      setErrors({ ...errors, product_name: "" })
                    }}
                  />
                  {errors.product_name && <p className="text-sm text-red-500">{errors.product_name}</p>}
                </div>

                {/* 商品图片 */}
                <div className="space-y-2">
                  <Label>商品图片</Label>
                  <ImageUpload
                    value={formData.product_image_url}
                    onChange={(url) => setFormData({ ...formData, product_image_url: url })}
                    onAltChange={(alt) => setFormData({ ...formData, product_image_alt: alt })}
                    altValue={formData.product_image_alt}
                  />
                </div>

                {/* 商品描述 */}
                <div className="space-y-2">
                  <Label htmlFor="product_description">商品描述</Label>
                  <Textarea
                    id="product_description"
                    placeholder="请输入商品的详细描述"
                    value={formData.product_description}
                    onChange={(e) => setFormData({ ...formData, product_description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="product_code">商品编码</Label>
                    <Input
                      id="product_code"
                      placeholder="可选，留空将使用商品名称"
                      value={formData.product_code}
                      onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product_category">商品分类</Label>
                    <Input
                      id="product_category"
                      placeholder="如：电子产品、服装等"
                      value={formData.product_category}
                      onChange={(e) => setFormData({ ...formData, product_category: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product_unit">计量单位</Label>
                    <Input
                      id="product_unit"
                      placeholder="如：件、个、kg"
                      value={formData.product_unit}
                      onChange={(e) => setFormData({ ...formData, product_unit: e.target.value })}
                    />
                  </div>
                </div>
              </div>



              {/* 入库数量和单价 */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quantity">
                    入库数量 <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      placeholder="请输入数量"
                      value={formData.quantity}
                      onChange={(e) => {
                        setFormData({ ...formData, quantity: e.target.value })
                        setErrors({ ...errors, quantity: "" })
                      }}
                    />
                    <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm">
                      {formData.product_unit}
                    </div>
                  </div>
                  {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit_price">
                    单价 <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm">¥</div>
                    <Input
                      id="unit_price"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="请输入单价"
                      value={formData.unit_price}
                      onChange={(e) => {
                        setFormData({ ...formData, unit_price: e.target.value })
                        setErrors({ ...errors, unit_price: "" })
                      }}
                    />
                  </div>
                  {errors.unit_price && <p className="text-sm text-red-500">{errors.unit_price}</p>}
                </div>
              </div>

              {/* 总价显示 */}
              <Card className="border-2 border-primary">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">入库总金额</span>
                    <span className="text-2xl font-bold text-primary">¥ {totalPrice}</span>
                  </div>
                </CardContent>
              </Card>

              {/* 供应商和仓位 */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supplier">供应商</Label>
                  <Input
                    id="supplier"
                    placeholder="请输入供应商名称"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warehouse_location">仓位</Label>
                  <Input
                    id="warehouse_location"
                    placeholder="如: A区-01"
                    value={formData.warehouse_location}
                    onChange={(e) => setFormData({ ...formData, warehouse_location: e.target.value })}
                  />
                </div>
              </div>

              {/* 入库日期 */}
              <div className="space-y-2">
                <Label htmlFor="inbound_date">入库日期</Label>
                <Input
                  id="inbound_date"
                  type="date"
                  value={formData.inbound_date}
                  onChange={(e) => setFormData({ ...formData, inbound_date: e.target.value })}
                />
              </div>

              {/* 备注 */}
              <div className="space-y-2">
                <Label htmlFor="notes">备注</Label>
                <Textarea
                  id="notes"
                  placeholder="可填写其他说明信息"
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              {/* 提交按钮 */}
              <div className="flex gap-4">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      提交入库
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/inbound/records")}>
                  查看记录
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
