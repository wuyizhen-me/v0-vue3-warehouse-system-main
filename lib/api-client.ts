// API 客户端辅助函数
import { getUserSession } from "./auth"

// 封装 fetch，自动添加用户信息到请求头
export async function apiFetch(url: string, options: RequestInit = {}) {
  const user = getUserSession()
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {})
  }
  
  // 如果用户已登录，添加用户信息到请求头
  if (user) {
    headers["x-user-info"] = JSON.stringify(user)
  }
  
  return fetch(url, {
    ...options,
    headers
  })
}
