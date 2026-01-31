"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Settings, Globe, Loader2 } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// 支持的语言列表
const languages = [
  { code: "chinese_simplified", name: "简体中文", flag: "🇨🇳" },
  { code: "chinese_traditional", name: "繁體中文", flag: "🇹🇼" },
  { code: "english", name: "English", flag: "🇺🇸" },
  { code: "japanese", name: "日本語", flag: "🇯🇵" },
  { code: "korean", name: "한국어", flag: "🇰🇷" },
  { code: "french", name: "Français", flag: "🇫🇷" },
  { code: "german", name: "Deutsch", flag: "🇩🇪" },
  { code: "spanish", name: "Español", flag: "🇪🇸" },
  { code: "russian", name: "Русский", flag: "🇷🇺" },
  { code: "italian", name: "Italiano", flag: "🇮🇹" },
  { code: "portuguese", name: "Português", flag: "🇵🇹" },
  { code: "arabic", name: "العربية", flag: "🇸🇦" },
  { code: "thai", name: "ไทย", flag: "🇹🇭" },
  { code: "vietnamese", name: "Tiếng Việt", flag: "🇻🇳" },
]

export function SettingsButton() {
  const [open, setOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState("chinese_simplified")
  const [isTranslating, setIsTranslating] = useState(false)

  // 从localStorage读取语言设置
  useEffect(() => {
    const savedLang = localStorage.getItem("translate_language")
    if (savedLang) {
      setCurrentLang(savedLang)
    }
  }, [])

  const handleLanguageChange = (langCode: string) => {
    if (langCode === currentLang) {
      setOpen(false)
      return
    }

    setIsTranslating(true)
    
    // @ts-ignore
    if (typeof window.translate !== "undefined") {
      // @ts-ignore
      translate.changeLanguage(langCode)
      setCurrentLang(langCode)
      localStorage.setItem("translate_language", langCode)
    }

    // 模拟翻译延迟
    setTimeout(() => {
      setIsTranslating(false)
      setOpen(false)
    }, 500)
  }

  const currentLanguage = languages.find(l => l.code === currentLang) || languages[0]

  return (
    <div className="fixed top-4 right-4 z-50">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full shadow-lg"
            disabled={isTranslating}
          >
            {isTranslating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Settings className="h-4 w-4" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="end">
          <div className="space-y-2">
            {/* 语言切换 */}
            <div className="px-2 py-1 text-sm font-medium text-muted-foreground">
              切换语言 / Language
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {languages.map((lang) => (
                <Button
                  key={lang.code}
                  variant={currentLang === lang.code ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleLanguageChange(lang.code)}
                  disabled={isTranslating}
                >
                  <span className="mr-2">{lang.flag}</span>
                  <span className="flex-1 text-left">{lang.name}</span>
                  {currentLang === lang.code && (
                    <span className="text-xs text-muted-foreground">✓</span>
                  )}
                </Button>
              ))}
            </div>
            
            <div className="border-t pt-2 mt-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground"
                onClick={() => {
                  window.location.href = "/settings"
                  setOpen(false)
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                系统设置
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
