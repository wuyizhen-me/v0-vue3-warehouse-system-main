"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getUserSession, isAdmin } from "@/lib/auth"
import { MessageSquare, Trash2, Search, ArrowLeft, Plus, ArrowDown, ArrowUp } from "lucide-react"

interface CommunicationLog {
  id: number
  client_name: string
  message: string
  log_type: "inbound" | "outbound"
  log_time: string
}

export default function CommunicationsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<CommunicationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchClient, setSearchClient] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  const [newLog, setNewLog] = useState({
    client_name: "",
    message: "",
    log_type: "inbound" as "inbound" | "outbound",
  })

  useEffect(() => {
    const user = getUserSession()
    if (!user || !isAdmin(user)) {
      router.push("/login")
      return
    }
    fetchLogs()
  }, [])

  const fetchLogs = async (client = "") => {
    try {
      const url = client ? `/api/communications?client=${encodeURIComponent(client)}` : "/api/communications"
      const response = await fetch(url)
      const result = await response.json()

      if (result.success) {
        setLogs(result.data)
      }
    } catch (error) {
      console.error("Error fetching logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newLog.client_name) {
      alert("请输入客户名称")
      return
    }

    try {
      const response = await fetch("/api/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLog),
      })

      const result = await response.json()

      if (result.success) {
        setDialogOpen(false)
        setNewLog({ client_name: "", message: "", log_type: "inbound" })
        fetchLogs()
      } else {
        alert("添加失败")
      }
    } catch (error) {
      console.error("Error adding log:", error)
      alert("添加失败")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("确认删除此日志？")) return

    try {
      const response = await fetch(`/api/communications?id=${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        setLogs(logs.filter((l) => l.id !== id))
      } else {
        alert("删除失败")
      }
    } catch (error) {
      console.error("Error deleting log:", error)
      alert("删除失败")
    }
  }

  const handleSearch = () => {
    fetchLogs(searchClient)
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
                <h1 className="text-2xl font-bold">客户沟通日志</h1>
                <p className="text-sm text-muted-foreground">记录和管理客户沟通信息</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 搜索和添加 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>搜索和管理</CardTitle>
            <CardDescription>按客户名称筛选或添加新日志</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="输入客户名称..."
                value={searchClient}
                onChange={(e) => setSearchClient(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                搜索
              </Button>
              <Button variant="outline" onClick={() => { setSearchClient(""); fetchLogs(); }}>
                重置
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    添加日志
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>添加沟通日志</DialogTitle>
                    <DialogDescription>记录与客户的沟通信息</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="client">客户名称</Label>
                      <Input
                        id="client"
                        placeholder="请输入客户名称"
                        value={newLog.client_name}
                        onChange={(e) => setNewLog({ ...newLog, client_name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">类型</Label>
                      <Select
                        value={newLog.log_type}
                        onValueChange={(value: "inbound" | "outbound") => setNewLog({ ...newLog, log_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inbound">入站（客户发来）</SelectItem>
                          <SelectItem value="outbound">出站（发给客户）</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">消息内容</Label>
                      <Textarea
                        id="message"
                        placeholder="请输入消息内容"
                        rows={4}
                        value={newLog.message}
                        onChange={(e) => setNewLog({ ...newLog, message: e.target.value })}
                      />
                    </div>

                    <Button onClick={handleAdd} className="w-full">
                      添加
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* 日志列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              沟通日志
            </CardTitle>
            <CardDescription>共 {logs.length} 条日志</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">加载中...</div>
            ) : logs.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">暂无日志</div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 rounded-lg border p-4 transition-all hover:bg-muted/50"
                  >
                    <div
                      className={`rounded-full p-2 ${
                        log.log_type === "inbound" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                      }`}
                    >
                      {log.log_type === "inbound" ? (
                        <ArrowDown className="h-5 w-5" />
                      ) : (
                        <ArrowUp className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-semibold">{log.client_name}</span>
                        <span
                          className={`rounded px-2 py-0.5 text-xs ${
                            log.log_type === "inbound"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {log.log_type === "inbound" ? "入站" : "出站"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(log.log_time).toLocaleString("zh-CN")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{log.message || "无消息内容"}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(log.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
