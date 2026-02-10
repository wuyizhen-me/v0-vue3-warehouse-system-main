import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// 默认用户ID（用于未登录用户）
const DEFAULT_USER_ID = 1;

// GET - 获取购物车列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id") || DEFAULT_USER_ID

    const sql = `
      SELECT 
        c.user_id,
        c.product_id,
        c.quantity,
        c.unit_price,
        c.notes,
        c.created_at,
        c.updated_at,
        p.name as product_name,
        p.category as product_category,
        p.unit as product_unit,
        p.image_url as product_image_url,
        p.price as product_price,
        COALESCE(c.unit_price, p.price, 0) as final_price,
        (c.quantity * COALESCE(c.unit_price, p.price, 0)) as total_price
      FROM shopping_cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `

    const cartItems = await query(sql, [userId])

    // 计算购物车总价
    const totalAmount = (cartItems as any[]).reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0)
    const totalCount = (cartItems as any[]).reduce((sum, item) => sum + item.quantity, 0)

    return NextResponse.json({
      success: true,
      data: {
        items: cartItems,
        summary: {
          totalCount,
          totalAmount: parseFloat(totalAmount.toFixed(2))
        }
      }
    })
  } catch (error) {
    console.error("[v0] Error fetching cart:", error)
    return NextResponse.json(
      { success: false, error: "获取购物车失败" },
      { status: 500 }
    )
  }
}

// POST - 添加商品到购物车（通过product_id）
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { product_id, quantity = 1, unit_price, notes, user_id } = body
    const userId = user_id || DEFAULT_USER_ID

    if (!product_id) {
      return NextResponse.json(
        { success: false, error: "商品ID不能为空" },
        { status: 400 }
      )
    }

    if (quantity < 1) {
      return NextResponse.json(
        { success: false, error: "数量必须大于0" },
        { status: 400 }
      )
    }

    // 检查商品是否存在
    const productCheck = await query(
      "SELECT id, price FROM products WHERE id = ?",
      [product_id]
    )

    if ((productCheck as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: "商品不存在" },
        { status: 404 }
      )
    }

    const product = (productCheck as any[])[0]

    // 检查购物车中是否已有该商品
    const existingCheck = await query(
      "SELECT id, quantity FROM shopping_cart WHERE user_id = ? AND product_id = ?",
      [userId, product_id]
    )

    if ((existingCheck as any[]).length > 0) {
      // 更新数量
      const existing = (existingCheck as any[])[0]
      const newQuantity = existing.quantity + quantity

      await query(
        `UPDATE shopping_cart SET quantity = ?, updated_at = NOW() WHERE id = ?`,
        [newQuantity, existing.id]
      )

      return NextResponse.json({
        success: true,
        message: "购物车商品数量已更新",
        data: { 
          product_id: product.id,
          quantity: newQuantity 
        }
      })
    }

    // 插入新记录
    const finalPrice = unit_price || product.price || 0
    const result: any = await query(
      `INSERT INTO shopping_cart (user_id, product_id, quantity, unit_price, notes) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, product_id, quantity, finalPrice, notes || null]
    )

    return NextResponse.json({
      success: true,
      message: "商品已添加到购物车",
      data: { 
        product_id: product.id
      }
    })
  } catch (error) {
    console.error("[v0] Error adding to cart:", error)
    return NextResponse.json(
      { success: false, error: "添加到购物车失败" },
      { status: 500 }
    )
  }
}

// PUT - 更新购物车商品数量（通过product_id）
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { product_id, quantity, notes, user_id } = body
    const userId = user_id || DEFAULT_USER_ID

    if (!product_id) {
      return NextResponse.json(
        { success: false, error: "商品ID不能为空" },
        { status: 400 }
      )
    }

    if (quantity !== undefined && quantity < 1) {
      return NextResponse.json(
        { success: false, error: "数量必须大于0" },
        { status: 400 }
      )
    }

    // 检查购物车记录是否存在且属于当前用户
    const cartCheck = await query(
      `SELECT c.id, c.product_id
       FROM shopping_cart c
       WHERE c.product_id = ? AND c.user_id = ?`,
      [product_id, userId]
    )

    if ((cartCheck as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: "购物车记录不存在" },
        { status: 404 }
      )
    }

    const cartItem = (cartCheck as any[])[0]

    // 构建更新语句
    const updates: string[] = []
    const params: any[] = []

    if (quantity !== undefined) {
      updates.push("quantity = ?")
      params.push(quantity)
    }

    if (notes !== undefined) {
      updates.push("notes = ?")
      params.push(notes)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "没有要更新的字段" },
        { status: 400 }
      )
    }

    params.push(cartItem.id)

    await query(
      `UPDATE shopping_cart SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ?`,
      params
    )

    return NextResponse.json({
      success: true,
      message: "购物车已更新",
      data: { product_id }
    })
  } catch (error) {
    console.error("[v0] Error updating cart:", error)
    return NextResponse.json(
      { success: false, error: "更新购物车失败" },
      { status: 500 }
    )
  }
}

// DELETE - 清空购物车或删除指定商品（通过product_id）
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const product_id = searchParams.get("product_id")
    const userId = searchParams.get("user_id") || DEFAULT_USER_ID

    if (product_id) {
      // 删除指定商品
      const result: any = await query(
        "DELETE FROM shopping_cart WHERE product_id = ? AND user_id = ?",
        [product_id, userId]
      )

      if (result.affectedRows === 0) {
        return NextResponse.json(
          { success: false, error: "购物车记录不存在" },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        message: "商品已从购物车移除",
        data: { product_id }
      })
    } else {
      // 清空购物车
      await query(
        "DELETE FROM shopping_cart WHERE user_id = ?",
        [userId]
      )

      return NextResponse.json({
        success: true,
        message: "购物车已清空"
      })
    }
  } catch (error) {
    console.error("[v0] Error deleting from cart:", error)
    return NextResponse.json(
      { success: false, error: "删除购物车商品失败" },
      { status: 500 }
    )
  }
}
