"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SettingsPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [mounted, setMounted] = useState(false)

  const [aiConfig, setAiConfig] = useState({
    apiKey: '',
    baseUrl: 'https://api.openai.com',
    model: 'gpt-3.5-turbo'
  })

  const [mysqlConfig, setMysqlConfig] = useState({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: '',
    database: 'warehouse'
  })

  // 只在客户端加载配置
  useEffect(() => {
    setMounted(true)
    
    // 加载AI配置
    const savedAiConfig = {
      apiKey: localStorage.getItem('ai_api_key') || '',
      baseUrl: localStorage.getItem('ai_base_url') || 'https://api.openai.com',
      model: localStorage.getItem('ai_model') || 'gpt-3.5-turbo'
    }
    setAiConfig(savedAiConfig)

    // 加载MySQL配置
    const savedMysqlConfig = {
      host: localStorage.getItem('mysql_host') || 'localhost',
      port: localStorage.getItem('mysql_port') || '3306',
      user: localStorage.getItem('mysql_user') || 'root',
      password: localStorage.getItem('mysql_password') || '',
      database: localStorage.getItem('mysql_database') || 'warehouse'
    }
    setMysqlConfig(savedMysqlConfig)
  }, [])

  const handleAiConfigChange = (field: string, value: string) => {
    setAiConfig(prev => ({ ...prev, [field]: value }))
  }

  const handleMysqlConfigChange = (field: string, value: string) => {
    setMysqlConfig(prev => ({ ...prev, [field]: value }))
  }

  const saveConfig = async () => {
    setSaving(true)
    setMessage(null)

    try {
      // 保存AI配置
      localStorage.setItem('ai_api_key', aiConfig.apiKey)
      localStorage.setItem('ai_base_url', aiConfig.baseUrl)
      localStorage.setItem('ai_model', aiConfig.model)

      // 保存MySQL配置
      localStorage.setItem('mysql_host', mysqlConfig.host)
      localStorage.setItem('mysql_port', mysqlConfig.port)
      localStorage.setItem('mysql_user', mysqlConfig.user)
      localStorage.setItem('mysql_password', mysqlConfig.password)
      localStorage.setItem('mysql_database', mysqlConfig.database)

      setMessage({ type: 'success', text: '配置保存成功！' })
    } catch (error) {
      console.error('保存配置失败:', error)
      setMessage({ type: 'error', text: '配置保存失败，请重试' })
    } finally {
      setSaving(false)
    }
  }

  const testMysqlConnection = async () => {
    setTesting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mysqlConfig),
      })

      const result = await response.json()
      
      if (result.success) {
        setMessage({ type: 'success', text: 'MySQL连接测试成功！' })
      } else {
        setMessage({ type: 'error', text: `连接测试失败：${result.error}` })
      }
    } catch (error) {
      console.error('连接测试失败:', error)
      setMessage({ type: 'error', text: '连接测试失败，请检查配置' })
    } finally {
      setTesting(false)
    }
  }

  const testAiConnection = async () => {
    setTesting(true)
    setMessage(null)

    try {
      // 测试AI服务是否可用，传递配置信息
      const response = await fetch('/api/ai/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: aiConfig.apiKey,
          baseUrl: aiConfig.baseUrl,
          model: aiConfig.model
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        setMessage({ type: 'success', text: 'AI连接测试成功！' })
      } else {
        setMessage({ type: 'error', text: `AI连接测试失败：${result.error}` })
      }
    } catch (error) {
      console.error('AI连接测试失败:', error)
      setMessage({ type: 'error', text: 'AI连接测试失败，请检查配置' })
    } finally {
      setTesting(false)
    }
  }

  // 防止水合错误
  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">系统设置</h1>
              <p className="text-sm text-muted-foreground">配置AI和数据库连接</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* 消息提示 */}
          {message && (
            <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* AI配置 */}
          <Card>
            <CardHeader>
              <CardTitle>AI配置</CardTitle>
              <CardDescription>配置AI服务的连接参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api_key">API密钥</Label>
                <Input
                  id="api_key"
                  type="password"
                  placeholder="请输入AI服务的API密钥"
                  value={aiConfig.apiKey}
                  onChange={(e) => handleAiConfigChange('apiKey', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="base_url">Base URL</Label>
                <Input
                  id="base_url"
                  placeholder="请输入API基础地址"
                  value={aiConfig.baseUrl}
                  onChange={(e) => handleAiConfigChange('baseUrl', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">模型名称</Label>
                <Input
                  id="model"
                  placeholder="请输入模型名称"
                  value={aiConfig.model}
                  onChange={(e) => handleAiConfigChange('model', e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={testAiConnection} disabled={testing} variant="outline">
                  {testing ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4 animate-spin" />
                      测试中...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      测试连接
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* MySQL配置 */}
          <Card>
            <CardHeader>
              <CardTitle>MySQL数据库配置</CardTitle>
              <CardDescription>配置数据库连接参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="host">主机地址</Label>
                  <Input
                    id="host"
                    placeholder="localhost"
                    value={mysqlConfig.host}
                    onChange={(e) => handleMysqlConfigChange('host', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="port">端口</Label>
                  <Input
                    id="port"
                    placeholder="3306"
                    value={mysqlConfig.port}
                    onChange={(e) => handleMysqlConfigChange('port', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user">用户名</Label>
                <Input
                  id="user"
                  placeholder="请输入数据库用户名"
                  value={mysqlConfig.user}
                  onChange={(e) => handleMysqlConfigChange('user', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入数据库密码"
                  value={mysqlConfig.password}
                  onChange={(e) => handleMysqlConfigChange('password', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="database">数据库名称</Label>
                <Input
                  id="database"
                  placeholder="请输入数据库名称"
                  value={mysqlConfig.database}
                  onChange={(e) => handleMysqlConfigChange('database', e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={testMysqlConnection} disabled={testing} variant="outline">
                  {testing ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4 animate-spin" />
                      测试中...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      测试连接
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 保存按钮 */}
          <div className="flex justify-end">
            <Button onClick={saveConfig} disabled={saving}>
              {saving ? (
                <>
                  <Save className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  保存配置
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
