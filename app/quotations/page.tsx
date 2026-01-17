"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, FileText } from "lucide-react"

export default function QuotationsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">报价管理</h1>
              <p className="text-sm text-muted-foreground">生成和管理商品报价单</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card
            className="cursor-pointer transition-all hover:shadow-lg"
            onClick={() => router.push("/quotations/create")}
          >
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-4">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">新建报价表</h3>
              <p className="text-sm text-muted-foreground">选择商品创建新的报价单</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-all hover:shadow-lg" onClick={() => router.push("/products")}>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-4 rounded-full bg-blue-500/10 p-4">
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">从商品生成</h3>
              <p className="text-sm text-muted-foreground">浏览商品并生成报价</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
            <CardDescription>如何使用报价管理功能</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">选择商品</h4>
                  <p className="text-sm text-muted-foreground">在商品管理中查看商品详情，点击"生成报价表"按钮</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">填写信息</h4>
                  <p className="text-sm text-muted-foreground">输入客户信息、调整数量和价格，添加多个商品</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">预览导出</h4>
                  <p className="text-sm text-muted-foreground">预览报价表内容，确认无误后可打印或导出为Excel文件</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
