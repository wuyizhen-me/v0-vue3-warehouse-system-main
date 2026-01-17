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

### 技术亮点

- ⚡ Next.js 16 App Router架构
- 🗄️ MySQL数据库持久化存储
- 🔒 TypeScript类型安全
- 📱 响应式设计，适配桌面和平板
- ✅ 实时数据验证和错误提示
- 🔢 自动批次号生成
- ⚠️ 库存预警系统

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
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=warehouse_system
```

> 💡 提示：将 `your_mysql_password` 替换为你的MySQL root用户密码

### 3. 初始化数据库

系统提供了完整的数据库初始化脚本：

#### 方法一：使用批处理文件（推荐）
```bash
# 运行批处理文件自动执行所有SQL脚本
scripts\mysql_command.bat
```

#### 方法二：手动执行SQL文件
```bash
# 在MySQL中依次执行以下脚本
mysql -u root -p warehouse_system < scripts\complete_database_schema.sql
```

#### 方法三：使用MySQL命令行
```bash
# 连接到MySQL并执行SQL文件
mysql -u root -p -e "SOURCE scripts/complete_database_schema.sql" warehouse_system
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 查看应用。

### 5. 验证安装

打开浏览器访问 `http://localhost:3000`，如果看到数据看板页面，说明安装成功。

## 项目结构

```
├── app/
│   ├── api/                    # API路由
│   │   ├── dashboard/          # 仪表盘统计API
│   │   ├── inbound/            # 入库记录API
│   │   ├── products/           # 商品管理API
│   │   └── quotations/         # 报价表导出API
│   ├── inbound/                # 入库管理页面
│   │   ├── page.tsx            # 入库表单
│   │   └── records/            # 入库记录
│   ├── products/               # 商品管理页面
│   │   ├── page.tsx            # 商品列表
│   │   └── [id]/               # 商品详情
│   ├── quotations/             # 报价管理页面
│   │   ├── create/             # 创建报价表
│   │   └── preview/            # 预览和导出
│   ├── page.tsx                # 首页（数据看板）
│   ├── layout.tsx              # 全局布局
│   └── globals.css             # 全局样式
├── components/
│   └── ui/                     # UI组件库
├── lib/
│   └── db.ts                   # 数据库连接和类型定义
├── scripts/
│   ├── 001_create_schema.sql  # 数据库表结构
│   └── 002_seed_data.sql      # 示例数据
└── README.md
```

## 数据库设计

### 主要数据表

**products** - 商品表
- 商品基本信息（名称、SKU、分类、描述、单位）
- 支持按SKU和分类查询

**inventory_inbound** - 入库记录表
- 入库数量、单价、总价
- 批次号、供应商、仓位
- 入库日期和状态

**inventory_stock** - 库存表
- 当前库存数量
- 最小库存预警阈值
- 最后入库日期

## 使用指南

### 1. 首页数据看板

- 查看今日入库数量和金额
- 查看本月入库统计
- 监控库存预警商品
- 查看7天入库趋势图
- 点击快捷功能按钮跳转到对应模块

### 2. 商品入库

1. 点击"商品入库"按钮
2. 搜索需要入库的商品（按名称或SKU）
3. 选择商品后，输入入库数量和单价
4. 系统自动计算总金额
5. 填写供应商、仓位等补充信息
6. 提交入库，系统自动生成批次号并更新库存

### 3. 查看入库记录

- 在入库记录页面可查看所有历史记录
- 支持按商品名称或批次号搜索
- 显示详细的入库信息和金额统计

### 4. 商品管理

- 浏览所有商品和库存状态
- 库存不足的商品会显示预警标识
- 点击商品卡片查看详细信息

### 5. 商品详情

- 查看商品基本信息和描述
- 查看当前库存和预警设置
- 查看价格统计（平均价、最高价、最低价）
- 查看完整的入库历史记录
- 点击"生成报价表"创建报价单

### 6. 创建报价表

1. 从商品详情页点击"生成报价表"，或从报价管理新建
2. 填写客户名称和联系方式
3. 设置报价有效期
4. 调整商品数量和报价（建议价格为成本的120%）
5. 可添加多个商品到报价单
6. 填写备注信息（付款方式、交货时间等）
7. 点击"预览报价表"

### 7. 导出和打印报价表

- 在预览页面确认报价信息
- 点击"导出Excel"下载报价表文件
- 点击"打印"直接打印报价单
- Excel文件包含完整的格式和边框

## API接口说明

### 商品接口

- `GET /api/products` - 获取商品列表（支持关键词和分类筛选）
- `GET /api/products/[id]` - 获取商品详情（含库存）
- `GET /api/products/[id]/inbound-history` - 获取商品入库历史

### 入库接口

- `GET /api/inbound` - 获取入库记录列表
- `POST /api/inbound` - 创建入库记录（自动更新库存）

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
- 商品详情显示平均入库价
- 报价表默认建议价格为成本的120%

### 批次号规则

格式：`BATCH-YYYYMMDD-XXXXXX`
- YYYYMMDD: 日期
- XXXXXX: 时间戳后6位

### 库存更新逻辑

- 入库成功后自动增加对应商品库存
- 使用 `INSERT ... ON DUPLICATE KEY UPDATE` 确保数据一致性
- 记录最后入库日期

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
- 权限管理系统
- 数据报表导出
- 移动端适配

## 🛠️ 常见问题与解决方案

### 1. 数据库连接失败

**错误信息**: `Access denied for user 'root'@'localhost' (using password: NO)`

**解决方案**:
- 检查 `.env.local` 文件中的数据库配置是否正确
- 确保MySQL服务已启动
- 确认MySQL root用户密码正确
- 重启开发服务器使环境变量生效

### 2. 找不到商品

**解决方案**:
- 确保已执行 `complete_database_schema.sql` 导入示例数据
- 或手动在数据库中添加商品数据
- 检查数据库连接是否正常

### 3. Excel导出失败

**解决方案**:
- 确保已安装 `exceljs` 依赖：`npm install exceljs`
- 检查文件写入权限

### 4. 批次号重复

**解决方案**:
- 批次号使用时间戳生成，正常情况下不会重复
- 如果出现重复，请检查系统时间设置

### 5. 环境变量不生效

**解决方案**:
- 重启开发服务器：先按 `Ctrl+C` 停止，然后重新运行 `npm run dev`
- 确保 `.env.local` 文件在项目根目录
- 检查环境变量名称拼写是否正确

### 6. MySQL命令找不到

**解决方案**:
- 使用MySQL的完整路径：`"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"`
- 或将MySQL bin目录添加到系统PATH环境变量

### 7. 数据导入错误

**常见错误**:
- `ERROR 1067 (42000)`: 无效的默认值
- `ERROR 1406 (22001)`: 数据太长
- `ERROR 1826 (HY000)`: 重复的外键约束

**解决方案**:
- 使用提供的 `complete_database_schema.sql` 文件，已修复这些问题
- 确保MySQL字符集设置为 `utf8mb4`

### 8. 开发服务器启动失败

**解决方案**:
- 检查端口3000是否被占用：`netstat -ano | findstr :3000`
- 如果被占用，可以更改端口：`npm run dev -- -p 3001`
- 或终止占用端口的进程

## 许可证

MIT

## 技术支持

如有问题或建议，欢迎提交Issue。
