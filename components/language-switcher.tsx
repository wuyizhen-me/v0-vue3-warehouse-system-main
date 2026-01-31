"use client"

import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface LanguageOption {
  value: 'zh' | 'en'
  label: string
  flag: string
}

const languages: LanguageOption[] = [
  { value: 'zh', label: '中文', flag: '🇨🇳' },
  { value: 'en', label: 'English', flag: '🇬🇧' }
]

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n()
  
  const currentLang = languages.find(lang => lang.value === language)
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map(lang => (
          <DropdownMenuItem
            key={lang.value}
            onClick={() => setLanguage(lang.value)}
            className={`flex items-center gap-2 cursor-pointer ${language === lang.value ? 'bg-primary/10 font-medium' : ''}`}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
            {language === lang.value && (
              <span className="ml-auto">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
