import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { SettingsButton } from "@/components/settings-button"
import { TranslateInit } from "@/components/translate-init"
import "./globals.css"

export const metadata: Metadata = {
  title: "仓库管理系统 - 店家端",
  description: "基于Vue3的商品仓库入库管理系统",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh">
      <body className={`font-sans antialiased`}>
        {children}
        <SettingsButton />
        <TranslateInit />
        <Analytics />
      </body>
    </html>
  )
}
