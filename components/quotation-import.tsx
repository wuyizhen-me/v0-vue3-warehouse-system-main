"use client"

import { useState, useRef } from "react"
import { Upload, Download, FileText, AlertCircle, CheckCircle, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface QuotationProduct {
  name: string
  sku?: string
  category?: string
  unit?: string
  price?: number
  description?: string
  brand?: string
  model?: string
  specifications?: string
}

interface ImportResult {
  products: QuotationProduct[]
  totalCount: number
  validCount: number
}

interface SaveResult {
  results: Array<{
    sku?: string
    name: string
    success: boolean
    error?: string
  }>
  successCount: number
  errorCount: number
  totalCount: number
}

interface QuotationImportProps {
  onImportComplete?: (products: QuotationProduct[]) => void
  className?: string
}

export function QuotationImport({ onImportComplete, className = "" }: QuotationImportProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string>("")
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError("")
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/quotations/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      
      if (data.success) {
        setResult(data.data)
        if (onImportComplete) {
          onImportComplete(data.data.products)
        }
      } else {
        setError(data.error || '导入失败')
      }
    } catch (error) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProducts = async () => {
    if (!result || !result.products || result.products.length === 0) return

    setSaving(true)
    setError("")

    try {
      const response = await fetch('/api/products/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products: result.products }),
      })

      const data = await response.json()
      
      if (data.success) {
        setSaveResult(data.data)
        // 清空导入结果，防止重复保存
        setResult(null)
      } else {
        setError(data.error || '保存失败')
      }
    } catch (error) {
      setError('网络错误，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/quotations/template?format=1')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = '商品导入模板.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      setError('模板下载失败')
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>报价表导入</CardTitle>
        <CardDescription>
          上传 Excel 格式的报价表文件，快速导入商品信息
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            选择文件
          </Button>
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            下载模板
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />

        {saveResult && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              成功保存 {saveResult.successCount} 个商品，失败 {saveResult.errorCount} 个
            </AlertDescription>
          </Alert>
        )}

        {saveResult && saveResult.errorCount > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">以下商品保存失败：</div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {saveResult.results
                    .filter(r => !r.success)
                    .map((r, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium">{r.name}</span>
                        {r.sku && <span className="ml-2 text-muted-foreground">SKU: {r.sku}</span>}
                        {r.error && <span className="ml-2 text-red-600">({r.error})</span>}
                      </div>
                    ))
                  }
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              成功解析 {result.validCount} 个商品，共 {result.totalCount} 条记录
            </AlertDescription>
          </Alert>
        )}

        {result && result.products.length > 0 && (
          <Button
            onClick={handleSaveProducts}
            disabled={saving}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            保存到数据库
          </Button>
        )}

        {result && result.products.length > 0 && (
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              预览商品 ({result.products.length}个)
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {result.products.slice(0, 5).map((product, index) => (
                <div key={index} className="flex justify-between items-center py-1 border-b last:border-b-0">
                  <span className="text-sm font-medium">{product.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {product.sku && `SKU: ${product.sku}`}
                    {product.price && ` ¥${product.price}`}
                  </span>
                </div>
              ))}
              {result.products.length > 5 && (
                <div className="text-sm text-muted-foreground text-center py-1">
                  还有 {result.products.length - 5} 个商品...
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}