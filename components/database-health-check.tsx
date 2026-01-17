"use client"

import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle2, XCircle, RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DatabaseStatus {
  success: boolean
  message: string
  timestamp?: string
  error?: string
}

export function DatabaseHealthCheck() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [checking, setChecking] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  const checkDatabaseConnection = async () => {
    setChecking(true)
    try {
      const response = await fetch("/api/health")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      setStatus({
        success: false,
        message: "无法连接到服务器",
        error: "请检查服务器是否正常运行"
      })
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    checkDatabaseConnection()
    // 每30秒检查一次
    const interval = setInterval(checkDatabaseConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!status) {
    return null
  }

  // 连接正常时显示小角标
  if (status.success) {
    if (!isVisible) return null
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-green-700 shadow-lg border border-green-200">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="font-medium">数据库正常</span>
          <button
            onClick={() => setIsVisible(false)}
            className="ml-1 rounded-full p-1 hover:bg-green-50 text-green-500"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    )
  }

  // 连接异常时显示通知
  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="rounded-lg border border-red-200 bg-white/95 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <h5 className="font-medium text-gray-900 mb-1">数据库连接异常</h5>
              <p className="text-sm text-gray-600 mb-2">{status.message}</p>
              {status.error && (
                <p className="text-xs text-gray-500 mb-3">{status.error}</p>
              )}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkDatabaseConnection}
                  disabled={checking}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {checking ? (
                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  重新检测
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsVisible(false)}
                  className="text-gray-500 hover:bg-gray-100"
                >
                  <X className="h-3 w-3 mr-1" />
                  关闭
                </Button>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  )
}