import { NextResponse } from "next/server"
import { query } from "@/lib/db"

interface ImportProduct {
  name: string
  sku: string
  unit?: string
  category?: string
  description?: string
  price?: number
  brand?: string
  model?: string
  weight?: number
  dimensions?: string
  color?: string
  material?: string
}

// POST - 批量导入商品
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { products } = body as { products: ImportProduct[] }
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "请提供商品列表" 
      }, { status: 400 })
    }

    const results = []
    let successCount = 0
    let errorCount = 0

    for (const product of products) {
      try {
        // 验证必填字段
        if (!product.name || !product.sku) {
          results.push({
            sku: product.sku,
            name: product.name,
            success: false,
            error: "商品名称和SKU编码是必填项"
          })
          errorCount++
          continue
        }

        // 检查SKU是否已存在
        const checkSql = "SELECT id FROM products WHERE sku = ?"
        const existingProducts = await query<{ id: number }[]>(checkSql, [product.sku])

        if (existingProducts.length > 0) {
          results.push({
            sku: product.sku,
            name: product.name,
            success: false,
            error: "SKU编码已存在"
          })
          errorCount++
          continue
        }

        // 生成自动SKU（如果没有提供）
        let finalSku = product.sku
        if (!finalSku) {
          finalSku = `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
        }

        // 插入商品
        const insertSql = `
          INSERT INTO products (
            name, sku, category, description, unit, brand, model, weight, dimensions, color, material, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `
        
        await query(insertSql, [
          product.name,
          finalSku,
          product.category || null,
          product.description || null,
          product.unit || '件',
          product.brand || null,
          product.model || null,
          product.weight || null,
          product.dimensions || null,
          product.color || null,
          product.material || null
        ])

        results.push({
          sku: finalSku,
          name: product.name,
          success: true,
          error: null
        })
        successCount++

      } catch (error) {
        console.error(`[v0] 商品导入失败: ${product.sku}`, error)
        results.push({
          sku: product.sku,
          name: product.name,
          success: false,
          error: "数据库操作失败"
        })
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
        successCount,
        errorCount,
        totalCount: products.length
      }
    })

  } catch (error) {
    console.error("[v0] 商品批量导入错误:", error)
    return NextResponse.json({ 
      success: false, 
      error: "商品批量导入失败" 
    }, { status: 500 })
  }
}