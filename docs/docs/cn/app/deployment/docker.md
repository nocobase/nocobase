---
title: 独立部署：Docker
description: 不使用 Hub，用应用自带的 Dockerfile 构建镜像并持久化运行。
---

# 独立部署：Docker

部署 Hub 容器请阅读[部署 Hub 平台](./hub)。本页使用应用自带的 Dockerfile 从源码构建镜像，数据库与持久目录配置见[运行配置](./configuration)。

## 1. 构建镜像

应用根目录自带 `Dockerfile` 和 `Dockerfile.dockerignore`。镜像在容器内从源码执行 `pnpm build`，运行层只包含 `dist/` 和 `config.example.yml`；`config.yml`、`.env`、`storage/` 和 `node_modules` 不会进入构建上下文。在应用根目录执行：

```bash
docker build -t crm:release-001 .
```

镜像不绑定挂载路径，默认挂载在 `/main`，运行时用 `-e APP_BASE_PATH=/crm` 改为其他路径，容器健康检查也会检查这个路径。`.env` 中的设置不会带入镜像，需要的变量在运行时通过容器环境变量提供。

构建阶段运行在构建机自身的架构上，通过 `pnpm build --target` 获取目标平台的原生模块，因此构建其他架构的镜像不需要在模拟环境中编译，例如 `docker buildx build --platform linux/amd64,linux/arm64 ...`。运行镜像基于 Debian bookworm 与 Node 24，不能换成 Alpine 基础镜像。

已经在本机构建好 `dist/` 时，可以跳过镜像内的构建，直接打包它。先按镜像平台构建，再传入 `DIST=prebuilt`：

```bash
pnpm build --target linux-x64
docker build --platform linux/amd64 --build-arg DIST=prebuilt -t crm:release-001 .
```

`--target` 与 `--platform` 必须是同一架构：不指定 `--platform` 时，Docker 按执行构建的机器选择架构，在 Apple 芯片的 Mac 上是 `linux/arm64`。镜像构建会检查 `dist/`：必须是为 `linux`、glibc、镜像架构和 Node 24 构建的，并且由不绑定挂载路径的 `@nocobase/app-cli` 构建，否则直接失败并给出原因。`pnpm build` 会把本地 `.env` 中的服务端变量写入 `dist/.env`，其中可能包含 `DB_PASSWORD`，这个文件不会进入镜像。一份 `dist/` 只对应一种架构，多架构镜像需要从源码构建。

应用原来通过 `pnpm create @nocobase/app` 创建、根目录没有这两个文件时，从同一模板新版本中复制 `Dockerfile` 和 `Dockerfile.dockerignore`。两个文件必须一起使用：缺少 `Dockerfile.dockerignore` 时，本地配置和数据会进入构建上下文。

## 2. 准备运行配置

在服务器创建专用目录，放入 `compose.yml`、目标环境 `config.yml` 和 `storage/`。按[认证与会话密钥](./configuration#配置认证与会话密钥)中的说明配置密钥，但 SQLite 路径改为容器内的 `/app/storage/database.sqlite`。确保运行用户有 storage 写权限；镜像以 `node` 用户运行，可用 `docker run --rm --entrypoint id crm:release-001` 确认 UID 和 GID。

镜像不包含 pnpm。需要在容器中运行应用命令时，直接调用 `node dist/cli/index.js`，例如检查配置：

```bash
docker run --rm -v ./config.yml:/app/config.yml:ro crm:release-001 node dist/cli/index.js config check
```

## 3. 创建 Compose 配置

在部署目录创建 `compose.yml`：

```yaml
services:
  crm:
    image: crm:release-001
    restart: unless-stopped
    init: true
    stop_grace_period: 60s
    ports:
      - '127.0.0.1:13000:13000'
    environment:
      APP_PUBLIC_ORIGIN: https://apps.example.com
      NOCOBASE_STRICT_STARTUP: 'true'
    volumes:
      - ./config.yml:/app/config.yml:ro
      - ./storage:/app/storage
```

镜像已设置 `NODE_ENV=production`、`APP_CONFIG_FILE=/app/config.yml`、`APP_SERVER_HOST=0.0.0.0`、`APP_SERVER_PORT=13000`，以及构建时的 `APP_BASE_PATH`，并内置请求 `<APP_BASE_PATH>/api/healthz` 的健康检查。`init: true` 让停止信号传递给 Node 进程；`NOCOBASE_STRICT_STARTUP` 让启动失败的容器退出，配合 `restart: unless-stopped` 自动重试。

## 4. 启动服务

启动前确认 `config.yml` 已存在且为文件，避免 Docker 将不存在的绑定路径创建为目录。在部署目录执行：

```bash
docker compose config --quiet
docker compose up -d
docker compose ps
docker compose logs --tail=100 crm
```

若镜像在其他机器构建，先通过自己的镜像仓库或 save/load 传到服务器。容器内数据库主机不能用宿主机意义上的 localhost。

## 对外访问与验收

按[HTTPS 与反向代理](./configuration#https-与反向代理)配置对外地址，按[初始化与验收](./standalone#初始化与验收)完成管理员改密、业务验证和重启持久性检查。

## 更新与恢复

使用新的镜像版本或 digest，保留原配置和 storage 挂载。发布前完成备份和迁移兼容性检查，更新 image 后运行 `docker compose up -d`，再次验证实际业务。详见[更新与版本恢复](./standalone#更新与版本恢复)与[备份与灾难恢复](./operations#备份与灾难恢复)。
