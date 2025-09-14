# 通过 Git 源码安装 NocoBase

本文档将指导您通过 Git 克隆源码的方式安装 NocoBase。

## 0. 环境准备

在开始安装之前，请确保您的系统满足以下要求：

- **Node.js**: 版本 18.x 或更高
- **数据库**: MySQL 8+
- **Git**: 版本 2.x 或更高
- **yarn**: 推荐使用 yarn 作为包管理器

## 1. 通过 Git 下载源码

```bash
git clone https://github.com/nocobase/nocobase.git
```

## 2. 切换到项目目录

```bash
cd nocobase
```

## 3. 安装依赖

```bash
yarn install
```

## 4. 设置环境变量

复制环境变量示例文件：

```bash
cp .env.example .env
```

根据您的实际环境配置修改 `.env` 文件中的内容。以下是主要的环境变量配置说明：

### 应用配置

```env
# 应用环境
# development: 开发环境
# production: 生产环境
APP_ENV=development

# 应用端口
APP_PORT=13000

# 应用密钥（生产环境请修改为随机字符串）
APP_KEY=test-key

# API 路径配置
API_BASE_PATH=/api/

# 日志配置
LOGGER_TRANSPORT=console
LOGGER_LEVEL=info

# 集群模式（生产环境可启用）
# CLUSTER_MODE=
```

### 数据库配置

```env
# 数据库类型
DB_DIALECT=mysql

# 数据库连接信息
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=nocobase
DB_USER=your_username
DB_PASSWORD=your_password

# 表前缀（可选）
DB_TABLE_PREFIX=
```

### 缓存配置

```env
# 缓存存储类型
CACHE_DEFAULT_STORE=memory

# 内存缓存最大条目数
CACHE_MEMORY_MAX=2000

# Redis 缓存（可选）
# CACHE_REDIS_URL=
```

### 初始化配置

```env
# 初始化语言
INIT_LANG=en-US

# 管理员账户信息
INIT_ROOT_EMAIL=admin@nocobase.com
INIT_ROOT_PASSWORD=admin123
INIT_ROOT_NICKNAME=Super Admin
INIT_ROOT_USERNAME=nocobase
```

## 5. 安装 NocoBase

```bash
yarn nocobase install
```

## 6. 启动开发服务器

```bash
yarn dev
```

启动成功后，您可以通过以下地址访问：

- Web 界面: http://localhost:13000
- 管理员面板: http://localhost:13000/admin/
- API 文档: http://localhost:13000/api-docs

## 7. 插件安装与升级

NocoBase 支持通过多种方式安装和升级插件。

### 插件安装

#### 通过插件市场安装（推荐）

1. 登录 NocoBase 管理后台
2. 进入插件市场页面
3. 浏览并选择需要的插件
4. 点击"安装"按钮完成安装
5. 安装完成后重启应用使插件生效

#### 通过命令行安装

对于官方插件，可以使用以下命令安装：

```bash
yarn nocobase install plugin-name
```

例如安装工作流插件：

```bash
yarn nocobase install workflow
```

#### 手动安装插件

1. 将插件文件夹复制到 `packages/plugins/` 目录下
2. 如果是自定义插件，确保插件目录结构正确
3. 执行升级命令以注册插件：

```bash
yarn nocobase upgrade
```

### 插件升级

#### 在线升级

1. 登录 NocoBase 管理后台
2. 进入插件管理页面
3. 找到需要升级的插件
4. 点击"升级"按钮完成升级
5. 升级完成后重启应用使更改生效

#### 命令行升级

升级所有插件：

```bash
yarn nocobase upgrade
```

如果只想升级插件而不更新核心代码，可以使用：

```bash
yarn nocobase upgrade --skip-code-update
```

#### 手动升级插件

1. 将新版本的插件文件复制到相应目录
2. 执行升级命令：

```bash
yarn nocobase upgrade
```

### 插件目录结构

NocoBase 的插件通常位于以下目录：

- 内置插件：`packages/plugins/@nocobase/`
- 自定义插件：`packages/plugins/custom/`（需要手动创建）

每个插件目录应包含以下基本结构：

```
plugin-name/
├── package.json
├── src/
│   ├── client/     # 客户端代码
│   ├── server/     # 服务端代码
│   └── index.ts    # 插件入口文件
└── README.md       # 插件说明文档
```

## 11. SDK 集成

NocoBase 提供了官方 SDK (`@nocobase/sdk`)，用于与 NocoBase 应用进行交互。SDK 包含了便捷的 API 客户端和认证管理功能。

### 11.1 SDK 安装

在您的项目中安装 NocoBase SDK：

```bash
yarn add @nocobase/sdk
# 或
npm install @nocobase/sdk
```

### 11.2 SDK 基本用法

``typescript
import { APIClient } from '@nocobase/sdk';

// 创建 API 客户端实例
const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
});

// 用户登录
await api.auth.signIn({
  username: 'admin',
  password: 'admin'
});

// 资源操作
const posts = await api.resource('posts').list({
  page: 1,
  pageSize: 20
});

// 常规 HTTP 请求
const response = await api.request({
  url: 'custom-endpoint',
  method: 'post',
  data: { key: 'value' }
});
```

详细使用请参考开发文档中的 [SDK 使用指南](./development/sdk.md) 和 [SDK 使用示例](./development/sdk-examples.md)。

## 12. 故障排除

### 12.1 常见问题

1. **端口被占用**：如果 13000 端口被占用，可以修改 `.env` 文件中的端口配置：
   ```env
   PORT=13001
   ```

2. **数据库连接失败**：检查数据库服务是否启动，以及 `.env` 文件中的数据库配置是否正确。

3. **依赖安装失败**：尝试清除缓存后重新安装：
   ```bash
   yarn cache clean
   yarn install
   ```

### 12.2 日志查看

查看应用日志可以帮助诊断问题：

```bash
# 查看实时日志
yarn dev --log

# 查看错误日志
tail -f storage/logs/error.log
```

## 13. 后续步骤

安装完成后，您可以：

1. [开发插件](./development/README.md) - 学习如何开发自定义插件
2. [使用 SDK](./development/sdk.md) - 了解如何使用 NocoBase SDK 进行开发
3. [查看示例](./plugin-samples/README.md) - 查看各种插件示例
4. [生产部署](#9-生产部署) - 将应用部署到生产环境

通过以上步骤，您已经成功安装并运行了 NocoBase 应用。现在可以开始开发您的自定义功能了。
