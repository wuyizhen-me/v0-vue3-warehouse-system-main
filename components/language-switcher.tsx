"use client"

import { useState } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Globe, Check } from "lucide-react"

interface LanguageOption {
  value: 'zh' | 'en' | 'ja' | 'ko' | 'fr' | 'de' | 'es' | 'ru'
  label: string
  flag: string
}

const languages: LanguageOption[] = [
  { value: 'zh', label: '中文', flag: '🇨🇳' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'ja', label: '日本語', flag: '🇯🇵' },
  { value: 'ko', label: '한국어', flag: '🇰🇷' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'ru', label: 'Русский', flag: '🇷🇺' },
]

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  
  const currentLang = languages.find(lang => lang.value === language)
  
  const handleLanguageChange = (langValue: LanguageOption['value']) => {
    setLanguage(langValue)
    setIsOpen(false)
  }
  
  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="rounded-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Globe className="h-5 w-5" />
      </Button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-50 py-1">
            {languages.map(lang => (
              <button
                key={lang.value}
                onClick={() => handleLanguageChange(lang.value)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                  language === lang.value ? 'bg-primary/10 font-medium' : ''
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="flex-1">{lang.label}</span>
                {language === lang.value && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
