"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Settings, Globe, Check } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const languages = [
  { label: "简体中文", value: "chinese_simplified", flag: "🇨🇳" },
  { label: "English", value: "english", flag: "🇺🇸" },
  { label: "日本語", value: "japanese", flag: "🇯🇵" },
  { label: "한국어", value: "korean", flag: "🇰🇷" },
  { label: "Français", value: "french", flag: "🇫🇷" },
  { label: "Deutsch", value: "german", flag: "🇩🇪" },
  { label: "Español", value: "spanish", flag: "🇪🇸" },
  { label: "Русский", value: "russian", flag: "🇷🇺" },
]

export function SettingsButton() {
  const [open, setOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState("chinese_simplified")
  const [translate, setTranslate] = useState<any>(null)

  useEffect(() => {
    // 动态导入 translate-react
    import("i18n-jsautotranslate").then((module) => {
      setTranslate(module.default || module)
    })
    
    // 读取保存的语言设置
    const savedLang = localStorage.getItem("translate_language")
    if (savedLang) {
      setCurrentLang(savedLang)
    }
  }, [])

  const handleLanguageChange = (langValue: string) => {
    if (translate) {
      translate.changeLanguage(langValue)
      setCurrentLang(langValue)
      localStorage.setItem("translate_language", langValue)
    }
    setOpen(false)
  }

  const currentLanguage = languages.find(l => l.value === currentLang)

  return (
    <div className="fixed top-4 right-4 z-50">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full shadow-lg"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="end">
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">
              语言设置 / Language
            </div>
            
            {/* 语言选择列表 */}
            <div className="space-y-1">
              {languages.map((language) => (
                <Button
                  key={language.value}
                  variant={currentLang === language.value ? "secondary" : "ghost"}
                  className="w-full justify-start text-sm"
                  onClick={() => handleLanguageChange(language.value)}
                >
                  <span className="mr-2">{language.flag}</span>
                  <span className="flex-1 text-left">{language.label}</span>
                  {currentLang === language.value && (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
              ))}
            </div>
            
            <div className="border-t pt-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-sm"
                onClick={() => {
                  window.location.href = "/settings"
                  setOpen(false)
                }}
              >
                系统设置
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
