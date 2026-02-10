import { NextResponse } from "next/server"
import { query } from "@/lib/db"

interface Product {
  id: number
  name: string
  code: string
  price: number
  category: string
}

// GET - 基于用户行为生成商品推荐
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get("username")

    if (!username) {
      return NextResponse.json({ success: false, error: "用户名不能为空" }, { status: 400 })
    }

    // 1. 获取用户最近查看的商品
    const viewedProducts = await query<any[]>(
      `SELECT product_id, COUNT(*) as view_count, MAX(behavior_time) as last_behavior_time
       FROM user_behaviors 
       WHERE username = ? AND behavior_type = 'view_product' AND product_id IS NOT NULL
       GROUP BY product_id 
       ORDER BY view_count DESC, last_behavior_time DESC 
       LIMIT 5`,
      [username]
    )

    // 2. 获取用户搜索关键词
    const searchKeywords = await query<any[]>(
      `SELECT search_keyword, COUNT(*) as search_count 
       FROM user_behaviors 
       WHERE username = ? AND behavior_type = 'search' AND search_keyword IS NOT NULL
       GROUP BY search_keyword 
       ORDER BY search_count DESC 
       LIMIT 5`,
      [username]
    )

    // 3. 基于查看历史推荐相似商品
    let recommendations: Product[] = []

    if (viewedProducts.length > 0) {
      const productIds = viewedProducts.map((p) => p.product_id)

      // 获取相同分类的其他商品
      const similarProducts = await query<Product[]>(
        `SELECT DISTINCT p.* FROM products p
         WHERE p.category IN (
           SELECT category FROM products WHERE id IN (${productIds.join(",")})
         )
         AND p.id NOT IN (${productIds.join(",")})
         LIMIT 10`
      )

      recommendations = similarProducts
    }

    // 4. 基于搜索关键词推荐商品
    if (searchKeywords.length > 0 && recommendations.length < 10) {
      const keywords = searchKeywords.map((k) => k.search_keyword)
      const keywordConditions = keywords.map(() => "p.name LIKE ?").join(" OR ")
      const keywordParams = keywords.map((k) => `%${k}%`)

      const keywordProducts = await query<Product[]>(
        `SELECT p.* FROM products p
         WHERE (${keywordConditions})
         LIMIT ${10 - recommendations.length}`,
        keywordParams
      )

      recommendations = [...recommendations, ...keywordProducts]
    }

    // 5. 如果还没有推荐，返回热门商品
    if (recommendations.length === 0) {
      recommendations = await query<Product[]>(
        `SELECT p.* FROM products p
         ORDER BY p.created_at DESC
         LIMIT 10`
      )
    }

    // 6. 生成推荐理由
    const suggestionsWithReasons = recommendations.map((product) => {
      let reason = "为您推荐"

      // 检查是否基于查看历史
      const viewedCategory = viewedProducts.length > 0
      if (viewedCategory) {
        reason = "基于您的浏览历史推荐"
      }

      // 检查是否匹配搜索关键词
      const matchedKeyword = searchKeywords.find((k) =>
        product.name.toLowerCase().includes(k.search_keyword.toLowerCase())
      )
      if (matchedKeyword) {
        reason = `与您搜索的"${matchedKeyword.search_keyword}"相关`
      }

      return {
        ...product,
        recommendation_reason: reason,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        recommendations: suggestionsWithReasons,
        user_insights: {
          most_viewed_products: viewedProducts.length,
          search_keywords: searchKeywords.map((k) => k.search_keyword),
          total_behaviors: viewedProducts.reduce((sum, p) => sum + p.view_count, 0),
        },
      },
    })
  } catch (error) {
    console.error("[Suggestions] Error generating suggestions:", error)
    return NextResponse.json({ success: false, error: "生成推荐失败" }, { status: 500 })
  }
}
