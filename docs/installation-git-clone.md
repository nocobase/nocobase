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

## 8. 多语言支持与翻译

NocoBase 支持多语言本地化，用户可以根据需要切换界面语言。

### 系统支持的语言

NocoBase 默认支持以下语言：
- 英语 (en-US)
- 简体中文 (zh-CN)
- 日语 (ja-JP)
- 意大利语 (it-IT)
- 荷兰语 (nl-NL)

### 语言设置

在系统安装完成后，可以通过以下方式设置语言：

1. 登录管理后台
2. 进入"系统设置" → "语言设置"
3. 在"启用语言"中选择需要的语言
4. 第一个选择的语言将作为默认语言

### 自定义翻译

如果需要自定义翻译或添加新的语言支持，可以通过以下方式：

#### 使用本地化管理功能

1. 登录管理后台
2. 进入"本地化管理"模块
3. 选择需要翻译的文本
4. 输入目标语言的翻译内容
5. 保存更改

#### 通过代码贡献翻译

如果您希望为 NocoBase 贡献翻译，可以按照以下步骤操作：

1. Fork NocoBase 仓库
2. 克隆您的 fork 到本地：

```bash
git clone https://github.com/your-username/nocobase.git
```

3. 创建新的分支：

```bash
git checkout -b translation/your-language
```

4. 在相应的语言文件中添加翻译条目：
   - 前端翻译文件：`src/locale/${lang}.ts`
   - 后端翻译文件：`src/locale/${lang}.ts`（在对应的插件目录中）

5. 提交更改并推送：

```bash
git add .
git commit -m "Add translation for your-language"
git push origin translation/your-language
```

6. 在 GitHub 上创建 Pull Request

### 插件多语言支持

如果您在开发自定义插件，可以通过以下方式添加多语言支持：

1. 在插件目录下创建 `src/locale` 文件夹
2. 为每种支持的语言创建对应的翻译文件，如：
   - `en-US.ts` - 英语翻译
   - `zh-CN.ts` - 简体中文翻译
   - `ja-JP.ts` - 日语翻译

3. 在翻译文件中导出键值对形式的翻译内容：

```typescript
// en-US.ts
export default {
  "your-plugin.key1": "Translation text 1",
  "your-plugin.key2": "Translation text 2",
};
```

4. 在插件代码中使用翻译：

```typescript
// 在 React 组件中使用
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  return <div>{t("your-plugin.key1")}</div>;
};
```

## 生产环境部署

如果要在生产环境部署，需要注意以下几点：

### 环境变量配置

在生产环境中，需要修改 `.env` 文件中的以下配置：

```env
# 设置为生产环境
APP_ENV=production

# 生产环境端口
APP_PORT=80

# 生产环境主机
APP_HOST=your-domain.com

# 如果使用反向代理
APP_PROXY=true

# 更安全的应用密钥
APP_KEY=your-random-string-here
```

### 子路径部署

如果需要在子路径下部署（例如 http://your-domain.com/nocobase/），需要配置 `APP_PUBLIC_PATH`：

```env
APP_PUBLIC_PATH=/nocobase/
```

同时，您可能还需要配置 Web 服务器（如 Nginx）来正确处理子路径请求。

### 构建生产版本

```bash
yarn build
```

### 启动生产服务器

```bash
yarn start
```

或者在后台运行：

```bash
yarn start:prod
```

### 使用 PM2 管理生产进程（推荐）

1. 安装 PM2：
   ```bash
   npm install -g pm2
   ```

2. 使用 PM2 启动应用：
   ```bash
   pm2 start yarn --name "nocobase" -- start:prod
   ```

3. 保存 PM2 配置：
   ```bash
   pm2 save
   ```

4. 设置开机自启：
   ```bash
   pm2 startup
   ```

## 升级 NocoBase

要将 NocoBase 升级到最新版本，请按照以下步骤操作：

### 1. 切换到项目目录

```bash
cd nocobase
```

### 2. 拉取最新代码

```bash
git pull
```

### 3. 安装新的依赖

```bash
yarn install
```

### 4. 执行升级命令

```bash
yarn nocobase upgrade
```

该命令会自动处理数据库迁移和其他必要的升级操作。

### 5. 重启服务

升级完成后，重启开发服务器：

```bash
yarn dev
```

或者生产服务器：

```bash
yarn start
```

如果使用 PM2 管理进程：

```bash
pm2 restart nocobase
```

## 故障排除

### 权限问题

在 Windows 系统上，可能需要以管理员身份运行命令提示符来避免权限问题。

### 依赖安装失败

如果遇到依赖安装问题，可以尝试以下方法：

1. 清除缓存：
   ```bash
   yarn cache clean
   ```

2. 删除 node_modules 和 yarn.lock 后重新安装：
   ```bash
   rm -rf node_modules yarn.lock
   yarn install
   ```

### 数据库连接问题

确保 MySQL 数据库服务正在运行，并且 `.env` 文件中的数据库配置正确。

修改环境变量后，需要重启应用才能使配置生效。
