# 仓库管理系统 - 店家端

基于 Next.js 16 和 MySQL 的商品仓库入库管理系统，提供完整的商品管理、入库操作、报价表生成等功能。

## 🚀 功能特性

### 核心功能

- **📊 数据看板**: 实时显示今日入库、本月统计、库存预警等关键数据
- **📦 商品管理**: 查看商品列表、库存信息、价格统计
- **📥 入库操作**: 支持商品搜索、数量录入、单价设置、自动计算总价
- **📋 入库记录**: 查询历史入库记录，支持筛选和搜索
- **🔍 商品详情**: 查看商品详细信息、入库历史、价格分析
- **📄 报价表生成**: 支持多商品报价单创建、在线预览
- **📤 Excel导出**: 一键导出报价表为标准Excel文件
- **🖨️ 打印功能**: 支持直接打印报价单
- **🤖 AI助手**: 智能商品建议、文本摘要、商家助手
- **🌐 多语言**: 支持中英文切换（Microsoft Translator）
- **⚙️ 系统设置**: AI配置管理、语言切换

### 技术亮点

- ⚡ Next.js 16 App Router架构
- 🗄️ MySQL数据库持久化存储
- 🔒 TypeScript类型安全
- 📱 响应式设计，适配桌面和平板
- ✅ 实时数据验证和错误提示
- 🔢 自动批次号生成
- ⚠️ 库存预警系统
- 🤖 AI智能助手集成

## 🏁 快速开始

### 环境要求

- Node.js 18+
- MySQL 8.0+
- npm 或 pnpm

### 1. 安装依赖

```bash
npm install
# 或
pnpm install
```

### 2. 数据库配置

#### 创建MySQL数据库：

```sql
CREATE DATABASE warehouse_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 配置环境变量（在项目根目录创建 `.env.local` 文件）：

```env
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=warehouse_system

# AI配置（可选，用于AI助手功能）
AI_API_KEY=your_openai_api_key
AI_BASE_URL=https://api.openai.com
AI_MODEL=gpt-3.5-turbo
```

> 💡 提示：将 `your_mysql_password` 替换为你的MySQL root用户密码

### 3. 初始化数据库

系统提供了一个完整的数据库初始化脚本 `scripts/init-database.sql`，包含所有表结构、索引、视图、触发器和初始数据。

#### 方法一：使用MySQL命令行（推荐）
```bash
# 在命令行中执行（密码为123456，可根据实际情况修改）
mysql -u root -p123456 < scripts\init-database.sql

# 或者交互式输入密码
mysql -u root -p < scripts\init-database.sql
```

#### 方法二：使用MySQL命令行（先连接再执行）
```bash
# 连接到MySQL
mysql -u root -p

# 在MySQL命令行中执行
SOURCE scripts/init-database.sql;
```

#### 方法三：使用MySQL Workbench（图形界面）
1. 打开 MySQL Workbench
2. 连接到本地MySQL服务器
3. 点击 `File` -> `Open SQL Script`
4. 选择 `scripts/init-database.sql` 文件
5. 点击执行按钮（闪电图标）

#### 方法四：使用Node.js脚本（可选）
```bash
# 安装mysql2依赖（如果尚未安装）
npm install mysql2

# 运行初始化脚本
node scripts/init-database.js
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 查看应用。

### 5. 验证安装

打开浏览器访问 `http://localhost:3000`，如果看到登录页面，说明安装成功。

**默认登录账号：**
- 商家账号：admin / admin123
- 客户账号：customer / customer123

## 项目结构

```
├── app/
│   ├── api/                    # API路由
│   │   ├── ai/                 # AI助手API（摘要、建议、商家助手）
│   │   ├── auth/               # 用户认证API
│   │   ├── chat/               # 聊天消息API
│   │   ├── communications/     # 沟通日志API
│   │   ├── dashboard/          # 仪表盘统计API
│   │   ├── history/            # 用户历史API
│   │   ├── inbound/            # 入库记录API
│   │   ├── products/           # 商品管理API
│   │   └── quotations/         # 报价表导出API
│   ├── customer/               # 客户端页面
│   ├── products/               # 商品管理页面
│   ├── inbound/                # 入库管理页面
│   ├── quotations/             # 报价管理页面
│   ├── communications/         # 沟通日志页面
│   ├── admin/                  # 管理功能（聊天）
│   ├── settings/               # 系统设置页面
│   ├── login/                  # 登录页面
│   ├── register/               # 注册页面
│   ├── page.tsx                # 首页（数据看板）
│   ├── layout.tsx              # 全局布局
│   └── globals.css             # 全局样式
├── components/
│   ├── ui/                     # UI组件库（shadcn/ui）
│   ├── ai-selected-text-summary.tsx  # AI文本摘要组件
│   ├── ai-admin-assistant.tsx  # AI商家助手组件
│   ├── ai-customer-assistant.tsx     # AI客服助手组件
│   ├── settings-button.tsx     # 设置按钮组件
│   └── image-upload.tsx        # 图片上传组件
├── lib/
│   ├── ai.ts                   # AI服务封装
│   ├── auth.ts                 # 用户认证工具
│   ├── db.ts                   # 数据库连接
│   ├── i18n/                   # 国际化配置
│   │   ├── context.tsx         # i18n上下文
│   │   └── locales.ts          # 翻译文件
│   └── microsoft-translator.ts # 微软翻译API封装
├── scripts/                    # 数据库脚本
│   ├── 001_create_schema.sql   # 创建表结构
│   ├── 002_seed_data.sql       # 示例数据
│   ├── 003_add_communications.sql  # 沟通日志表
│   ├── 004_add_chat_messages.sql   # 聊天消息表
│   ├── 005_add_inbound_history.sql # 入库历史表
│   ├── 006_add_user_history.sql    # 用户历史表
│   ├── 007_update_products.sql     # 商品表更新
│   └── init_database.bat       # 数据库初始化批处理
├── public/                     # 静态资源
└── README.md
```

