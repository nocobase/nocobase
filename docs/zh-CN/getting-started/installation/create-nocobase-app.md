# `create-nocobase-app` 安装

## 0. 先决条件

请确保你已经：

- 安装了 Node.js 14+、Yarn 1.22.x
- 配置并启动了所需数据库 SQLite 3.x、MySQL 8.x、PostgreSQL 10.x 任选其一

如果你没有安装 Node.js 可以从官网下载并安装最新的 LTS 版本。如果你打算长期与 Node.js 打交道，推荐使用 nvm（Win 系统可以使用 nvm-windows ）来管理 Node.js 版本。

```bash
$ node -v

v16.13.2
```

推荐使用 yarn 包管理器。

```bash
$ npm install --global yarn
$ yarn -v

1.22.10
```

由于国内网络环境的原因，强烈建议你更换国内镜像。

```bash
$ yarn config set registry https://registry.npmmirror.com/
$ yarn config set sqlite3_binary_host_mirror https://npmmirror.com/mirrors/sqlite3/
```

## 1. 创建 NocoBase 项目

```bash
# SQLite
yarn create nocobase-app my-nocobase-app -d sqlite
# MySQL
yarn create nocobase-app my-nocobase-app -d mysql \
   -e DB_HOST=localhost \
   -e DB_PORT=3306 \
   -e DB_DATABASE=nocobase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase
# PostgreSQL
yarn create nocobase-app my-nocobase-app -d postgres \
   -e DB_HOST=localhost \
   -e DB_PORT=5432 \
   -e DB_DATABASE=nocobase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase
```

## 2. 切换目录

```bash
cd my-nocobase-app
```

## 3. 安装依赖

📢 由于网络环境、系统配置等因素影响，接下来这一步骤可能需要十几分钟时间。  

```bash
yarn install
```

## 4. 安装 NocoBase

```bash
yarn nocobase install --lang=zh-CN
```

## 5. 启动 NocoBase

开发环境

```bash
yarn dev
```

生产环境

```bash
yarn start # 暂不支持在 win 平台下运行
```

注：生产环境，如果代码有修改，需要执行 `yarn build`，再重新启动 NocoBase。

## 6. 登录 NocoBase

使用浏览器打开 http://localhost:13000/ 初始化账号和密码是 `admin@nocobase.com` 和 `admin123`。
