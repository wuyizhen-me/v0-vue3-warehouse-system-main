"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getUserSession, isAdmin } from "@/lib/auth"
import { History, Trash2, Search, ArrowLeft } from "lucide-react"

interface HistoryRecord {
  id: number
  username: string
  user_role: "admin" | "customer"
  action: string
  action_time: string
}

export default function HistoryPage() {
  const router = useRouter()
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchUsername, setSearchUsername] = useState("")

  useEffect(() => {
    const user = getUserSession()
    if (!user || !isAdmin(user)) {
      router.push("/login")
      return
    }
    fetchHistory()
  }, [])

  const fetchHistory = async (username = "") => {
    try {
      const url = username ? `/api/history?username=${encodeURIComponent(username)}` : "/api/history"
      const response = await fetch(url)
      const result = await response.json()

      if (result.success) {
        setRecords(result.data)
      }
    } catch (error) {
      console.error("Error fetching history:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("确认删除此记录？")) return

    try {
      const response = await fetch(`/api/history?id=${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        setRecords(records.filter((r) => r.id !== id))
      } else {
        alert("删除失败")
      }
    } catch (error) {
      console.error("Error deleting history:", error)
      alert("删除失败")
    }
  }

  const handleSearch = () => {
    fetchHistory(searchUsername)
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">用户历史记录</h1>
                <p className="text-sm text-muted-foreground">查看和管理用户操作历史</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 搜索栏 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>搜索历史</CardTitle>
            <CardDescription>按用户名筛选</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="输入用户名..."
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                搜索
              </Button>
              <Button variant="outline" onClick={() => { setSearchUsername(""); fetchHistory(); }}>
                重置
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 历史记录列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              历史记录
            </CardTitle>
            <CardDescription>共 {records.length} 条记录</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">加载中...</div>
            ) : records.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">暂无记录</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">ID</th>
                      <th className="p-2 text-left">用户名</th>
                      <th className="p-2 text-left">角色</th>
                      <th className="p-2 text-left">操作</th>
                      <th className="p-2 text-left">时间</th>
                      <th className="p-2 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">{record.id}</td>
                        <td className="p-2 font-medium">{record.username}</td>
                        <td className="p-2">
                          <span
                            className={`inline-block rounded px-2 py-1 text-xs ${
                              record.user_role === "admin"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {record.user_role === "admin" ? "管理员" : "客户"}
                          </span>
                        </td>
                        <td className="p-2">{record.action}</td>
                        <td className="p-2 text-sm text-muted-foreground">
                          {new Date(record.action_time).toLocaleString("zh-CN")}
                        </td>
                        <td className="p-2 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
