"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getUserSession, isAdmin } from "@/lib/auth"
import { MessageSquare, ArrowLeft, Mail, MailOpen, Reply, Trash2 } from "lucide-react"

interface Message {
  id: number
  sender_username: string
  sender_role: string
  subject?: string
  content: string
  is_read: boolean
  reply_count: number
  created_at: string
}

interface MessageReply {
  id: number
  sender_username: string
  sender_role: string
  content: string
  created_at: string
}

export default function AdminMessagesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [replies, setReplies] = useState<{ [key: number]: MessageReply[] }>({})
  const [loading, setLoading] = useState(true)
  const [replyDialogOpen, setReplyDialogOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [replyContent, setReplyContent] = useState("")

  useEffect(() => {
    const currentUser = getUserSession()
    if (!currentUser || !isAdmin(currentUser)) {
      router.push("/login")
      return
    }
    setUser(currentUser)
    fetchMessages(currentUser)
  }, [])

  const fetchMessages = async (currentUser: any) => {
    try {
      const response = await fetch(`/api/messages?username=${currentUser.username}&role=${currentUser.role}`)
      const result = await response.json()

      if (result.success) {
        setMessages(result.data)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReplies = async (messageId: number) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/replies`)
      const result = await response.json()

      if (result.success) {
        setReplies((prev) => ({ ...prev, [messageId]: result.data }))
      }
    } catch (error) {
      console.error("Error fetching replies:", error)
    }
  }

  const handleReply = async () => {
    if (!replyContent || !selectedMessage) return

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_username: user.username,
          sender_role: user.role,
          receiver_username: selectedMessage.sender_username,
          receiver_role: selectedMessage.sender_role,
          content: replyContent,
          parent_id: selectedMessage.id,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setReplyDialogOpen(false)
        setReplyContent("")
        fetchReplies(selectedMessage.id)
      } else {
        alert("回复失败")
      }
    } catch (error) {
      console.error("Error replying:", error)
      alert("回复失败")
    }
  }

  const handleDelete = async (messageId: number) => {
    if (!confirm("确认删除此留言？")) return

    try {
      const response = await fetch(`/api/messages?id=${messageId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        fetchMessages(user)
      } else {
        alert("删除失败")
      }
    } catch (error) {
      console.error("Error deleting message:", error)
      alert("删除失败")
    }
  }

  const markAsRead = async (messageId: number) => {
    try {
      await fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: messageId }),
      })
      fetchMessages(user)
    } catch (error) {
      console.error("Error marking as read:", error)
    }
  }

  const toggleReplies = (message: Message) => {
    if (replies[message.id]) {
      const newReplies = { ...replies }
      delete newReplies[message.id]
      setReplies(newReplies)
    } else {
      fetchReplies(message.id)
    }

    if (!message.is_read) {
      markAsRead(message.id)
    }
  }

  if (!user) return null

  const unreadCount = messages.filter((m) => !m.is_read).length

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
                <h1 className="text-2xl font-bold">客户留言管理</h1>
                <p className="text-sm text-muted-foreground">
                  查看和回复客户留言 {unreadCount > 0 && `• ${unreadCount} 条未读`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              客户留言
            </CardTitle>
            <CardDescription>共 {messages.length} 条留言</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">加载中...</div>
            ) : messages.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">暂无留言</div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-lg border p-4 ${!message.is_read ? "border-blue-300 bg-blue-50/50" : ""}`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {message.is_read ? (
                          <MailOpen className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Mail className="h-5 w-5 text-blue-600" />
                        )}
                        <div>
                          {message.subject && <h3 className="font-semibold">{message.subject}</h3>}
                          <p className="text-sm text-muted-foreground">
                            来自: {message.sender_username} • {new Date(message.created_at).toLocaleString("zh-CN")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMessage(message)
                            setReplyDialogOpen(true)
                          }}
                        >
                          <Reply className="mr-1 h-4 w-4" />
                          回复
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => toggleReplies(message)}>
                          {replies[message.id] ? "隐藏" : "查看"}回复 ({message.reply_count})
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(message.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="mb-3 text-sm">{message.content}</p>

                    {/* 回复列表 */}
                    {replies[message.id] && (
                      <div className="mt-4 space-y-2 border-l-2 border-muted pl-4">
                        {replies[message.id].map((reply) => (
                          <div key={reply.id} className="rounded bg-muted/50 p-3">
                            <div className="mb-1 flex items-center gap-2 text-sm">
                              <span className="font-medium">
                                {reply.sender_role === "admin" ? "我" : reply.sender_username}
                              </span>
                              <span className="text-muted-foreground">
                                {new Date(reply.created_at).toLocaleString("zh-CN")}
                              </span>
                            </div>
                            <p className="text-sm">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* 回复对话框 */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>回复客户</DialogTitle>
            <DialogDescription>
              回复给: {selectedMessage?.sender_username} - {selectedMessage?.subject || "无主题"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reply-content">回复内容</Label>
              <Textarea
                id="reply-content"
                placeholder="请输入回复内容"
                rows={4}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
              />
            </div>

            <Button onClick={handleReply} className="w-full">
              发送回复
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
