# Installation

NocoBase 支持三种安装方式：

- 使用 Docker 安装（推荐）
- 通过 `create-nocobase-app` 安装
- Git 源码安装

## 使用 Docker 安装 (👍Recommended)

---

### 0. Prerequisites

⚡⚡ Please make sure you have installed [Docker](https://docs.docker.com/get-docker/)

### 1. Download NocoBase

Download with Git (or Download Zip，and extract it to the nocobase directory)

```bash
git clone https://github.com/nocobase/nocobase.git nocobase
```

### 2. Select database (choose one)

Supports SQLite, MySQL, PostgreSQL

```bash
# SQLite
cd nocobase/docker/app-sqlite
# MySQL
cd nocobase/docker/app-mysql
# PostgreSQL
cd nocobase/docker/app-postgres
```

### 3. Install and start NocoBase

It may take dozens of seconds

```bash
# run in the background
$ docker-compose up -d
# view app logs
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

### 4. Log in to NocoBase

Open [http://localhost:13000](http://localhost:13000) in a web browser. The initial account and password are `admin@nocobase.com` and `admin123`.


## 使用 `create-nocobase-app` 安装

---

### 0. Prerequisites

Please make sure you have Node.js 14.x or above installed. You can download and install the latest LTS version from the official website. It is recommended to use nvm (or nvm-windows for Win systems) to manage Node.js versions if you plan to work with Node.js for a long time.

```bash
$ node -v

v16.13.2
```

yarn package manager is recommend.

```bash
$ npm install --global yarn
$ yarn -v

1.22.10
```

Also, make sure you have configured and started the required database, which supports SQLite, MySQL, PostgreSQL.

### 1. Create a NocoBase project

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

### 2. Switch to the project directory

```bash
cd my-nocobase-app
```

### 3. Install dependencies

📢 This next step may take more than ten minutes due to network environment, system configuration, and other factors.  

```bash
yarn install
```

### 4. Install NocoBase

```bash
yarn nocobase install
```

### 5. Start NocoBase

Development

```bash
yarn dev
```

Production

```bash
yarn start
```

注：生产环境，如果代码有修改，需要执行 `yarn build`，再重新启动 NocoBase。

### 6. Log in to NocoBase

Open [http://localhost:13000](http://localhost:13000) in a web browser. The initial account and password are `admin@nocobase.com` and `admin123`.

## Git 源码安装

---

### 0. 先决条件

请确保你已经：

- 安装了 Git、Node.js、Yarn
- 配置并启动了所需数据库（SQLite、MySQL、PostgreSQL 任选其一）

### 1. 将 NocoBase 下载到本地

```bash
git clone https://github.com/nocobase/nocobase.git my-nocobase-app
```

### 2. 切换目录

```bash
cd my-nocobase-app
```

### 3. 安装依赖

📢 由于网络环境、系统配置等因素影响，接下来这一步骤可能需要十几分钟时间。  

```bash
yarn install
```

### 4. 设置环境变量

根据实际情况修改环境变量，如果你不知道怎么改，[点此查看环境变量说明](../development/env.md)，也可以保持默认。

```bash
DB_DIALECT=sqlite
DB_STORAGE=storage/db/nocobase.sqlite
```

### 5. 安装 NocoBase

```bash
yarn nocobase install --lang=zh-CN
```

### 6. 启动 NocoBase

开发环境

```bash
yarn dev
```

生产环境

```bash
# 编译
yarn build
# 启动
yarn start
```

### 7. 登录 NocoBase

使用浏览器打开 http://localhost:13000/ 初始化账号和密码是 `admin@nocobase.com` 和 `admin123`。