## 数据库设计

### 主要数据表

**users** - 用户表
- 用户认证（用户名、密码、角色）
- 支持商家（admin）和客户（customer）两种角色

**products** - 商品表
- 商品基本信息（名称、SKU、分类、描述、单位、价格）
- 商品属性（品牌、型号、颜色、材质、重量、尺寸）
- 商品图片和详细描述

**inventory_inbound** - 入库记录表
- 入库数量、单价、总价
- 批次号、供应商、仓位
- 入库日期和状态

**inventory_stock** - 库存表
- 当前库存数量
- 最小库存预警阈值
- 最后入库日期

**chat_messages** - 聊天消息表
- 用户与商家之间的实时聊天
- 消息已读状态

**communications** - 沟通日志表
- 记录客户沟通信息
- 跟进状态管理

**user_history** - 用户历史表
- 记录用户操作历史
- 便于追踪用户行为

## 使用指南

### 1. 系统设置

首次使用建议先配置AI助手：
1. 点击右上角设置按钮（齿轮图标）
2. 进入"系统设置"
3. 配置AI API参数：
   - API密钥：你的OpenAI API Key
   - Base URL：API基础地址（默认 https://api.openai.com）
   - 模型：gpt-3.5-turbo 或 gpt-4
4. 点击"测试连接"验证配置
5. 保存设置

### 2. 首页数据看板

- 查看今日入库数量和金额
- 查看本月入库统计
- 监控库存预警商品
- 查看7天入库趋势图
- 点击快捷功能按钮跳转到对应模块

### 3. 商品入库

1. 点击"商品入库"按钮
2. 搜索需要入库的商品（按名称或SKU）
3. 选择商品后，输入入库数量和单价
4. 系统自动计算总金额
5. 填写供应商、仓位等补充信息
6. 提交入库，系统自动生成批次号并更新库存

### 4. 查看入库记录

- 在入库记录页面可查看所有历史记录
- 支持按商品名称或批次号搜索
- 显示详细的入库信息和金额统计

### 5. 商品管理

- 浏览所有商品和库存状态
- 库存不足的商品会显示预警标识
- 点击商品卡片查看详细信息
- **商家可以编辑商品信息，客户只能查看**

### 6. 商品详情

- 查看商品基本信息和描述
- 查看当前库存和预警设置
- 查看参考价格
- 查看完整的入库历史记录
- 点击"生成报价表"创建报价单

### 7. 创建报价表

1. 从商品详情页点击"生成报价表"，或从报价管理新建
2. 填写客户名称和联系方式
3. 设置报价有效期
4. 调整商品数量和报价（建议价格为成本的120%）
5. 可添加多个商品到报价单
6. 填写备注信息（付款方式、交货时间等）
7. 点击"预览报价表"

### 8. 导出和打印报价表

- 在预览页面确认报价信息
- 点击"导出Excel"下载报价表文件
- 点击"打印"直接打印报价单
- Excel文件包含完整的格式和边框

### 9. AI助手功能

**AI文本摘要：**
- 在任意页面选中文本（至少10个字符）
- 点击出现的"AI摘要"按钮
- 查看生成的摘要，可重新生成或关闭

**AI商家助手（左下角）：**
- 点击气泡按钮打开聊天窗口
- 可以询问商品信息、库存情况
- 支持创建商品、编辑商品等快捷操作
- 输入"帮助"查看可用功能

**AI客服助手（客户端）：**
- 为客户提供智能问答服务
- 解答商品相关问题

### 10. 语言切换

- 点击右上角设置按钮
- 选择"English"或"中文"切换语言
- 使用Microsoft Translator实现整站翻译

## API接口说明

### 商品接口

