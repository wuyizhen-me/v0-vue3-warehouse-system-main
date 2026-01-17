"use client"

import { useState } from "react"
import { Lightbulb, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface AISuggestionProps {
  type: 'product_name' | 'description' | 'category' | 'price' | 'stock_analysis'
  context: string
  data?: any
  onSuggestion?: (suggestion: string) => void
  className?: string
}

export function AISuggestion({ type, context, data, onSuggestion, className = "" }: AISuggestionProps) {
  const [suggestion, setSuggestion] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [showSuggestion, setShowSuggestion] = useState(false)

  const generateSuggestion = async () => {
    setLoading(true)
    setError("")
    
    try {
      const response = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type, context, data }),
      })

      const result = await response.json()
      
      if (result.success) {
        setSuggestion(result.data)
        setShowSuggestion(true)
      } else {
        setError(result.error || "AI建议生成失败")
      }
    } catch (error) {
      setError("网络错误，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  const applySuggestion = () => {
    if (onSuggestion && suggestion) {
      onSuggestion(suggestion)
      setShowSuggestion(false)
    }
  }

  const getButtonText = () => {
    switch (type) {
      case 'product_name':
        return 'AI商品名称建议'
      case 'description':
        return 'AI描述建议'
      case 'category':
        return 'AI分类建议'
      case 'price':
        return 'AI价格建议'
      case 'stock_analysis':
        return 'AI库存分析'
      default:
        return 'AI建议'
    }
  }

  return (
    <div className={className}>
      <Button
        variant="outline"
        size="sm"
        onClick={generateSuggestion}
        disabled={loading}
        className="flex items-center gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {getButtonText()}
      </Button>

      {error && (
        <div className="mt-2 text-sm text-red-600">{error}</div>
      )}

      {showSuggestion && suggestion && (
        <Card className="mt-3 p-3 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-blue-800 mb-2">{suggestion}</div>
              <div className="flex gap-2">
                {onSuggestion && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={applySuggestion}
                    className="text-blue-600 border-blue-200 hover:bg-blue-100"
                  >
                    应用建议
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowSuggestion(false)}
                  className="text-gray-500"
                >
                  关闭
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}