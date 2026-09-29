---
title: 手动部署：Hub
description: 安装 Hub，并通过管理界面或 CLI 将应用发布到 Hub。
---

# 手动部署：Hub

Hub 是 NocoBase 的应用发布与管理平台，属于专业版能力，需要专业版授权才能安装和使用；开源版按[手动部署：独立运行](./standalone)部署。本页先说明 Hub 的安装，再说明应用的发布；团队已有 Hub 时，直接阅读[发布应用](#发布应用)。由 AI Agent 执行时，提示词见[用 AI Agent 部署](./with-agent#发布到-hub)。

## Hub 的组成

Hub 本身也是一个 NocoBase 应用，由 `@nocobase/app-template-hub` 模板构建。它提供管理界面，记录应用、Release、运行配置和部署操作，并在后台启动 App Host 运行业务应用。当前版本为一个 Hub 管理一个本地 Host，多个应用在同一 Host 进程内运行；替换应用版本时先停止旧实例再启动新实例，需要预留服务中断窗口。

| 地址                            | 用途                     |
| ------------------------------- | ------------------------ |
| `https://apps.example.com/hub/` | 登录 Hub，管理应用和部署 |
| `https://apps.example.com/crm/` | 访问 CRM 业务应用        |

Hub 挂载在 `/hub`，各应用挂载在 `/<应用 ID>`。反向代理将整个域名转发至 Hub 即可，无需为每个应用单独开放端口。

## 安装 Hub

两种安装方式都需要一个持久目录，用于保存 Hub 的数据库、上传的 Release 和各应用的数据。

### 用 Docker 安装

官方镜像支持 Linux amd64 和 arm64，发布在 `ghcr.io/nocobase/hub` 和 `registry.cn-beijing.aliyuncs.com/nocobase/hub`。每次发布推送 `latest` 和形如 `run-<运行 ID>-<尝试号>` 的固定标签；固定部署版本时使用后者或镜像 digest。镜像不使用 npm 版本号作为标签。

在服务器上创建部署目录，拉取镜像，并从镜像中提取配置模板：

```bash
mkdir -p hub/storage && cd hub
hub_image=ghcr.io/nocobase/hub:latest
docker pull "$hub_image"
docker run --rm --entrypoint cat "$hub_image" /app/config.example.yml > config.example.yml
cp config.example.yml config.yml
echo "HUB_IMAGE=$hub_image" > .env
```

编辑 `config.yml`：使用 `openssl rand -hex 32` 生成两个随机值，分别替换 `auth.secret` 和 `session.secret`；按[初始管理员](./configuration#初始管理员)设置账号和密码；数据库保留模板中的 SQLite 路径。官方镜像仅包含 SQLite 驱动，使用其他数据库时需要自行构建镜像。

创建 `compose.yml`：

```yaml
services:
  hub:
    image: ${HUB_IMAGE:?Set HUB_IMAGE}
    restart: unless-stopped
    init: true
    stop_grace_period: 60s
    ports:
      - '127.0.0.1:13000:13000'
    environment:
      NODE_ENV: production
      APP_CONFIG_FILE: /app/config.yml
      APP_STORAGE_DIR: /data
      APP_BASE_PATH: /hub
      APP_PUBLIC_ORIGIN: https://apps.example.com
      APP_SERVER_HOST: 0.0.0.0
      APP_SERVER_PORT: '13000'
    volumes:
      - ./config.yml:/app/config.yml:ro
      - ./storage:/data
```

镜像以 `node` 用户（UID 1000）运行，`storage` 目录需要对该用户可写。启动并查看日志：

```bash
docker compose up -d
docker compose logs --tail=100 hub
```

修改 `config.yml` 后，执行 `docker compose up -d --force-recreate hub` 使其生效。升级 Hub 时，更新 `.env` 中的 `HUB_IMAGE`，然后执行 `docker compose pull hub && docker compose up -d hub`。

### 用 app-installer 安装

不使用 Docker 且不修改 Hub 源码时，可以用 app-installer 在 Node.js 服务器上安装 Hub。服务器需要 Node.js 24、pnpm 11 以及全局安装的 pm2 4.3 或更高版本（`npm install -g pm2`；不要使用通过 `npx` 临时下载的 pm2）。NocoBase 3 的包发布在 `https://npm.nocobase.ai`，需要通过 `--registry` 指定：

```bash
npx --registry=https://npm.nocobase.ai @nocobase/app-installer install /srv/nocobase/hub --template hub --origin https://apps.example.com
```

app-installer 在服务器上构建 Hub，生成包含随机密钥的 `config.yml`，执行数据库迁移，通过 pm2 启动 Hub，并等待健康检查通过，整个过程需要几分钟。默认监听 `127.0.0.1:13000`，使用 SQLite；使用其他数据库时，通过 `--dialect` 和 `--set` 指定连接参数，密码通过 `--set-from-env` 从环境变量读取。安装完成后执行 `pm2 startup`，再以 sudo 执行其输出的命令，服务器重启后 pm2 会自动启动 Hub。

后续的升级、回滚和状态查询：

```bash
npx --registry=https://npm.nocobase.ai @nocobase/app-installer upgrade --dir /srv/nocobase/hub
npx --registry=https://npm.nocobase.ai @nocobase/app-installer rollback --dir /srv/nocobase/hub
npx --registry=https://npm.nocobase.ai @nocobase/app-installer status --dir /srv/nocobase/hub
```

升级前，app-installer 会说明停机范围和备份内容并请求确认；升级失败时自动回滚到原版本。完整参数见 `--help`。

修改过源码的 Hub 是一个普通的应用项目：按[手动部署：独立运行](./standalone)构建部署包后，通过 `--archive` 安装，并将运行时的 `APP_BASE_PATH` 设为 `/hub`。

### 反向代理与首次登录

按[HTTPS 与反向代理](./configuration#https-与反向代理)将整个域名转发至 `http://127.0.0.1:13000`，并在 Nginx 的 `server` 配置中增加 `client_max_body_size 260m;`。Hub 允许上传的 Release 最大为 256 MiB。

打开 `https://apps.example.com/hub/`，使用 `config.yml` 中 `users.initialAdmin` 配置的账号登录。模板默认用户名为 `nocobase`、密码为 `admin123`，登录后应立即修改。

## 发布应用

### 1. 在 Hub 中创建应用

登录 Hub，创建应用并记录应用 ID。应用 ID 在整个 Hub 中唯一，仅可包含字母、数字、下划线和连字符；应用路径固定为 `/<应用 ID>`，例如 `crm` 对应 `https://apps.example.com/crm/`。

### 2. 构建部署包

在应用项目根目录执行构建。`--target` 和 `--node-version` 需要与 Hub 进程实际运行的环境一致：以 Docker 安装的 Hub 固定为 Linux glibc 和 Node 24，架构与镜像一致；以 app-installer 安装的 Hub 以服务器环境为准。

```bash
pnpm build --target linux-x64 --node-version 24 --tar
```

ARM64 服务器使用 `linux-arm64`。参数与运行环境不一致时，上传和部署仍会成功，应用启动时因原生模块不匹配而失败。构建产物为 `storage/exports/dist.tar.gz`。

### 3. 通过管理界面部署

1. 打开应用详情，上传部署包。上传仅保存 Release，不切换运行版本。
2. 点击「部署」，选择要运行的 Release。
3. 首次部署选择「配置文件」方式，以 Release 模板为起点填写数据库等参数。`auth.secret` 和 `session.secret` 留空或保留占位值即可，Hub 会自动生成。再次部署时默认沿用当前配置。
4. 提交后等待部署记录显示成功；失败时查看该次部署的日志。
5. 打开应用地址，登录并验证业务功能。

### 4. 通过 CLI 部署

CLI 需要 Hub 的 API Key。在 Hub 导航的「API Key」页面创建：选择目标应用，勾选「上传版本」和「部署版本」权限。密钥明文仅在创建时显示；绑定的应用和权限在创建后不可修改。

在应用项目根目录的 `.env`（不提交到代码仓库）中设置：

```dotenv
HUB_URL=https://apps.example.com/hub
HUB_APP_ID=crm
HUB_API_KEY=REPLACE_WITH_PUBLISHING_KEY
```

`hub deploy` 和 `hub upload` 命令由 `@nocobase/hub-cli` 提供。默认模板已依赖该包；其他模板需要先执行 `pnpm add -D @nocobase/hub-cli`。命令在源码项目中运行，构建产物 `dist/` 中不包含这些命令。

首次部署时，上传并部署，同时提交运行配置：

```bash
pnpm nocobase hub deploy --config ./runtime.yml --json
```

后续更新不传 `--config` 时沿用 Hub 当前配置；传入时整份替换，需要提交完整配置。仅上传而不部署，以及部署已上传的 Release：

```bash
pnpm nocobase hub upload --json
pnpm nocobase hub deploy --release-id <RELEASE_ID> --json
```

`hub deploy` 默认等待最终结果，超时时间为 600 秒。退出码 `0` 表示成功，`1` 表示被 Hub 拒绝或部署失败，`2` 表示本地参数错误，`3` 表示网络错误或结果未确认。退出码 `3` 不代表部署失败，应先查看 Hub 的部署记录，再使用相同的 `--idempotency-key` 重试。

## 更新、回滚与启停

- **更新**：构建新的部署包，上传并部署。涉及数据库变更时先完成备份。版本替换期间应用服务中断。
- **回滚**：在部署历史中选择一次成功的部署发起回滚，或通过 CLI `pnpm nocobase hub deploy --release-id <RELEASE_ID> --idempotency-key <NEW_ROLLBACK_KEY> --json` 部署较早的 Release。每次新发起的回滚使用一个新的幂等键；同一次回滚因网络错误或结果未确认而重试时，复用该键。不指定新键可能复用历史部署记录，只返回之前的结果而不切换当前版本。回滚不会撤销数据库变更；旧版本与当前数据库不兼容时，需要恢复部署前的配套备份。
- **停止与启动**：在应用详情中操作。停止后保留部署、配置和数据。
- **移除**：删除应用记录、全部 Release、配置和应用数据卷。执行前先完成备份。

## 升级 Hub

升级 Hub 会重启其托管的所有应用，应安排在允许服务中断的时间进行。升级前确认没有进行中的部署，并备份 Hub 的持久目录和 `config.yml`；Hub 的 `auth.secret` 还用于加密发布凭证，恢复时必须使用与数据库配套的原密钥。升级命令见上文对应的安装方式。升级完成后逐个检查业务应用是否正常。

如果升级后 Hub 的 Node 大版本发生变化，已发布的应用需要以新的 `--node-version` 重新构建并发布，否则启动时原生模块无法加载。
