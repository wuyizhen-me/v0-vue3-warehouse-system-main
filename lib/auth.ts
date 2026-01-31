// 认证工具函数
export interface User {
  id: number
  username: string
  role: "admin" | "customer"
  email?: string
  phone?: string
}

// 明文密码验证（开发环境使用）
export function verifyPassword(password: string, storedPassword: string): boolean {
  return password === storedPassword
}

// 客户端会话管理
export function setUserSession(user: User) {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user))
  }
}

export function getUserSession(): User | null {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user")
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch {
        return null
      }
    }
  }
  return null
}

export function clearUserSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user")
  }
}

export function isAdmin(user: User | null): boolean {
  return user?.role === "admin"
}

export function isCustomer(user: User | null): boolean {
  return user?.role === "customer"
}
