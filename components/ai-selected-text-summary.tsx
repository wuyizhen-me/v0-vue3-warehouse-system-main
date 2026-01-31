"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Sparkles, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AISelectedTextSummaryProps {
  className?: string
}

// 按钮尺寸常量
const BUTTON_WIDTH = 90
const BUTTON_HEIGHT = 32
const POPUP_WIDTH = 320
const POPUP_HEIGHT = 220
const MARGIN = 12
const MIN_SELECTION_LENGTH = 10

// 获取AI配置
const getAIConfig = () => {
  if (typeof window === 'undefined') return null
  return {
    apiKey: localStorage.getItem('ai_api_key') || '',
    baseUrl: localStorage.getItem('ai_base_url') || 'https://api.openai.com',
    model: localStorage.getItem('ai_model') || 'gpt-3.5-turbo'
  }
}

export function AISelectedTextSummary({ className = "" }: AISelectedTextSummaryProps) {
  const [selectedText, setSelectedText] = useState("")
  const [summary, setSummary] = useState("")
  const [loading, setLoading] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 })
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })
  const [isButtonAbove, setIsButtonAbove] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const lastSelectionRef = useRef<string>("")

  // 计算按钮位置 - 优化版本
  const calculateButtonPosition = useCallback((rect: DOMRect) => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // 默认显示在选中文本下方居中
    let x = rect.left + rect.width / 2 - BUTTON_WIDTH / 2
    let y = rect.bottom + MARGIN
    let above = false
    
    // 水平边界检查：确保按钮不超出视口左右边界
    x = Math.max(MARGIN, Math.min(x, viewportWidth - BUTTON_WIDTH - MARGIN))
    
    // 垂直边界检查：如果下方空间不足，显示在上方
    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top
    
    if (spaceBelow < BUTTON_HEIGHT + MARGIN && spaceAbove > spaceBelow) {
      // 上方空间更大，显示在上方
      y = rect.top - BUTTON_HEIGHT - MARGIN
      above = true
    }
    
    return { x, y, above }
  }, [])

  // 计算弹窗位置 - 优化版本
  const calculatePopupPosition = useCallback((buttonRect: DOMRect, isAbove: boolean) => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    let x = buttonRect.left + buttonRect.width / 2 - POPUP_WIDTH / 2
    let y: number
    
    // 水平居中，但确保不超出边界
    x = Math.max(MARGIN, Math.min(x, viewportWidth - POPUP_WIDTH - MARGIN))
    
    // 垂直位置：如果按钮在上方，弹窗显示在按钮下方；反之亦然
    if (isAbove) {
      // 按钮在选中文本上方，弹窗显示在按钮下方
      y = buttonRect.bottom + MARGIN
      // 检查下方空间
      if (y + POPUP_HEIGHT > viewportHeight - MARGIN) {
        y = Math.max(MARGIN, buttonRect.top - POPUP_HEIGHT - MARGIN)
      }
    } else {
      // 按钮在选中文本下方，弹窗显示在按钮下方
      y = buttonRect.bottom + MARGIN
      // 检查下方空间是否足够
      if (y + POPUP_HEIGHT > viewportHeight - MARGIN) {
        // 空间不足，显示在按钮上方
        y = Math.max(MARGIN, buttonRect.top - POPUP_HEIGHT - MARGIN)
      }
    }
    
    return { x, y }
  }, [])

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection()
      const text = selection?.toString().trim() || ""
      
      // 避免重复处理相同的选中文本
      if (text === lastSelectionRef.current) return
      lastSelectionRef.current = text
      
      if (text && text.length >= MIN_SELECTION_LENGTH) {
        setSelectedText(text)
        setShowSummary(false)
        
        // 获取选中文本的位置
        const range = selection?.getRangeAt(0)
        if (range) {
          const rect = range.getBoundingClientRect()
          const pos = calculateButtonPosition(rect)
          setButtonPosition({ x: pos.x, y: pos.y })
          setIsButtonAbove(pos.above)
        }
      } else if (!text) {
        setSelectedText("")
        setShowSummary(false)
      }
    }

    const handleMouseUp = () => {
      // 延迟执行，确保选区已更新
      setTimeout(handleSelectionChange, 10)
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isClickInsideButton = buttonRef.current?.contains(target)
      const isClickInsidePopup = popupRef.current?.contains(target)
      
      if (!isClickInsideButton && !isClickInsidePopup) {
        setShowSummary(false)
        setSelectedText("")
        lastSelectionRef.current = ""
      }
    }

    // 监听选区变化
    document.addEventListener("selectionchange", handleSelectionChange)
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [calculateButtonPosition])

  // 当显示摘要时，计算弹窗位置
  useEffect(() => {
    if (showSummary && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const pos = calculatePopupPosition(buttonRect, isButtonAbove)
      setPopupPosition(pos)
    }
  }, [showSummary, isButtonAbove, calculatePopupPosition])

  // 窗口大小变化时重新计算位置
  useEffect(() => {
    const handleResize = () => {
      if (selectedText) {
        const selection = window.getSelection()
        if (selection && selection.toString().trim() === selectedText) {
          const range = selection.getRangeAt(0)
          const rect = range.getBoundingClientRect()
          const pos = calculateButtonPosition(rect)
          setButtonPosition({ x: pos.x, y: pos.y })
          setIsButtonAbove(pos.above)
        }
      }
    }

    window.addEventListener("resize", handleResize)
    window.addEventListener("scroll", handleResize, true)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("scroll", handleResize, true)
    }
  }, [selectedText, calculateButtonPosition])

  const generateSummary = async () => {
    if (!selectedText) return

    setLoading(true)
    
    try {
      // 获取AI配置
      const config = getAIConfig()
      
      const response = await fetch("/api/ai/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          text: selectedText, 
          type: "selected_text",
          config: config && config.apiKey ? config : undefined
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        setSummary(result.data)
        setShowSummary(true)
      } else {
        setSummary("AI摘要生成失败，请稍后重试")
        setShowSummary(true)
      }
    } catch (error) {
      setSummary("网络错误，请检查网络连接后重试")
      setShowSummary(true)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setShowSummary(false)
  }

  const handleCloseAll = () => {
    setShowSummary(false)
    setSelectedText("")
    lastSelectionRef.current = ""
    // 清除选区
    window.getSelection()?.removeAllRanges()
  }

  if (!selectedText) return null

  return (
    <>
      {/* AI摘要按钮 */}
      <div 
        ref={buttonRef}
        className="fixed z-50 animate-in fade-in zoom-in duration-200"
        style={{ 
          left: buttonPosition.x, 
          top: buttonPosition.y,
          transform: 'translateZ(0)' // 启用GPU加速
        }}
      >
        <Button
          size="sm"
          onClick={generateSummary}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-shadow"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          AI摘要
        </Button>
      </div>

      {/* 摘要悬浮窗 */}
      {showSummary && (
        <div 
          ref={popupRef}
          className="fixed z-[60] bg-white border border-gray-200 rounded-lg shadow-2xl p-4 w-80 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ 
            left: popupPosition.x, 
            top: popupPosition.y,
            maxHeight: '60vh',
            transform: 'translateZ(0)' // 启用GPU加速
          }}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-800">AI摘要</span>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="关闭"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
          
          {/* 内容 */}
          <div className="text-sm text-gray-700 leading-relaxed overflow-y-auto" style={{ maxHeight: 'calc(60vh - 120px)' }}>
            {summary}
          </div>
          
          {/* 底部 */}
          <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCloseAll}
              className="text-gray-500 hover:text-gray-700"
            >
              关闭
            </Button>
            <Button
              size="sm"
              onClick={generateSummary}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Sparkles className="h-3 w-3 mr-1" />
              )}
              重新生成
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
