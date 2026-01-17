import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

// 配置文件上传
export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ success: false, error: "请选择文件" }, { status: 400 })
    }

    // 验证文件类型
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: "只允许上传图片文件 (JPEG, PNG, WebP)" }, { status: 400 })
    }

    // 验证文件大小 (最大5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: "文件大小不能超过5MB" }, { status: 400 })
    }

    // 创建上传目录
    const uploadDir = join(process.cwd(), "public", "uploads", "products")
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // 生成唯一文件名
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split(".").pop()
    const fileName = `product_${timestamp}_${randomStr}.${extension}`
    const filePath = join(uploadDir, fileName)

    // 保存文件
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // 返回文件URL
    const fileUrl = `/uploads/products/${fileName}`

    return NextResponse.json({
      success: true,
      data: {
        url: fileUrl,
        filename: fileName,
        originalName: file.name,
        size: file.size,
        type: file.type
      }
    })
  } catch (error) {
    console.error("[v0] Error uploading file:", error)
    return NextResponse.json({ success: false, error: "文件上传失败" }, { status: 500 })
  }
}