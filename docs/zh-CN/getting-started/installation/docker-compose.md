# Docker 安装 (👍 推荐)

## 0. 先决条件

⚡⚡ 请确保你已经安装了 [Docker](https://docs.docker.com/get-docker/)

## 1. 将 NocoBase 下载到本地

使用 Git 下载（或直接[下载 Zip 包](https://gitee.com/nocobase/nocobase/repository/archive/main.zip)，并解压到 nocobase 目录下）

```bash
git clone https://gitee.com/nocobase/nocobase.git nocobase
```

## 2. 选择数据库（任选其一）

将目录切换到第一步下载的文件夹里（根据实际情况调整）。

```bash
# MacOS, Linux...
cd /your/path/nocobase
# Windows
cd C:\your\path\nocobase
```

不同数据库的 docker 配置有些许差异，请选择切换到对应的目录下。

### SQLite

```bash
cd docker/app-sqlite
```

### MySQL

```bash
cd docker/app-mysql
```

### PostgreSQL

```bash
cd docker/app-postgres
```

## 3. 配置 docker-compose.yml（非必须）

<Alert>

非开发人员，跳过这一步。如果你懂得开发，也可以进一步了解怎么配置 `docker-compose.yml`。

</Alert>

目录结构（与 docker 相关）

```bash
├── nocobase
  ├── docker
    ├── app-sqlite
      ├── storage
      ├── docker-compose.yml
    ├── app-mysql
      ├── storage
      ├── docker-compose.yml
    ├── app-postgres
      ├── storage
      ├── docker-compose.yml
```

`docker-compose.yml` 的配置说明：

SQLite 只有 app 服务，PostgreSQL 和 MySQL 会有对应的 postgres 或 mysql 服务，可以使用例子的数据库服务，或者自己配置。

```yml
services:
  app:
  postgres:
  mysql:
```

app 端口，例子为 13000 端口，访问地址为 `http://your-ip:13000/`

```yml
services:
  app:
    ports:
      - "13000:80"
```

NocoBase 版本（[点此查看最新版本](https://hub.docker.com/r/nocobase/nocobase/tags)），升级时，需要修改为最新版本。

```yml
services:
  app:
    image: nocobase/nocobase:0.7.0-alpha.78
```

环境变量

```yml
services:
  app:
    image: nocobase/nocobase:0.7.0-alpha.78
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_DATABASE=nocobase
      - DB_USER=nocobase
      - DB_PASSWORD=nocobase
      - LOCAL_STORAGE_BASE_URL=http://localhost:13000/storage/uploads
```

- `DB_*` 为数据库相关，如果不是例子默认的数据库服务，请根据实际情况修改；
- `LOCAL_STORAGE_BASE_URL` 为本地存储的根 URL，如果不是本地安装，需要改为对应的 ip 或域名。

## 4. 安装并启动 NocoBase

安装过程可能需要等待几分钟

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

## 5. 登录 NocoBase

使用浏览器打开 http://localhost:13000/ 初始化账号和密码是 `admin@nocobase.com` 和 `admin123`。