- `GET /api/products` - 获取商品列表（支持关键词和分类筛选）
- `GET /api/products/[id]` - 获取商品详情（含库存）
- `PUT /api/products` - 更新商品信息
- `GET /api/products/[id]/inbound-history` - 获取商品入库历史

### 入库接口

- `GET /api/inbound` - 获取入库记录列表
- `POST /api/inbound` - 创建入库记录（自动更新库存）

### 用户认证接口

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/logout` - 用户登出

### AI助手接口

- `POST /api/ai/summary` - 生成文本摘要
- `POST /api/ai/suggest` - 获取AI建议
- `POST /api/ai/admin` - AI商家助手
- `GET/POST /api/ai/config` - 获取/测试AI配置

### 聊天接口

- `GET /api/chat/messages` - 获取聊天消息
- `POST /api/chat/messages` - 发送聊天消息
- `PUT /api/chat/messages/read` - 标记消息已读

### 统计接口

- `GET /api/dashboard/stats` - 获取仪表盘统计数据

### 报价表接口

- `POST /api/quotations/export` - 导出报价表为Excel

## 开发说明

### 数据验证

- 前端使用实时验证，确保必填项和格式正确
- 入库数量必须为正整数
- 单价必须为正数，支持两位小数
- SKU唯一性验证

### 价格计算

- 入库时自动计算总价：数量 × 单价
- 商品详情显示参考价格
- 报价表默认建议价格为成本的120%

### 批次号规则

格式：`BATCH-YYYYMMDD-XXXXXX`
- YYYYMMDD: 日期
- XXXXXX: 时间戳后6位

### 库存更新逻辑

- 入库成功后自动增加对应商品库存
- 使用 `INSERT ... ON DUPLICATE KEY UPDATE` 确保数据一致性
- 记录最后入库日期

### AI配置说明

系统支持动态AI配置：
- 环境变量配置作为默认值
- 用户可以在设置页面覆盖配置
- 配置存储在 localStorage 中
- 所有AI功能都支持传入自定义配置

## 性能优化

- 数据库索引优化（SKU、批次号、日期等字段）
- 路由懒加载
- 组件按需渲染
- 使用MySQL连接池

## 浏览器支持

- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

## 后续扩展建议

- 出库管理功能
- 库存盘点
- 供应商管理
- 多仓库支持
- 更细粒度的权限管理
- 数据报表导出
- 移动端APP

## 🛠️ 常见问题与解决方案

### 1. 数据库连接失败

**错误信息**: `Access denied for user 'root'@'localhost' (using password: NO)`

**解决方案**:
- 检查 `.env.local` 文件中的数据库配置是否正确
- 确保MySQL服务已启动
- 确认MySQL root用户密码正确
- 重启开发服务器使环境变量生效

### 2. 找不到商品或页面空白

**解决方案**:
- 确保已执行所有SQL脚本导入数据
- 检查数据库连接是否正常
- 查看浏览器控制台是否有错误信息

### 3. AI助手无法使用

**解决方案**:
- 在设置页面配置正确的AI API密钥
- 测试连接确保配置正确
- 检查网络连接是否正常
- 查看控制台是否有API错误信息

### 4. Excel导出失败

**解决方案**:
- 确保已安装 `exceljs` 依赖：`npm install exceljs`
- 检查文件写入权限

### 5. 批次号重复

**解决方案**:
- 批次号使用时间戳生成，正常情况下不会重复
- 如果出现重复，请检查系统时间设置

### 6. 环境变量不生效

**解决方案**:
- 重启开发服务器：先按 `Ctrl+C` 停止，然后重新运行 `npm run dev`
- 确保 `.env.local` 文件在项目根目录
- 检查环境变量名称拼写是否正确

### 7. MySQL命令找不到

**解决方案**:
- 使用MySQL的完整路径：`"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"`
- 或将MySQL bin目录添加到系统PATH环境变量

### 8. 数据导入错误

**常见错误**:
- `ERROR 1067 (42000)`: 无效的默认值
- `ERROR 1406 (22001)`: 数据太长
- `ERROR 1826 (HY000)`: 重复的外键约束

**解决方案**:
- 使用提供的SQL脚本文件，已修复这些问题
- 确保MySQL字符集设置为 `utf8mb4`
- 按顺序执行SQL脚本（001 -> 002 -> 003...）

### 9. 开发服务器启动失败

**解决方案**:
- 检查端口3000是否被占用：`netstat -ano | findstr :3000`
- 如果被占用，可以更改端口：`npm run dev -- -p 3001`
- 或终止占用端口的进程

### 10. 语言切换不生效

**解决方案**:
- 确保网络连接正常（Microsoft Translator需要联网）
- 刷新页面后重试
- 检查浏览器控制台是否有CORS错误

## 许可证

MIT

## 技术支持

如有问题或建议，欢迎提交Issue。
