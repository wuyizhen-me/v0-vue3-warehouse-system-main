"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Loader2, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ChatMessage {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
}

interface AIAssistantProps {
  username: string
}

// 获取AI配置
const getAIConfig = () => {
  if (typeof window === 'undefined') return null
  return {
    apiKey: localStorage.getItem('ai_api_key') || '',
    baseUrl: localStorage.getItem('ai_base_url') || 'https://api.openai.com',
    model: localStorage.getItem('ai_model') || 'gpt-3.5-turbo'
  }
}

export function AIAdminAssistant({ username }: AIAssistantProps) {
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // 发送消息
  const sendMessage = async () => {
    if (!inputMessage.trim()) return
    
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
      // 获取AI配置
      const config = getAIConfig()
      
      // 调用AI商家助手服务
      const response = await fetch('/api/ai/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          content: inputMessage,
          conversation: chatMessages,
          config: config && config.apiKey ? config : undefined
        })
      })
      
      const result = await response.json()
      
      // 检查是否包含系统操作
      if (result.success && result.data) {
        // 检查是否是系统操作指令
        if (result.data.startsWith('【创建商品:')) {
          // 跳转到商品创建页面
          window.location.href = '/products/create'
        } else if (result.data.startsWith('【编辑商品:')) {
          const productId = result.data.match(/【编辑商品:(\d+)】/)?.[1]
          if (productId) {
            // 跳转到商品编辑页面
            window.location.href = `/products/${productId}`
          }
        } else if (result.data.startsWith('【回复客户:')) {
          // 解析回复客户指令
          const match = result.data.match(/【回复客户:([^|]+)\|类型:([^|]+)\|内容:([^\]]+)】/)
          if (match) {
            const [, customerUsername, replyType, replyContent] = match
            
            // 调用回复客户API
            const replyResponse = await fetch('/api/chat/reply', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                customerUsername,
                replyType,
                replyContent,
                adminUsername: username
              })
            })
            
            const replyResult = await replyResponse.json()
            
            if (replyResult.success) {
              // 添加成功提示消息
              const successMessage: ChatMessage = {
                id: (Date.now() + 2).toString(),
                content: `✅ 已成功回复客户 ${customerUsername}`,
                sender: 'ai',
                timestamp: new Date()
              }
              setChatMessages(prev => [...prev, successMessage])
              return
            }
          }
        }
      }
      
      // 添加AI回复
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: result.success ? result.data : '抱歉，我暂时无法为您提供帮助',
        sender: 'ai',
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('AI商家助手请求失败:', error)
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
    <div className="fixed bottom-6 left-6 z-50">
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
                <h3 className="font-semibold">AI商家助手</h3>
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
                <h3 className="font-medium text-gray-800 mb-1">欢迎使用AI商家助手</h3>
                <p className="text-sm">我可以帮您创建商品、编辑商品或查看未读消息</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => {
                    setInputMessage("你好，我想了解一下未读消息");
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
                      <UserIcon className="h-5 w-5 text-white" />
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
