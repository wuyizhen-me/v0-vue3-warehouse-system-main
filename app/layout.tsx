import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { SettingsButton } from "@/components/settings-button"
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
      <head>
        {/* translate.js 翻译库 - 放在头部 */}
        <script src="https://cdn.staticfile.net/translate.js/3.18.66/translate.js"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // 设置本地语种
              translate.language.setLocal('chinese_simplified');
              
              // 设置翻译服务通道
              translate.service.use('client.edge');
              
              // 开启页面元素动态监控
              translate.listener.start();
              
              // 设置支持的语言列表
              translate.selectLanguageTag.languages = 'chinese_simplified,chinese_traditional,english,japanese,korean,french,german,spanish,russian';
              
              // 自定义语言切换UI - 使用国旗图标
              translate.selectLanguageTag.customUI = function(languageList){
                // 创建语言切换容器
                var container = document.createElement("div");
                container.className = "translate-language-switcher";
                container.style.cssText = "position:fixed;top:16px;right:80px;z-index:9999;display:flex;gap:8px;background:#fff;padding:6px 12px;border-radius:20px;box-shadow:0 2px 8px rgba(0,0,0,0.1);";
                
                // 语言图标映射
                var flagMap = {
                  'chinese_simplified': '🇨🇳',
                  'chinese_traditional': '🇹🇼',
                  'english': '🇺🇸',
                  'japanese': '🇯🇵',
                  'korean': '🇰🇷',
                  'french': '🇫🇷',
                  'german': '🇩🇪',
                  'spanish': '🇪🇸',
                  'russian': '🇷🇺'
                };
                
                // 语言名称映射
                var nameMap = {
                  'chinese_simplified': '中文',
                  'chinese_traditional': '繁体',
                  'english': 'EN',
                  'japanese': 'JP',
                  'korean': 'KR',
                  'french': 'FR',
                  'german': 'DE',
                  'spanish': 'ES',
                  'russian': 'RU'
                };
                
                // 创建下拉选择器
                var select = document.createElement("select");
                select.style.cssText = "border:none;background:transparent;font-size:14px;cursor:pointer;outline:none;padding:2px 4px;";
                
                // 添加选项
                for(var i = 0; i < languageList.length; i++){
                  var lang = languageList[i];
                  if(translate.selectLanguageTag.languages.indexOf(lang.id) < 0) continue;
                  
                  var option = document.createElement("option");
                  option.value = lang.id;
                  option.text = (flagMap[lang.id] || '🌐') + ' ' + (nameMap[lang.id] || lang.name);
                  
                  // 设置默认选中
                  if(lang.id === 'chinese_simplified'){
                    option.selected = true;
                  }
                  
                  select.appendChild(option);
                }
                
                // 切换语言事件
                select.onchange = function(e){
                  translate.changeLanguage(e.target.value);
                  // 保存语言选择到localStorage
                  localStorage.setItem('translate_language', e.target.value);
                };
                
                container.appendChild(select);
                
                // 将语言切换器插入到页面
                document.body.appendChild(container);
              };
              
              // 执行翻译初始化
              translate.execute();
              
              // 页面加载完成后，恢复上次选择的语言
              window.addEventListener('load', function(){
                var savedLang = localStorage.getItem('translate_language');
                if(savedLang && savedLang !== 'chinese_simplified'){
                  setTimeout(function(){
                    translate.changeLanguage(savedLang);
                  }, 100);
                }
              });
            `,
          }}
        />
      </head>
      <body className={`font-sans antialiased`}>
        {children}
        <SettingsButton />
        <Analytics />
      </body>
    </html>
  )
}
