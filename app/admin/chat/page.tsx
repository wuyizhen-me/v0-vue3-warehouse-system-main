"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getUserSession, isAdmin } from "@/lib/auth"
import { ArrowLeft, MessageSquare, User } from "lucide-react"

interface ChatRoom {
  id: number
  customer_username: string
  last_message: string
  last_message_time: string
  unread_count_admin: number
}

export default function AdminChatListPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getUserSession()
    if (!currentUser || !isAdmin(currentUser)) {
      router.push("/login")
      return
    }
    setUser(currentUser)
    fetchRooms(currentUser)
  }, [])

  const fetchRooms = async (currentUser: any) => {
    try {
      const response = await fetch(`/api/chat/rooms?username=${currentUser.username}&role=${currentUser.role}`)
      const result = await response.json()

      if (result.success) {
        setRooms(result.data)
      }
    } catch (error) {
      console.error("Error fetching rooms:", error)
    } finally {
      setLoading(false)
    }
  }

  const totalUnread = rooms.reduce((sum, room) => sum + room.unread_count_admin, 0)

  if (!user) return null

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
                <h1 className="text-2xl font-bold">客户聊天</h1>
                <p className="text-sm text-muted-foreground">
                  {totalUnread > 0 ? `${totalUnread} 条未读消息` : "所有对话"}
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
              聊天列表
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">加载中...</div>
            ) : rooms.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">暂无聊天记录</div>
            ) : (
              <div className="space-y-2">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-all hover:bg-muted/50"
                    onClick={() => router.push(`/admin/chat/${room.id}`)}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{room.customer_username}</h3>
                        <span className="text-xs text-muted-foreground">
                          {room.last_message_time
                            ? new Date(room.last_message_time).toLocaleString("zh-CN", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {room.last_message || "暂无消息"}
                        </p>
                        {room.unread_count_admin > 0 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                            {room.unread_count_admin}
                          </span>
                        )}
                      </div>
                    </div>
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
