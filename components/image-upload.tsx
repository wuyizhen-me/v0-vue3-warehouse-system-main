"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onAltChange?: (alt: string) => void
  altValue?: string
  maxSize?: number // MB
  accept?: string
  type?: "product" | "chat" | "document"
}

export function ImageUpload({ 
  value, 
  onChange, 
  onAltChange, 
  altValue,
  maxSize = 5,
  accept = "image/jpeg,image/jpg,image/png,image/webp",
  type = "product"
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!accept.split(",").includes(file.type)) {
      setError(`只允许上传 ${accept} 格式的图片`)
      return
    }

    // 验证文件大小
    if (file.size > maxSize * 1024 * 1024) {
      setError(`文件大小不能超过 ${maxSize}MB`)
      return
    }

    setUploading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", type)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        onChange(result.data.url)
        if (onAltChange) {
          onAltChange(file.name.split(".").slice(0, -1).join("."))
        }
      } else {
        setError(result.error || "上传失败")
      }
    } catch (error) {
      console.error("[v0] Upload error:", error)
      setError("上传过程中发生错误")
    } finally {
      setUploading(false)
      // 清空input，允许重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemove = () => {
    onChange("")
    if (onAltChange) {
      onAltChange("")
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <Input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {value ? (
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="relative">
              <img
                src={value}
                alt={altValue || "商品图片"}
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemove}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {onAltChange && (
              <div className="mt-3">
                <Input
                  placeholder="图片描述"
                  value={altValue || ""}
                  onChange={(e) => onAltChange(e.target.value)}
                  disabled={uploading}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card
          className="cursor-pointer transition-colors hover:bg-accent/50"
          onClick={handleClick}
        >
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-2 text-center">
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {uploading ? "上传中..." : "点击上传图片"}
                </p>
                <p className="text-xs text-muted-foreground">
                  支持 JPEG, PNG, WebP 格式，最大 {maxSize}MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}