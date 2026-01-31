"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getUserSession } from "@/lib/auth"
import { 
  ArrowLeft, Send, Image as ImageIcon, Package, Paperclip, 
  X, Check, CheckCheck, Loader2 
} from "lucide-react"
import Image from "next/image"

interface ChatMessage {
  id: number
  sender_username: string
  sender_role: string
  message_type: "text" | "image" | "product" | "file"
  content: string
  file_url?: string
  file_name?: string
  product_id?: number
  product_name?: string
  product_price?: number
  product_image?: string
  is_read: boolean
  created_at: string
}

interface Product {
  id: number
  name: string
  price: number
  image_url?: string
}

interface ProductWithQuantity {
  product: Product
  quantity: number
}

export default function CustomerChatPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [roomId, setRoomId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productQuantity, setProductQuantity] = useState(1)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const currentUser = getUserSession()
    if (!currentUser) {
      router.push("/login")
      return
    }
    setUser(currentUser)
  }, [])

  useEffect(() => {
    if (user) {
      initChat(user)
    }
  }, [user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const initChat = async (currentUser: any) => {
    try {
      // 创建或获取聊天室
      const roomResponse = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_username: currentUser.username }),
      })
      const roomResult = await roomResponse.json()

      if (roomResult.success) {
        setRoomId(roomResult.data.id)
        fetchMessages(roomResult.data.id)
        markAsRead(roomResult.data.id, currentUser.role)
      }
    } catch (error) {
      console.error("Error initializing chat:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (room_id: number) => {
    try {
      const response = await fetch(`/api/chat/messages?room_id=${room_id}`)
      const result = await response.json()

      if (result.success) {
        setMessages(result.data)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const markAsRead = async (room_id: number, role: string) => {
    try {
      await fetch("/api/chat/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id, role }),
      })
    } catch (error) {
      console.error("Error marking as read:", error)
    }
  }

  const sendMessage = async (type: "text" | "image" | "product" | "file" = "text", extraData: any = {}) => {
    if (!roomId || !user) return
    if (type === "text" && !inputMessage.trim()) return

    setSending(true)

    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: roomId,
          sender_username: user.username,
          sender_role: user.role,
          message_type: type,
          content: type === "text" ? inputMessage : extraData.content || "",
          file_url: extraData.file_url,
          file_name: extraData.file_name,
          product_id: extraData.product_id,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setInputMessage("")
        fetchMessages(roomId)
        
        // 记录行为
        await fetch("/api/behaviors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: user.username,
            role: user.role,
            behavior_type: "send_chat_message",
            metadata: { message_type: type },
          }),
        })
      }
    } catch (error) {
      console.error("Error sending message:", error)
      alert("发送失败")
    } finally {
      setSending(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", "chat")

    setSending(true)

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        await sendMessage("image", {
          content: "发送了一张图片",
          file_url: result.data.url,
          file_name: result.data.originalName,
        })
      } else {
        alert(result.error || "上传失败")
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("上传失败")
    } finally {
      setSending(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", "document")

    setSending(true)

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        await sendMessage("file", {
          content: `发送了文件: ${file.name}`,
          file_url: result.data.url,
          file_name: result.data.originalName,
        })
      } else {
        alert(result.error || "上传失败")
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      alert("上传失败")
    } finally {
      setSending(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products")
      const result = await response.json()

      if (result.success) {
        setProducts(result.data)
        setShowProductPicker(true)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }

  const sendProduct = async () => {
    if (!selectedProduct) return
    
    const totalPrice = (selectedProduct.price || 0) * productQuantity
    await sendMessage("product", {
      content: `推荐商品: ${selectedProduct.name}，数量: ${productQuantity}件，总价: ¥${totalPrice.toFixed(2)}`,
      product_id: selectedProduct.id,
    })
    setShowProductPicker(false)
    setSelectedProduct(null)
    setProductQuantity(1)
  }

  if (!user || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-muted/40">
      {/* 头部 */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/customer")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">与店家聊天</h1>
              <p className="text-sm text-muted-foreground">在线客服</p>
            </div>
          </div>
        </div>
      </header>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-4xl space-y-4">
          {messages.map((message) => {
            const isOwn = message.sender_username === user.username
            
            return (
              <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} gap-2 p-2 rounded-lg transition-all hover:bg-gray-50/50`}>
                <div className={`flex ${isOwn ? "flex-row-reverse" : "flex-row"} items-end gap-2 max-w-[85%]`}>
                  {/* 发送者头像占位 */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isOwn ? "bg-blue-400 text-white" : "bg-gray-300 text-gray-700"}`}>
                    <span className="text-xs font-medium">{message.sender_role === "admin" ? "店" : message.sender_username.charAt(0).toUpperCase()}</span>
                  </div>
                  
                  <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} gap-1`}>
                    {/* 发送者信息 */}
                    {!isOwn && (
                      <span className="px-3 text-xs text-gray-500 font-medium">
                        {message.sender_role === "admin" ? "店家" : message.sender_username}
                      </span>
                    )}

                    {/* 消息内容 */}
                    <div
                      className={`rounded-2xl px-4 py-3 ${isOwn ? "bg-blue-500 text-white shadow-md hover:bg-blue-600 transition-colors" : "bg-white text-gray-800 border border-gray-200 shadow-sm hover:shadow-md transition-all"}`}
                      style={{
                        borderBottomLeftRadius: isOwn ? '20px' : '4px',
                        borderBottomRightRadius: isOwn ? '4px' : '20px',
                      }}
                    >
                      {/* 文本消息 */}
                      {message.message_type === "text" && (
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      )}

                      {/* 图片消息 */}
                      {message.message_type === "image" && message.file_url && (
                        <div className="space-y-2">
                          <div className="relative rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md">
                            <Image
                              src={message.file_url}
                              alt="聊天图片"
                              width={300}
                              height={200}
                              className="rounded-lg object-cover"
                            />
                          </div>
                          {message.content && (
                            <p className="text-xs opacity-90">{message.content}</p>
                          )}
                        </div>
                      )}

                      {/* 商品消息 */}
                      {message.message_type === "product" && (
                        <div className="space-y-2">
                          <div className="rounded-lg bg-white text-gray-800 border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                            <div className="flex items-center gap-3 p-3">
                              {message.product_image ? (
                                <div className="relative w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                  <Image
                                    src={message.product_image}
                                    alt={message.product_name || ""}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                                  <Package className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-800 truncate">{message.product_name || '未命名商品'}</h4>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="text-sm font-medium text-green-600">
                                    ¥{(message.product_price || 0).toFixed(2)}
                                  </span>
                                  {message.content && (
                                    <span className="text-xs text-gray-500">
                                      {message.content}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 文件消息 */}
                      {message.message_type === "file" && message.file_url && (
                        <div className="space-y-2">
                          <a
                            href={message.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            <Paperclip className="h-5 w-5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{message.file_name}</p>
                              {message.content && (
                                <p className="text-xs opacity-90">{message.content}</p>
                              )}
                            </div>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* 时间和已读状态 */}
                    <div className="flex items-center gap-1 px-2">
                      <span className="text-xs text-gray-400">
                        {new Date(message.created_at).toLocaleTimeString("zh-CN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isOwn && (
                        message.is_read ? (
                          <CheckCheck className="h-3 w-3 text-blue-400" />
                        ) : (
                          <Check className="h-3 w-3 text-gray-400" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 商品选择器 */}
      {showProductPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="w-full max-w-4xl bg-white rounded-t-2xl shadow-xl transition-all duration-300">
            <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-2xl p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">选择商品</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setShowProductPicker(false)
                    setSelectedProduct(null)
                    setProductQuantity(1)
                  }}
                  className="hover:bg-gray-100 text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="max-h-[70vh] overflow-y-auto p-4">
              {!selectedProduct ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {products.slice(0, 12).map((product) => (
                    <div
                      key={product.id}
                      className="group cursor-pointer rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-blue-300 bg-white"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="relative h-32 bg-gray-100 overflow-hidden">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-10 w-10 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-gray-800 truncate">{product.name}</h4>
                        <p className="mt-1 text-sm text-green-600 font-semibold">¥{(product.price || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 已选择商品信息 */}
                  <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden bg-white">
                    <div className="flex items-center gap-4 p-4">
                      {selectedProduct.image_url ? (
                        <div className="relative w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                          <Image
                            src={selectedProduct.image_url}
                            alt={selectedProduct.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                          <Package className="h-10 w-10 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-800">{selectedProduct.name}</h4>
                        <p className="mt-1 text-sm text-green-600 font-medium">单价: ¥{(selectedProduct.price || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 数量选择 */}
                  <div className="space-y-3">
                    <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">数量</Label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))}
                        className="h-10 w-10 p-0"
                      >
                        -
                      </Button>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={productQuantity}
                        onChange={(e) => setProductQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-24 h-10 text-center text-lg font-medium border-gray-300"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProductQuantity(productQuantity + 1)}
                        className="h-10 w-10 p-0"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  
                  {/* 总价显示 */}
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">总价</span>
                    <p className="text-xl font-bold text-blue-600">¥{((selectedProduct.price || 0) * productQuantity).toFixed(2)}</p>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex gap-3 pt-2 border-t border-gray-200">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedProduct(null)}
                      className="flex-1 h-10 border-gray-300 hover:bg-gray-100"
                    >
                      重新选择商品
                    </Button>
                    <Button 
                      onClick={sendProduct} 
                      disabled={sending}
                      className="flex-1 h-10 bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                    >
                      {sending ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> 发送中...</>
                      ) : (
                        "发送商品"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 输入区域 */}
      <div className="border-t bg-white p-4 shadow-inner">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-end gap-2 rounded-xl overflow-hidden border border-gray-200 bg-gray-50/50 p-2">
            {/* 附件按钮 */}
            <div className="flex gap-1">
              {/* 图片上传输入 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  // 根据data-type属性决定使用哪个处理函数
                  const dataType = e.target.getAttribute("data-type")
                  if (dataType === "file") {
                    handleFileUpload(e)
                  } else {
                    handleImageUpload(e)
                  }
                }}
                data-type="image"
              />
              
              {/* 图片上传按钮 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.setAttribute("accept", "image/*")
                    fileInputRef.current.setAttribute("data-type", "image")
                    fileInputRef.current.click()
                  }
                }}
                disabled={sending}
                className="text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
              >
                <ImageIcon className="h-5 w-5" />
              </Button>

              {/* 商品选择按钮 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchProducts}
                disabled={sending}
                className="text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
              >
                <Package className="h-5 w-5" />
              </Button>

              {/* 文件上传按钮 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.setAttribute("accept", ".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv")
                    fileInputRef.current.setAttribute("data-type", "file")
                    fileInputRef.current.click()
                  }
                }}
                disabled={sending}
                title="上传文件（支持PDF、Word、Excel等）"
                className="text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            </div>

            {/* 输入框 */}
            <Input
              placeholder="输入消息..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              disabled={sending}
              className="flex-1 bg-white border-0 shadow-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />

            {/* 发送按钮 */}
            <Button 
              onClick={() => sendMessage()} 
              disabled={sending || !inputMessage.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all"
            >
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* 隐藏的文件输入已移至附件按钮内部，此处不再需要 */}
    </div>
  )
}
