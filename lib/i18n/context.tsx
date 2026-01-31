"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"

// 支持的语言
export type Language = "zh" | "en" | "ja" | "ko" | "fr" | "de" | "es" | "ru"

// 翻译内容类型
export type Translations = Record<string, string>

// i18n上下文类型
interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  isTranslating: boolean
}

// 创建上下文
const I18nContext = createContext<I18nContextType | undefined>(undefined)

// 翻译内容
const translations: Record<Language, Translations> = {
  zh: {
    // 通用
    "app.name": "仓库管理系统",
    "app.description": "基于Vue3的商品仓库入库管理系统",
    "loading": "加载中...",
    "error": "错误",
    "success": "成功",
    "cancel": "取消",
    "confirm": "确认",
    "save": "保存",
    "delete": "删除",
    "edit": "编辑",
    "create": "创建",
    "search": "搜索",
    "filter": "筛选",
    "export": "导出",
    "print": "打印",
    "close": "关闭",
    "back": "返回",
    "next": "下一步",
    "previous": "上一步",
    "submit": "提交",
    "reset": "重置",
    "refresh": "刷新",
    "more": "更多",
    "all": "全部",
    "none": "无",
    "select": "请选择",
    "required": "必填",
    "optional": "可选",
    
    // 导航
    "nav.dashboard": "数据看板",
    "nav.products": "商品管理",
    "nav.inbound": "入库管理",
    "nav.quotations": "报价管理",
    "nav.communications": "沟通日志",
    "nav.settings": "系统设置",
    "nav.login": "登录",
    "nav.logout": "退出",
    "nav.profile": "个人中心",
    
    // 首页
    "dashboard.title": "数据看板",
    "dashboard.todayInbound": "今日入库",
    "dashboard.monthInbound": "本月入库",
    "dashboard.totalProducts": "商品总数",
    "dashboard.lowStockAlert": "库存预警",
    "dashboard.recentInbound": "最近入库",
    "dashboard.viewAll": "查看全部",
    "dashboard.quickActions": "快捷功能",
    
    // 商品
    "product.name": "商品名称",
    "product.sku": "SKU",
    "product.category": "分类",
    "product.brand": "品牌",
    "product.model": "型号",
    "product.description": "描述",
    "product.price": "价格",
    "product.stock": "库存",
    "product.unit": "单位",
    "product.weight": "重量",
    "product.dimensions": "尺寸",
    "product.color": "颜色",
    "product.material": "材质",
    "product.status": "状态",
    "product.active": "启用",
    "product.inactive": "停用",
    "product.minStock": "最小库存",
    "product.image": "商品图片",
    "product.specifications": "规格参数",
    "product.inboundHistory": "入库历史",
    "product.quotation": "生成报价",
    
    // 入库
    "inbound.title": "商品入库",
    "inbound.batch": "批次号",
    "inbound.quantity": "入库数量",
    "inbound.unitPrice": "单价",
    "inbound.totalPrice": "总价",
    "inbound.supplier": "供应商",
    "inbound.location": "仓位",
    "inbound.date": "入库日期",
    "inbound.notes": "备注",
    "inbound.records": "入库记录",
    "inbound.searchProduct": "搜索商品",
    "inbound.enterQuantity": "请输入数量",
    "inbound.enterPrice": "请输入单价",
    
    // 报价
    "quotation.title": "报价管理",
    "quotation.create": "创建报价",
    "quotation.number": "报价单号",
    "quotation.customer": "客户",
    "quotation.customerName": "客户名称",
    "quotation.contact": "联系方式",
    "quotation.validUntil": "有效期至",
    "quotation.totalAmount": "总金额",
    "quotation.status": "状态",
    "quotation.items": "报价明细",
    "quotation.addItem": "添加商品",
    "quotation.quantity": "数量",
    "quotation.unitPrice": "单价",
    "quotation.suggestedPrice": "建议价格",
    "quotation.exportExcel": "导出Excel",
    "quotation.print": "打印报价单",
    "quotation.preview": "预览报价",
    
    // 沟通
    "communication.title": "沟通日志",
    "communication.client": "客户",
    "communication.message": "沟通内容",
    "communication.type": "类型",
    "communication.time": "时间",
    "communication.inbound": "来访",
    "communication.outbound": "回访",
    
    // 设置
    "settings.title": "系统设置",
    "settings.language": "语言设置",
    "settings.ai": "AI配置",
    "settings.apiKey": "API密钥",
    "settings.baseUrl": "Base URL",
    "settings.model": "模型",
    "settings.testConnection": "测试连接",
    "settings.save": "保存设置",
    
    // AI
    "ai.assistant": "AI助手",
    "ai.summary": "AI摘要",
    "ai.suggestion": "AI建议",
    "ai.generating": "生成中...",
    "ai.regenerate": "重新生成",
    "ai.placeholder": "请输入您的问题...",
    "ai.help": "输入"帮助"查看可用功能",
    
    // 用户
    "user.username": "用户名",
    "user.password": "密码",
    "user.role": "角色",
    "user.admin": "管理员",
    "user.customer": "客户",
    "user.email": "邮箱",
    "user.phone": "电话",
    "user.login": "登录",
    "user.register": "注册",
    "user.logout": "退出登录",
    "user.welcome": "欢迎",
    
    // 提示
    "tip.loading": "加载中，请稍候...",
    "tip.error": "操作失败，请重试",
    "tip.success": "操作成功",
    "tip.confirmDelete": "确认删除？",
    "tip.noData": "暂无数据",
    "tip.searchResult": "搜索结果",
    "tip.stockWarning": "库存不足",
  },
  en: {
    // General
    "app.name": "Warehouse Management System",
    "app.description": "Product Warehouse Inbound Management System based on Vue3",
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "search": "Search",
    "filter": "Filter",
    "export": "Export",
    "print": "Print",
    "close": "Close",
    "back": "Back",
    "next": "Next",
    "previous": "Previous",
    "submit": "Submit",
    "reset": "Reset",
    "refresh": "Refresh",
    "more": "More",
    "all": "All",
    "none": "None",
    "select": "Please select",
    "required": "Required",
    "optional": "Optional",
    
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.products": "Products",
    "nav.inbound": "Inbound",
    "nav.quotations": "Quotations",
    "nav.communications": "Communications",
    "nav.settings": "Settings",
    "nav.login": "Login",
    "nav.logout": "Logout",
    "nav.profile": "Profile",
    
    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.todayInbound": "Today's Inbound",
    "dashboard.monthInbound": "Monthly Inbound",
    "dashboard.totalProducts": "Total Products",
    "dashboard.lowStockAlert": "Low Stock Alert",
    "dashboard.recentInbound": "Recent Inbound",
    "dashboard.viewAll": "View All",
    "dashboard.quickActions": "Quick Actions",
    
    // Product
    "product.name": "Product Name",
    "product.sku": "SKU",
    "product.category": "Category",
    "product.brand": "Brand",
    "product.model": "Model",
    "product.description": "Description",
    "product.price": "Price",
    "product.stock": "Stock",
    "product.unit": "Unit",
    "product.weight": "Weight",
    "product.dimensions": "Dimensions",
    "product.color": "Color",
    "product.material": "Material",
    "product.status": "Status",
    "product.active": "Active",
    "product.inactive": "Inactive",
    "product.minStock": "Min Stock",
    "product.image": "Product Image",
    "product.specifications": "Specifications",
    "product.inboundHistory": "Inbound History",
    "product.quotation": "Generate Quotation",
    
    // Inbound
    "inbound.title": "Product Inbound",
    "inbound.batch": "Batch Number",
    "inbound.quantity": "Quantity",
    "inbound.unitPrice": "Unit Price",
    "inbound.totalPrice": "Total Price",
    "inbound.supplier": "Supplier",
    "inbound.location": "Location",
    "inbound.date": "Inbound Date",
    "inbound.notes": "Notes",
    "inbound.records": "Inbound Records",
    "inbound.searchProduct": "Search Product",
    "inbound.enterQuantity": "Enter quantity",
    "inbound.enterPrice": "Enter unit price",
    
    // Quotation
    "quotation.title": "Quotation Management",
    "quotation.create": "Create Quotation",
    "quotation.number": "Quotation No.",
    "quotation.customer": "Customer",
    "quotation.customerName": "Customer Name",
    "quotation.contact": "Contact",
    "quotation.validUntil": "Valid Until",
    "quotation.totalAmount": "Total Amount",
    "quotation.status": "Status",
    "quotation.items": "Items",
    "quotation.addItem": "Add Item",
    "quotation.quantity": "Quantity",
    "quotation.unitPrice": "Unit Price",
    "quotation.suggestedPrice": "Suggested Price",
    "quotation.exportExcel": "Export Excel",
    "quotation.print": "Print Quotation",
    "quotation.preview": "Preview",
    
    // Communication
    "communication.title": "Communication Log",
    "communication.client": "Client",
    "communication.message": "Message",
    "communication.type": "Type",
    "communication.time": "Time",
    "communication.inbound": "Inbound",
    "communication.outbound": "Outbound",
    
    // Settings
    "settings.title": "System Settings",
    "settings.language": "Language",
    "settings.ai": "AI Configuration",
    "settings.apiKey": "API Key",
    "settings.baseUrl": "Base URL",
    "settings.model": "Model",
    "settings.testConnection": "Test Connection",
    "settings.save": "Save Settings",
    
    // AI
    "ai.assistant": "AI Assistant",
    "ai.summary": "AI Summary",
    "ai.suggestion": "AI Suggestion",
    "ai.generating": "Generating...",
    "ai.regenerate": "Regenerate",
    "ai.placeholder": "Enter your question...",
    "ai.help": "Type 'help' for available commands",
    
    // User
    "user.username": "Username",
    "user.password": "Password",
    "user.role": "Role",
    "user.admin": "Admin",
    "user.customer": "Customer",
    "user.email": "Email",
    "user.phone": "Phone",
    "user.login": "Login",
    "user.register": "Register",
    "user.logout": "Logout",
    "user.welcome": "Welcome",
    
    // Tips
    "tip.loading": "Loading, please wait...",
    "tip.error": "Operation failed, please try again",
    "tip.success": "Operation successful",
    "tip.confirmDelete": "Confirm deletion?",
    "tip.noData": "No data",
    "tip.searchResult": "Search Results",
    "tip.stockWarning": "Low stock warning",
  },
  // 其他语言使用英文作为基础
  ja: {},
  ko: {},
  fr: {},
  de: {},
  es: {},
  ru: {},
}

// 填充其他语言（使用英文作为基础）
;(Object.keys(translations) as Language[]).forEach((lang) => {
  if (lang !== "zh" && lang !== "en") {
    translations[lang] = { ...translations.en }
  }
})

// i18n Provider组件
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("zh")
  const [isTranslating, setIsTranslating] = useState(false)

  // 从localStorage读取语言设置
  useEffect(() => {
    const savedLang = localStorage.getItem("language") as Language
    if (savedLang && translations[savedLang]) {
      setLanguageState(savedLang)
    }
  }, [])

  // 设置语言
  const setLanguage = useCallback((lang: Language) => {
    setIsTranslating(true)
    setLanguageState(lang)
    localStorage.setItem("language", lang)
    
    // 模拟翻译延迟
    setTimeout(() => {
      setIsTranslating(false)
    }, 300)
  }, [])

  // 翻译函数
  const t = useCallback(
    (key: string): string => {
      return translations[language][key] || translations["zh"][key] || key
    },
    [language]
  )

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, isTranslating }}>
      {children}
    </I18nContext.Provider>
  )
}

// 使用i18n的Hook
export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}
