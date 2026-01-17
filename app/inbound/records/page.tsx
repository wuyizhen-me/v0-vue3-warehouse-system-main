"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Eye } from "lucide-react"

interface InboundRecord {
  id: number
  product_name: string
  product_sku: string
  product_unit: string
  quantity: number
  unit_price: number
  total_price: number
  batch_number: string
  supplier: string
  warehouse_location: string
  inbound_date: string
  status: string
}

export default function InboundRecordsPage() {
  const router = useRouter()
  const [records, setRecords] = useState<InboundRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<InboundRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState("")

  useEffect(() => {
    fetchRecords()
  }, [])

  useEffect(() => {
    if (!searchKeyword.trim()) {
      setFilteredRecords(records)
    } else {
      const filtered = records.filter(
        (record) =>
          record.product_name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          record.product_sku.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          record.batch_number.toLowerCase().includes(searchKeyword.toLowerCase()),
      )
      setFilteredRecords(filtered)
    }
  }, [searchKeyword, records])

  const fetchRecords = async () => {
    try {
      const response = await fetch("/api/inbound")
      const result = await response.json()

      if (result.success) {
        setRecords(result.data)
        setFilteredRecords(result.data)
      }
    } catch (error) {
      console.error("[v0] Error fetching records:", error)
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
              <h1 className="text-2xl font-bold">入库记录</h1>
              <p className="text-sm text-muted-foreground">查看历史入库记录</p>
            </div>
            <Button onClick={() => router.push("/inbound")}>新建入库</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>入库记录列表</CardTitle>
                <CardDescription>共 {filteredRecords.length} 条记录</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索商品或批次号"
                  className="pl-9"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRecords.length > 0 ? (
              <div className="space-y-4">
                {filteredRecords.map((record) => (
                  <Card key={record.id} className="hover:shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold">{record.product_name}</h3>
                              <p className="text-sm text-muted-foreground">SKU: {record.product_sku}</p>
                            </div>
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                              已完成
                            </span>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            <div>
                              <span className="text-sm text-muted-foreground">入库数量</span>
                              <p className="font-medium">
                                {record.quantity} {record.product_unit}
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
                              <p className="font-mono text-sm">{record.batch_number}</p>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">入库日期</span>
                              <p className="font-medium">{record.inbound_date}</p>
                            </div>
                            {record.supplier && (
                              <div>
                                <span className="text-sm text-muted-foreground">供应商</span>
                                <p className="font-medium">{record.supplier}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-4"
                          onClick={() => router.push(`/products/${record.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">暂无入库记录</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
