"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, X, Send, Loader2 } from "lucide-react"

interface ChatMessage {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
}

interface AICustomerChatProps {
  user: any
  products: any[]
}

export default function AICustomerChat({ user, products }: AICustomerChatProps) {
  const router = useRouter()
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // 生成AI客服提示词
  const generateAIPrompt = () => {
    const systemPrompt = `你是一个智能客服助手，负责帮助客户处理商品咨询、报价请求和留言等事务。

系统操作说明：
1. 显示指定商品：当用户询问特定商品信息时，使用格式【显示商品:{商品ID}】
2. 生成报价表：当用户需要报价表时，使用格式【生成报价表:{商品ID列表}】
3. 商家留言：当用户需要给商家留言时，使用格式【商家留言:{留言内容}】

当前可用商品列表：
${products.map(p => `${p.id}: ${p.name} (价格: ${p.price}元，库存: ${p.stock_quantity}${p.unit || '件'})`).join('\n')}

请根据用户需求，提供友好的回复，并在需要时使用系统操作格式。`
    
    return systemPrompt
  }

  // 发送消息
  const sendMessage = async () => {
    if (!inputMessage.trim() || !user) return
    
    // 添加用户消息
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    }
    setChatMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)
    
    try {
      // 保存用户消息到数据库
      await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          content: inputMessage,
          sender_type: 'user'
        })
      })
      
      // 调用AI服务获取回复
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'description',
          context: inputMessage,
          data: { 
            prompt: generateAIPrompt(),
            conversation: chatMessages
          }
        })
      })
      
      const result = await response.json()
      const aiResponse = result.success ? result.data : '抱歉，我暂时无法为您提供帮助'
      
      // 检查是否包含系统操作
      if (result.success && result.data) {
        // 检查是否是系统操作指令
        if (result.data.startsWith('【显示商品:')) {
          const productId = result.data.match(/【显示商品:(\d+)】/)?.[1]
          if (productId) {
            // 跳转到商品详情页
            router.push(`/products/${productId}`)
          }
        } else if (result.data.startsWith('【生成报价表:')) {
          const productIds = result.data.match(/【生成报价表:(\d+(,\d+)*)】/)?.[1]
          if (productIds) {
            // 跳转到统一的报价表创建页面
            router.push(`/quotations/create`)
          }
        } else if (result.data.startsWith('【商家留言:')) {
          const message = result.data.match(/【商家留言:(.*)】/)?.[1]
          if (message) {
            // 调用留言API
            await fetch('/api/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                username: user.username,
                content: message,
                type: 'feedback'
              })
            })
          }
        }
      }
      
      // 保存AI回复到数据库
      await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          content: aiResponse,
          sender_type: 'ai'
        })
      })
      
      // 添加AI回复
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('AI回复失败:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: '抱歉，服务器暂时无法响应，请稍后再试',
        sender: 'ai',
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 聊天窗口 */}
      {showChat && (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border overflow-hidden transition-all duration-300 transform scale-100">
          {/* 聊天窗口头部 */}
          <div className="bg-gradient-to-r from-primary to-primary/90 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">AI客服助手</h3>
                <p className="text-xs opacity-80">24小时在线为您服务</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowChat(false)}
              className="text-white hover:bg-white/10 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* 聊天消息区域 */}
          <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-muted/10 to-white">
            {chatMessages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="bg-primary/10 p-4 rounded-full inline-block mb-3">
                  <MessageCircle className="h-10 w-10 text-primary mx-auto" />
                </div>
                <h3 className="font-medium text-gray-800 mb-1">欢迎使用AI客服助手</h3>
                <p className="text-sm">我可以帮您解答商品问题、生成报价表或给商家留言</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => {
                    setInputMessage("你好，我想了解一下你们的产品");
                    sendMessage();
                  }}
                >
                  开始对话
                </Button>
              </div>
            ) : (
              chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
                >
                  {message.sender === 'ai' && (
                    <div className="bg-primary/10 p-2 rounded-full">
                      <MessageCircle className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${message.sender === 'user' 
                      ? 'bg-primary text-white rounded-br-none shadow-md' 
                      : 'bg-white border border-muted shadow-sm'}`}
                  >
                    <p className="leading-relaxed">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1 text-right">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {message.sender === 'user' && (
                    <div className="bg-primary p-2 rounded-full">
                      <Loader2 className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
              ))
            )}
            
            {/* 正在输入指示器 */}
            {isTyping && (
              <div className="flex justify-start items-end gap-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="bg-white border border-muted p-3 rounded-lg rounded-tl-none shadow-sm">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-primary/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="h-2 w-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="h-2 w-2 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef}></div>
          </div>
          
          {/* 输入区域 */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2 items-end">
              <Input
                placeholder="请输入您的问题..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 rounded-full border-muted focus-visible:ring-primary"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="rounded-full h-10 w-10 p-0 bg-primary hover:bg-primary/90 transition-all"
              >
                {isTyping ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Send className="h-4 w-4 text-white" />
                )}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground text-center mt-2">
              输入 "帮助" 查看可用功能
            </div>
          </div>
        </div>
      )}
      
      {/* 气泡按钮 */}
      {!showChat && (
        <Button
          onClick={() => setShowChat(true)}
          className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white transition-all duration-300 transform hover:scale-110 active:scale-95"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
}