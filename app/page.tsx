"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Package,
  TrendingUp,
  AlertTriangle,
  FileText,
  ArrowRight,
  ShoppingCart,
  BarChart3,
  DollarSign,
} from "lucide-react"

interface DashboardStats {
  today: {
    count: number
    quantity: number
    amount: number
  }
  month: {
    count: number
    amount: number
  }
  products: {
    total: number
  }
  alerts: {
    lowStock: number
  }
  trend: Array<{
    date: string
    count: number
    amount: number
  }>
}

export default function HomePage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats")
      const result = await response.json()

      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error("[v0] Error fetching stats:", error)
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

  const quickActions = [
    {
      title: "商品入库",
      description: "快速录入新商品入库",
      icon: Package,
      color: "bg-blue-500",
      href: "/inbound",
    },
    {
      title: "商品管理",
      description: "查看和管理商品信息",
      icon: ShoppingCart,
      color: "bg-green-500",
      href: "/products",
    },
    {
      title: "入库记录",
      description: "查询历史入库记录",
      icon: FileText,
      color: "bg-purple-500",
      href: "/inbound/records",
    },
    {
      title: "报价管理",
      description: "生成和导出报价表",
      icon: DollarSign,
      color: "bg-orange-500",
      href: "/quotations",
    },
  ]

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/40">
      {/* 头部 */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">仓库管理系统</h1>
              <p className="text-sm text-muted-foreground">店家端 - 数据总览</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{new Date().toLocaleDateString("zh-CN")}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 数据统计卡片 */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">今日入库</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.today.count || 0} 单</div>
              <p className="text-xs text-muted-foreground">共 {stats?.today.quantity || 0} 件商品</p>
              <p className="mt-1 text-sm font-medium text-green-600">{formatCurrency(stats?.today.amount || 0)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">本月入库</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.month.count || 0} 单</div>
              <p className="mt-2 text-sm font-medium text-blue-600">{formatCurrency(stats?.month.amount || 0)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">商品总数</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.products.total || 0}</div>
              <p className="text-xs text-muted-foreground">种商品</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">库存预警</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.alerts.lowStock || 0}</div>
              <p className="text-xs text-muted-foreground">件商品库存不足</p>
            </CardContent>
          </Card>
        </div>

        {/* 快捷功能 */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">快捷功能</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Card
                key={action.title}
                className="cursor-pointer transition-all hover:shadow-lg"
                onClick={() => router.push(action.href)}
              >
                <CardContent className="flex items-start gap-4 p-6">
                  <div className={`rounded-lg ${action.color} p-3 text-white`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 font-semibold">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 入库趋势 */}
        <Card>
          <CardHeader>
            <CardTitle>最近7天入库趋势</CardTitle>
            <CardDescription>入库数量和金额统计</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.trend && stats.trend.length > 0 ? (
              <div className="space-y-4">
                {stats.trend.map((item) => (
                  <div key={item.date} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-muted-foreground">{item.date}</div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium">{item.count} 单</span>
                        <span className="text-sm font-medium text-green-600">{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${Math.min((item.count / (stats.today.count || 1)) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">暂无数据</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
