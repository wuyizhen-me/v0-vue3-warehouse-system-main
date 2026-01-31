"use client"

import { useEffect } from "react"

export function TranslateInit() {
  useEffect(() => {
    // 动态导入翻译库
    import("i18n-jsautotranslate").then((module) => {
      const translate = module.default || module
      
      // 初始化翻译
      translate.language.setLocal("chinese_simplified")
      translate.service.use("client.edge")
      translate.listener.start()
      
      // 执行翻译
      translate.execute()
      
      // 恢复上次选择的语言
      const savedLang = localStorage.getItem("translate_language")
      if (savedLang && savedLang !== "chinese_simplified") {
        setTimeout(() => {
          translate.changeLanguage(savedLang)
        }, 100)
      }
    })
  }, [])

  return null
}
