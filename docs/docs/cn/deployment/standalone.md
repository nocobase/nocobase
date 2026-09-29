---
title: 手动部署：独立运行
description: 不使用 Hub，通过 app-installer、Docker 或 Node.js 在服务器上运行应用。
---

# 手动部署：独立运行

本页说明不使用 Hub 的三种运行方式，适用于开源版以及未持有专业版授权的场景。推荐使用 app-installer：它将部署包安装到服务器并通过 pm2 运行，升级和回滚也由它完成。由 AI Agent 执行时，提示词见[用 AI Agent 部署](./with-agent#用-app-installer-部署到服务器)。

## 构建部署包

Docker 方式在镜像内构建；另外两种方式先在构建机（开发机或 CI）上构建部署包。构建前，在服务器上确认其架构和 Node 大版本：

```bash
node -p "process.platform + '-' + process.arch + ' node ' + process.versions.node"
ldd --version 2>&1 | head -1   # 输出包含 musl 时为 Alpine 类环境
```

在应用项目根目录执行构建，`--target` 和 `--node-version` 使用服务器的值；Alpine 环境使用带 `-musl` 后缀的目标：

```bash
pnpm build --target linux-x64 --node-version 24 --tar
scp storage/exports/dist.tar.gz user@server:/tmp/crm.tar.gz
```

部署包包含 `dist/` 和 `config.example.yml`，不包含运行配置和业务数据，也不绑定挂载路径。使用 SQLite 以外的数据库时，需要在构建前将驱动加入项目，例如 `pnpm add @nocobase/db-postgres`。`pnpm build` 会将项目 `.env` 中的白名单变量写入 `dist/.env`，构建前应确认其中没有不应带入生产环境的值。

## 用 app-installer 部署

服务器需要 Node.js 24 以及全局安装的 pm2 4.3 或更高版本（`npm install -g pm2`；不要使用通过 `npx` 临时下载的 pm2；Windows 请使用 WSL），不需要源码和 pnpm。NocoBase 3 的包发布在 `https://npm.nocobase.ai`，需要通过 `--registry` 指定。

### 安装

```bash
npx --registry=https://npm.nocobase.ai @nocobase/app-installer install /srv/nocobase/crm \
  --archive /tmp/crm.tar.gz --origin https://apps.example.com --base-path /crm
```

目标目录必须不存在或为空。`--origin` 不包含路径；`--base-path` 为挂载路径，未指定时为 `/main`。默认监听 `127.0.0.1:13000`，使用 SQLite，pm2 进程名为 `nocobase-` 加目录名。app-installer 依次解压部署包、检查其是否为本机构建、生成包含随机密钥的 `config.yml` 和记录运行参数的 `app.env`、执行数据库迁移、通过 pm2 启动应用并等待健康检查通过。启动前任何一步失败都会清理已写入的文件，重新执行即可。

使用其他数据库时，通过 `--dialect` 和 `--set` 指定连接参数；密码先写入环境变量，再通过 `--set-from-env` 读取：

```bash
CRM_DB_PASSWORD=... npx --registry=https://npm.nocobase.ai @nocobase/app-installer install /srv/nocobase/crm \
  --archive /tmp/crm.tar.gz --origin https://apps.example.com --base-path /crm --dialect postgres \
  --set database.connections.main.host=db.internal \
  --set database.connections.main.username=crm \
  --set-from-env database.connections.main.password=CRM_DB_PASSWORD
```

安装完成后有三项后续操作：执行 `pm2 startup` 并以 sudo 执行其输出的命令；按[HTTPS 与反向代理](./configuration#https-与反向代理)将域名转发至 `http://127.0.0.1:13000`；打开 `https://apps.example.com/crm/`，使用 `config.yml` 中 `users.initialAdmin` 配置的账号登录并修改默认密码。日志通过 `pm2 logs nocobase-crm` 查看，也保存在安装目录的 `logs/` 下。

同一台服务器上安装多个应用时，每个应用使用独立的目录、端口（`--port`）和挂载路径，由反向代理按路径转发至各自的端口。

### 升级、回滚与状态

```bash
npx --registry=https://npm.nocobase.ai @nocobase/app-installer upgrade --dir /srv/nocobase/crm --archive /tmp/crm.tar.gz
npx --registry=https://npm.nocobase.ai @nocobase/app-installer rollback --dir /srv/nocobase/crm
npx --registry=https://npm.nocobase.ai @nocobase/app-installer status --dir /srv/nocobase/crm
```

升级时，先在旧版本继续服务的同时解压新版本并检查配置，然后停止应用、将 SQLite 数据库和配置备份到 `backups/`、切换版本、执行迁移、启动并执行健康检查；迁移或启动失败时自动回滚到原版本。命令执行前会说明停机范围和备份内容并请求确认，脚本中可加 `--yes` 跳过确认。外部数据库不在备份范围内，需要先自行备份，再加 `--backup-done`。该备份仅用于回滚，不包含上传文件，不能替代定期备份。同一版本号重新构建后升级，同样视为一次升级。

回滚会返回上一次升级前的版本，也可以通过 `--to` 指定磁盘上保留的其他版本。如果被撤销的升级执行过迁移，会使用升级前的备份恢复 SQLite 数据库，升级后写入的数据将丢失；加 `--no-restore` 可保留当前数据库。磁盘上默认保留 3 个版本，可通过 `--keep` 调整。

更换域名或端口时，修改 `app.env` 中的 `APP_PUBLIC_ORIGIN`、`APP_SERVER_HOST` 和 `APP_SERVER_PORT`，然后执行 `pm2 restart nocobase-crm`。完整参数和错误码见 `--help`。

## 用 Docker 部署

应用根目录自带 `Dockerfile` 和 `Dockerfile.dockerignore`，两个文件需要配合使用：缺少后者时，本地配置和数据会进入构建上下文。镜像在容器内从源码执行 `pnpm build`，运行层仅包含 `dist/` 和 `config.example.yml`，基于 Debian bookworm 和 Node 24，不支持替换为 Alpine 基础镜像。

```bash
docker build -t crm:release-001 .
```

构建其他架构的镜像时使用 `docker buildx build --platform linux/arm64`，构建阶段会自行获取目标平台的原生模块。已在本机构建好 `dist/` 时，可通过 `--build-arg DIST=prebuilt` 直接打包，此时 `--target` 与 `--platform` 必须为同一架构。

在服务器上创建部署目录，放入 `config.yml` 和 `storage/`。`config.yml` 按[运行配置](./configuration)填写，SQLite 路径使用容器内路径 `/app/storage/database.sqlite`。镜像以 `node` 用户（UID 1000）运行，`storage` 目录需要对该用户可写。镜像中不包含 pnpm，应用命令通过 `node dist/cli/index.js` 执行；启动前先检查配置：

```bash
docker run --rm -v ./config.yml:/app/config.yml:ro crm:release-001 node dist/cli/index.js config check
```

创建 `compose.yml`：

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
      APP_BASE_PATH: /crm
      APP_PUBLIC_ORIGIN: https://apps.example.com
      NOCOBASE_STRICT_STARTUP: 'true'
    volumes:
      - ./config.yml:/app/config.yml:ro
      - ./storage:/app/storage
```

镜像已设置 `NODE_ENV=production`、`APP_CONFIG_FILE=/app/config.yml`、`APP_SERVER_HOST=0.0.0.0` 和 `APP_SERVER_PORT=13000`，默认挂载在 `/main`，通过 `APP_BASE_PATH` 修改挂载路径，内置的健康检查会使用该路径。`.env` 不会进入镜像，所需变量在此处提供。启动：

```bash
docker compose up -d
docker compose logs --tail=100 crm
```

容器内的 `localhost` 指向容器自身，数据库主机应使用服务名或网络地址。更新时替换镜像标签，保留配置和 `storage` 挂载，完成备份后执行 `docker compose up -d`。

## 直接用 Node.js 运行

不使用 app-installer 和容器时，需要自行解压部署包、编写配置并管理进程。在服务器上执行：

```bash
mkdir -p /srv/nocobase/crm && cd /srv/nocobase/crm
tar -xzf /tmp/crm.tar.gz
mkdir -p storage
node dist/cli/index.js config init
node dist/cli/index.js config set database.connections.main.database=/srv/nocobase/crm/storage/database.sqlite
node dist/cli/index.js config check
```

`config init` 根据 `config.example.yml` 生成包含随机密钥的 `config.yml`；`config set` 修改字段，密码通过 `config set --from-env` 从环境变量读取；`config check` 按启动时的方式加载配置并连接数据库。随后按[初始管理员](./configuration#初始管理员)设置账号和密码。

在前台启动以验证：

```bash
NODE_ENV=production \
APP_CONFIG_FILE=/srv/nocobase/crm/config.yml \
APP_BASE_PATH=/crm \
APP_PUBLIC_ORIGIN=https://apps.example.com \
APP_SERVER_HOST=127.0.0.1 \
APP_SERVER_PORT=13000 \
node ./dist/server/standalone.js
```

请求 `http://127.0.0.1:13000/crm/api/healthz`，返回的 JSON 中 `ok` 为 `true` 表示应用就绪。停止前台进程，交由 systemd 长期运行。创建 `/etc/systemd/system/nocobase-crm.service`：

```ini
[Unit]
Description=NocoBase CRM
After=network.target

[Service]
Type=simple
User=nocobase
WorkingDirectory=/srv/nocobase/crm
Environment=NODE_ENV=production
Environment=APP_CONFIG_FILE=/srv/nocobase/crm/config.yml
Environment=APP_BASE_PATH=/crm
Environment=APP_PUBLIC_ORIGIN=https://apps.example.com
Environment=APP_SERVER_HOST=127.0.0.1
Environment=APP_SERVER_PORT=13000
Environment=NOCOBASE_STRICT_STARTUP=true
ExecStart=/usr/bin/node /srv/nocobase/crm/dist/server/standalone.js
Restart=on-failure
RestartSec=5
TimeoutStopSec=60

[Install]
WantedBy=multi-user.target
```

通过 `systemctl enable --now nocobase-crm` 启动，通过 `journalctl -u nocobase-crm` 查看日志。使用 pm2 代替 systemd 时，将项目根目录的 `ecosystem.config.js` 复制到部署根目录后执行 `pm2 start`；不要将 `script` 直接指向 `standalone.js`，pm2 的包装脚本会导致服务不启动。

更新时停止应用，备份数据库和配置，将旧的 `dist` 移出并放入新的 `dist`，保留 `config.yml` 和 `storage`，对照新的 `config.example.yml` 补充新增配置后再启动。

## 验收

无论采用哪种方式，部署完成后执行以下检查：

1. 请求 `https://apps.example.com/crm/api/healthz`，`ok` 为 `true`。
2. 通过正式域名登录、退出并刷新子页面，确认静态资源和实时连接正常。
3. 创建一条测试记录并上传一个文件，重启服务后确认仍然存在。
4. 默认密码已修改。

故障处理见[排障](./troubleshooting)。
