# AI对话持久化功能说明

## 概述

本系统实现了AI助手对话ID的自动持久化功能，支持通义千问API格式，能够自动保存和恢复对话上下文。

## 功能特性

### 1. 对话ID持久化

- **商家助手**：自动保存商家与AI助手的对话上下文
- **客户助手**：自动保存客户与AI助手的对话上下文
- **AI推荐**：自动保存AI推荐功能的对话上下文

每个用户的每种助手类型都有独立的对话ID，互不干扰。

### 2. 数据库表结构

```sql
CREATE TABLE ai_conversation_contexts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  assistant_type ENUM('admin', 'customer', 'suggestion') NOT NULL,
  conversation_id VARCHAR(255) NOT NULL,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_assistant (username, assistant_type)
);
```

### 3. API兼容性

系统兼容通义千问API格式，支持以下特性：

- 自动识别API返回的对话ID（`response.id`）
- 在后续请求中自动携带对话ID（`conversation_id`参数）
- 支持标准OpenAI格式和通义千问格式

### 4. 商家助手增强功能

商家助手现在支持以下操作：

#### 4.1 回复客户消息

**文本回复**：
```
【回复客户:customer123|类型:text|内容:您好，我们的产品质量很好】
```

**发送商品**：
```
【回复客户:customer123|类型:product|内容:1,2,3】
```
发送商品ID为1,2,3的商品信息给客户

**发送报价表**：
```
【回复客户:customer123|类型:quotation|内容:QT2024001】
```
发送报价单号为QT2024001的报价表给客户

#### 4.2 智能提示词

商家助手的提示词包含：
- 最近30个商品信息（包含库存状态）
- 最近10条未读客户消息
- 用户最近10条操作历史
- 根据用户以往记录提供个性化建议

### 5. 客户助手增强功能

客户助手的提示词包含：
- 最近50个可用商品信息
- 用户最近20条行为记录
- 根据用户以往行为提供个性化商品推荐

支持的操作：
- 查询商品信息
- 生成报价表
- 给商家留言

### 6. 配置说明

在 `.env.local` 文件中配置AI服务：

```env
# 通义千问API配置示例
AI_BASE_URL=https://qwenapi.zeabur.app
AI_API_KEY=your-tongyi-sso-ticket
AI_MODEL=qwen

# OpenAI API配置示例
AI_BASE_URL=https://api.openai.com
AI_API_KEY=your-openai-api-key
AI_MODEL=gpt-3.5-turbo
```

### 7. 使用方法

#### 7.1 商家助手

```typescript
// 前端调用
const response = await fetch('/api/ai/admin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    content: '帮我回复客户customer123，告诉他产品已经发货',
    conversation: chatMessages,
    config: {
      apiKey: 'your-api-key',
      baseUrl: 'https://qwenapi.zeabur.app',
      model: 'qwen'
    }
  })
})
```

#### 7.2 客户助手

```typescript
// 前端调用
const response = await fetch('/api/ai/customer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'customer123',
    content: '我想了解一下你们的蓝牙耳机',
    conversation: chatMessages,
    config: {
      apiKey: 'your-api-key',
      baseUrl: 'https://qwenapi.zeabur.app',
      model: 'qwen'
    }
  })
})
```

#### 7.3 AI推荐

```typescript
// 前端调用
const response = await fetch('/api/ai/suggest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'product_name',
    context: '高端蓝牙耳机',
    username: 'admin',
    config: {
      apiKey: 'your-api-key',
      baseUrl: 'https://qwenapi.zeabur.app',
      model: 'qwen'
    }
  })
})
```

### 8. 对话管理

#### 8.1 获取对话ID

```typescript
import { ConversationManager } from '@/lib/ai/conversation-manager'

const conversationId = await ConversationManager.getConversationId(
  'username',
  'admin' // 或 'customer' 或 'suggestion'
)
```

#### 8.2 保存对话ID

```typescript
await ConversationManager.saveConversationId(
  'username',
  'admin',
  'conversation-id-from-api'
)
```

#### 8.3 清除对话

```typescript
await ConversationManager.clearConversation('username', 'admin')
```

#### 8.4 清理过期对话

系统会自动清理7天未使用的对话上下文：

```typescript
const deletedCount = await ConversationManager.cleanupExpiredConversations()
```

### 9. 数据库初始化

运行以下SQL脚本初始化数据库：

```bash
mysql -u root -p warehouse_system < scripts/init-database.sql
```

或者只添加新表：

```sql
CREATE TABLE IF NOT EXISTS ai_conversation_contexts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  assistant_type ENUM('admin', 'customer', 'suggestion') NOT NULL,
  conversation_id VARCHAR(255) NOT NULL,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_assistant (username, assistant_type),
  INDEX idx_username (username),
  INDEX idx_assistant_type (assistant_type),
  INDEX idx_last_used_at (last_used_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 技术实现

### 核心模块

1. **AIClient** (`lib/ai/client.ts`)
   - 封装AI API调用
   - 支持对话ID参数
   - 自动处理API响应

2. **ConversationManager** (`lib/ai/conversation-manager.ts`)
   - 管理对话ID的存储和检索
   - 自动更新最后使用时间
   - 支持清理过期对话

3. **API路由**
   - `/api/ai/admin` - 商家助手
   - `/api/ai/customer` - 客户助手
   - `/api/ai/suggest` - AI推荐
   - `/api/chat/reply` - 回复客户

## 注意事项

1. 对话ID会在每次API调用后自动更新
2. 每个用户的每种助手类型有独立的对话上下文
3. 7天未使用的对话会被自动清理
4. 支持手动清除对话以开始新的对话
5. 如果API不支持对话ID，系统会自动回退到无状态模式

## 未来优化

- [ ] 添加对话历史查看功能
- [ ] 支持多轮对话的导出和导入
- [ ] 添加对话质量评分功能
- [ ] 支持对话分支管理
