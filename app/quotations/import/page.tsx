"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

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

export default function QuotationImportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null)
  const [error, setError] = useState<string>("")
  const [fileName, setFileName] = useState<string>("")

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError("")
    setResult(null)
    setSaveResult(null)
    setFileName(file.name)

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
      // 使用正确的模板下载API
      const response = await fetch('/api/quotations/template?format=1')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'quotation_template.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      setError('模板下载失败')
    }
  }

  const resetImport = () => {
    setResult(null)
    setSaveResult(null)
    setError("")
    setFileName("")
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
              <h1 className="text-2xl font-bold">报价表导入</h1>
              <p className="text-sm text-muted-foreground">上传报价表文件，快速导入商品信息到系统</p>
            </div>
            <Button onClick={() => router.push('/products')}>
              商品列表
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 步骤说明 */}
          <Card>
            <CardHeader>
              <CardTitle>导入步骤</CardTitle>
              <CardDescription>按照以下步骤完成报价表导入</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">1</div>
                  <div>
                    <h4 className="font-medium">下载模板</h4>
                    <p className="text-sm text-muted-foreground">下载标准报价表模板，按格式填写商品信息</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">2</div>
                  <div>
                    <h4 className="font-medium">上传文件</h4>
                    <p className="text-sm text-muted-foreground">选择填写好的报价表文件，系统会自动解析商品信息</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">3</div>
                  <div>
                    <h4 className="font-medium">保存到数据库</h4>
                    <p className="text-sm text-muted-foreground">预览商品信息后，一键保存到系统数据库</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 文件选择和操作 */}
          <Card>
            <CardHeader>
              <CardTitle>文件操作</CardTitle>
              <CardDescription>选择报价表文件或下载模板</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = '.xlsx,.xls'
                    input.onchange = (e) => {
                    const event = e as unknown as React.ChangeEvent<HTMLInputElement>
                    handleFileSelect(event)
                  }
                    input.click()
                  }}
                  disabled={loading || saving}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {loading ? '正在解析...' : '选择文件'}
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  下载模板
                </Button>
                {(result || saveResult) && (
                  <Button
                    variant="outline"
                    onClick={resetImport}
                    className="flex items-center gap-2"
                  >
                    重新开始
                  </Button>
                )}
              </div>

              {fileName && (
                <div className="text-sm text-muted-foreground">
                  已选择文件: {fileName}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 状态显示 */}
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

          {/* 商品预览 */}
          {result && result.products.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  商品预览 ({result.products.length}个)
                </CardTitle>
                <CardDescription>确认商品信息无误后，点击保存按钮导入到数据库</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2 max-h-64 overflow-y-auto">
                    {result.products.map((product, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{product.name}</div>
                          {product.sku && (
                            <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
                          )}
                          {product.category && (
                            <div className="text-sm text-muted-foreground">分类: {product.category}</div>
                          )}
                        </div>
                        <div className="text-right">
                          {product.price && (
                            <div className="font-medium">¥{product.price}</div>
                          )}
                          {product.unit && (
                            <div className="text-sm text-muted-foreground">单位: {product.unit}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      共 {result.products.length} 个商品
                    </div>
                    <Button
                      onClick={handleSaveProducts}
                      disabled={saving}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      {saving ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      {saving ? '正在保存...' : '保存到数据库'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 完成提示 */}
          {saveResult && saveResult.successCount > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">导入完成！</h3>
                    <p className="text-green-700">
                      成功导入 {saveResult.successCount} 个商品到系统中
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={resetImport}>
                      继续导入
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/products')}>
                      查看商品列表
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}