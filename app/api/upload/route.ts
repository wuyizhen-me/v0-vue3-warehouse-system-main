import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
  const file = formData.get("file") as File
  const typeValue = formData.get("type")
  const type = (typeValue as string) || "product" // product, chat, document
    
    if (!file) {
      return NextResponse.json({ success: false, error: "请选择文件" }, { status: 400 })
    }
    
    console.log("[Upload] File info:", { name: file.name, type: file.type, size: file.size, uploadType: type })

    // 根据类型验证文件
    let allowedTypes: string[] = []
    let maxSize = 5 * 1024 * 1024 // 默认5MB
    let uploadSubDir = "products"

    if (type === "chat") {
      // 聊天图片
      allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
      maxSize = 10 * 1024 * 1024 // 10MB
      uploadSubDir = "chat"
    } else if (type === "document") {
      // 文档文件（包括 Excel）
      allowedTypes = [
        "application/pdf",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/csv",
      ]
      maxSize = 20 * 1024 * 1024 // 20MB
      uploadSubDir = "documents"
    } else {
      // 商品图片
      allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
      maxSize = 5 * 1024 * 1024 // 5MB
      uploadSubDir = "products"
    }

    // 检查文件类型，如果是document类型，也检查文件扩展名
    console.log("[Upload] Validation - allowedTypes:", allowedTypes, "file.type:", file.type, "uploadType:", type)
    
    // 对所有类型都添加扩展名检查，确保更宽松的验证
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    const isDocument = type === "document";
    const isChat = type === "chat";
    const isProduct = type === "product";
    
    // 允许的扩展名
    const allowedExtensions = {
      document: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".csv", ".xml", ".json"],
      chat: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
      product: [".jpg", ".jpeg", ".png", ".gif", ".webp"]
    };
    
    // 检查文件是否被允许
    const isAllowed = 
      allowedTypes.includes(file.type) || 
      allowedExtensions[type as keyof typeof allowedExtensions]?.includes(fileExtension || "");
    
    if (!isAllowed) {
      console.log("[Upload] Validation failed - file rejected")
      return NextResponse.json({ success: false, error: "不支持的文件类型" }, { status: 400 });
    }
    
    console.log("[Upload] Validation passed")

    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: `文件大小不能超过${maxSize / 1024 / 1024}MB` }, { status: 400 })
    }

    // 创建上传目录
    const uploadDir = join(process.cwd(), "public", "uploads", uploadSubDir)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // 生成唯一文件名
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split(".").pop()
    const fileName = `${type}_${timestamp}_${randomStr}.${extension}`
    const filePath = join(uploadDir, fileName)

    // 保存文件
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // 返回文件URL
    const fileUrl = `/uploads/${uploadSubDir}/${fileName}`

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
    console.error("[Upload] Error uploading file:", error)
    return NextResponse.json({ success: false, error: "文件上传失败" }, { status: 500 })
  }
}