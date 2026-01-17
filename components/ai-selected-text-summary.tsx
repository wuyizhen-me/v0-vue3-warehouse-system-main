"use client"

import { useState, useEffect, useRef } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface AISelectedTextSummaryProps {
  className?: string
}

export function AISelectedTextSummary({ className = "" }: AISelectedTextSummaryProps) {
  const [selectedText, setSelectedText] = useState("")
  const [summary, setSummary] = useState("")
  const [loading, setLoading] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection()
      const text = selection?.toString().trim() || ""
      
      if (text && text.length > 10) {
        setSelectedText(text)
        
        // 获取鼠标位置
        const range = selection?.getRangeAt(0)
        if (range) {
          const rect = range.getBoundingClientRect()
          setPosition({
            x: rect.right + 10,
            y: rect.top
          })
        }
      } else {
        setSelectedText("")
        setShowSummary(false)
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowSummary(false)
        setSelectedText("")
      }
    }

    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("click", handleClickOutside)

    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("click", handleClickOutside)
    }
  }, [])

  const generateSummary = async () => {
    if (!selectedText) return

    setLoading(true)
    
    try {
      const response = await fetch("/api/ai/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          text: selectedText, 
          type: "selected_text" 
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        setSummary(result.data)
        setShowSummary(true)
      } else {
        setSummary("AI摘要生成失败")
      }
    } catch (error) {
      setSummary("网络错误，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  if (!selectedText) return null

  return (
    <>
      {/* 摘要按钮 */}
      <div 
        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2"
        style={{ left: position.x, top: position.y }}
      >
        <Button
          size="sm"
          variant="outline"
          onClick={generateSummary}
          disabled={loading}
          className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          AI摘要
        </Button>
      </div>

      {/* 摘要弹窗 */}
      {showSummary && (
        <div 
          ref={popupRef}
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-sm"
          style={{ left: position.x, top: position.y + 40 }}
        >
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-gray-800 mb-2">{summary}</div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowSummary(false)}
                  className="text-gray-500"
                >
                  关闭
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}