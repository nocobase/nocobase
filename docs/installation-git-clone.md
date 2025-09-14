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

根据您的实际环境配置修改 `.env` 文件中的内容：

```env
# 数据库配置
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=nocobase
DB_USERNAME=your_username
DB_PASSWORD=your_password

# 缓存配置
REDIS_URL=

# 应用配置
APP_ENV=development
APP_PORT=13000
APP_HOST=localhost
APP_PROXY=false
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

## 生产环境部署

如果要在生产环境部署，需要注意以下几点：

### 子路径部署

如果需要在子路径下部署，需要配置 `APP_PUBLIC_PATH`：

```env
APP_PUBLIC_PATH=/nocobase/
```

### 构建生产版本

```bash
yarn build
```

### 启动生产服务器

```bash
yarn start
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

## 更新 NocoBase

要更新到最新版本，可以执行以下命令：

```bash
git pull
yarn install
yarn nocobase upgrade
```
