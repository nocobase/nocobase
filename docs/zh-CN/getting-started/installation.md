---
order: 1
---

# 安装

NocoBase 支持 Docker 和 CLI 两种安装方法，如果你是新人推荐使用 Docker 安装。

## Docker (👍Recommended)

---

### 0. 先决条件

⚡⚡ 请确保你已经安装了 [Docker](https://docs.docker.com/get-docker/)

### 1. 将 NocoBase 下载到本地

使用 Git 下载（或直接[下载 Zip 包](https://github.com/nocobase/nocobase/archive/refs/heads/main.zip)，并解压到 nocobase 目录下）

```bash
git clone https://github.com/nocobase/nocobase.git nocobase
```

### 2. 选择数据库（任选其一）

支持 SQLite、MySQL、PostgreSQL 数据库

```bash
# SQLite
cd nocobase/docker/app-sqlite
# MySQL
cd nocobase/docker/app-mysql
# PostgreSQL
cd nocobase/docker/app-postgres
```

### 3. 安装并启动 NocoBase

安装过程可能需要等待几十秒钟

```bash
# 在后台运行
$ docker-compose up -d
# 查看 app 进程的情况
$ docker-compose logs app

app-sqlite-app-1  | nginx started
app-sqlite-app-1  | yarn run v1.22.15
app-sqlite-app-1  | $ cross-env DOTENV_CONFIG_PATH=.env node -r dotenv/config packages/app/server/lib/index.js install -s
app-sqlite-app-1  | Done in 2.72s.
app-sqlite-app-1  | yarn run v1.22.15
app-sqlite-app-1  | $ pm2-runtime start --node-args="-r dotenv/config" packages/app/server/lib/index.js -- start
app-sqlite-app-1  | 2022-04-28T15:45:38: PM2 log: Launching in no daemon mode
app-sqlite-app-1  | 2022-04-28T15:45:38: PM2 log: App [index:0] starting in -fork mode-
app-sqlite-app-1  | 2022-04-28T15:45:38: PM2 log: App [index:0] online
app-sqlite-app-1  | 🚀 NocoBase server running at: http://localhost:13000/
```

## CLI

---

### 0. 先决条件

请确保你已经安装了 Node.js 12.x 或以上版本，如果你没有安装 Node.js 可以从官网下载并安装最新的 LTS 版本。如果你打算长期与 Node.js 打交道，推荐使用 nvm（Win 系统可以使用 nvm-windows ）来管理 Node.js 版本。

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

最后，请确保你已经配置并启动所需数据库，数据库支持 SQLite（无需安装启动）、MySQL、PostgreSQL。

### 1. 创建 NocoBase 项目

```bash
# SQLite
yarn create nocobase-app my-nocobase-app -d sqlite
# MySQL
yarn create nocobase-app my-nocobase-app -d mysql \
   -e DB_HOST=localhost \
   -e DB_PORT=3356 \
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

### 2. 切换目录

```bash
cd my-nocobase-app
```

### 3. 安装依赖

📢 由于网络环境、系统配置等因素影响，接下来这一步骤可能需要十几分钟时间。  

```bash
# 生产环境部署时，可以只安装必要的依赖，减少依赖体积和下载时长
yarn install --production
# 或者，安装完整的依赖
yarn install
```

### 4. 安装并启动 NocoBase

```bash
# 生产环境下启动应用，源码有修改时，需要重新编译打包（yarn build）
yarn start
# 开发环境下启动应用，代码会实时编译
yarn dev
```
