---
title: 部署 Hub 平台
description: 使用源码或 Docker 部署 Hub 应用，并配置平台访问与持久化。
---

# 部署 Hub 平台

Hub 本身也是一个 NocoBase 应用，使用 `@nocobase/app-template-hub` 模板，内置应用管理功能，并负责启动 App Host。它与普通应用一样，可以从源码启动、构建后运行，也可以通过 Docker 部署。

已有可用 Hub 时，直接阅读[使用 Hub 发布应用](./hub-publishing)。

## Hub 的运行组成

Hub 提供管理界面，负责记录应用、版本、配置和部署操作。App Host 是由 Hub 启动和管理的运行组件，负责加载并运行业务应用；按本页部署时，不需要再手工安装一个独立 Host。

| 组件     | 职责                           | 示例                 |
| -------- | ------------------------------ | -------------------- |
| Hub      | 管理应用发布、配置、状态和日志 | 管理人员访问 `/hub/` |
| App Host | 执行应用加载、启动、停止和替换 | 由 Hub 在后台管理    |
| 业务应用 | 提供业务页面、接口与数据操作   | 用户访问 `/crm/`     |

当前版本采用一个 Hub 管理一个本地 Host，多应用在 Host 进程内运行，共享该进程的资源和故障范围。它不提供每应用独立进程或容器隔离，也不提供远程 Host、多 Host 调度。选择部署环境时，应把 Hub 和所承载应用的资源需求一起考虑。

应用版本替换会先停止旧运行实例，再启动新实例，需要预留服务中断窗口。数据库变更是否兼容旧版本，需要在发布前另行检查。

## 选择部署方式

**推荐使用 Docker 部署 Hub。** 使用已构建的镜像，无需在服务器上安装 Node.js、pnpm 或编译应用。部署前确认所选版本的镜像支持服务器架构。

| 方式           | 适用情况                                                          | 入口                                  |
| -------------- | ----------------------------------------------------------------- | ------------------------------------- |
| Docker（推荐） | 直接部署和使用 Hub，使用镜像管理版本                              | [通过 Docker 部署](#通过-docker-部署) |
| 安装器         | 不改 Hub 源码、不使用 Docker，在 Node.js 服务器上安装、升级和回退 | [通过安装器部署](#通过安装器部署)     |
| 应用模板       | 需要修改 Hub 源码                                                 | [通过应用模板部署](#通过应用模板部署) |

Docker 方式需要 Docker 与 Compose；安装器和应用模板方式都需要 Node.js 24 和 pnpm，安装器另外需要全局安装的 pm2。目标版本尚无可用镜像时，可以用安装器或应用模板从源码构建部署。官方镜像由 Hub 模板自带的 `Dockerfile` 从源码构建；修改过 Hub 源码时，也可以在项目根目录用同一个 `Dockerfile` 自行构建镜像，用法见[独立部署：Docker](./docker#1-构建镜像)，它默认使用 `APP_BASE_PATH=/hub`。

## 平台规划

### 访问地址

Hub 管理界面和业务应用可以共用一个域名，通过不同路径访问：

| 地址示例                        | 用途                     |
| ------------------------------- | ------------------------ |
| `https://apps.example.com/hub/` | 登录 Hub，管理应用和部署 |
| `https://apps.example.com/crm/` | 访问 CRM 业务应用        |

本页将 Hub 的 `APP_BASE_PATH` 设置为 `/hub`，业务应用使用其他路径。反向代理将该域名的请求统一转发到 Hub 的监听端口，由 Hub 转发到对应应用，无需为每个业务应用单独开放端口。具体配置见[配置访问与首次登录](#配置访问与首次登录)。

### 数据目录

Hub 需要一个持久目录，保存平台管理数据、上传的应用部署包、各应用的运行配置、文件和日志。使用默认 SQLite 配置时，Hub 和业务应用的数据库文件也保存在该目录下。

通过 `APP_STORAGE_DIR` 指定目录，例如 `/srv/nocobase/hub/storage`。更新 Hub 时保留该目录；使用 Docker 时，将它挂载到容器外的持久存储。各部署方式的具体设置见下文。

如果使用外部数据库或对象存储，这些数据保存在对应服务中，需要另外纳入备份，参阅[备份恢复与排障](./operations)。

### 运行环境

业务应用包含原生模块，构建时通过 `--target` 和 `--node-version` 指定平台、libc 和 Node 大版本。这些参数要匹配 **Hub 进程实际运行的环境**，而不是服务器本身。使用 Docker 部署时，Hub 运行在容器内，宿主机安装的 Node 版本、宿主机是不是 Alpine，都不影响构建参数。

| 部署方式 | 平台       | libc                              | Node 大版本            | 架构                             |
| -------- | ---------- | --------------------------------- | ---------------------- | -------------------------------- |
| Docker   | `linux`    | glibc（镜像基于 Debian bookworm） | 24                     | 取决于所用镜像，通常与服务器一致 |
| 安装器   | 服务器决定 | 服务器决定                        | 服务器上的 Node 大版本 | 服务器决定                       |
| 应用模板 | 服务器决定 | 服务器决定                        | 环境要求为 24          | 服务器决定                       |

应用模板方式在运行 Hub 的服务器上执行以下命令确认：

```bash
uname -sm
node -p "process.versions.node + ' ABI ' + process.versions.modules"
ldd --version 2>&1 | head -1   # 输出包含 musl 时为 Alpine 一类环境
```

发布业务应用时如何使用这些值，见[使用 Hub 发布应用](./hub-publishing)。

## 通过 Docker 部署

以下步骤使用 Docker Compose，默认数据库为 SQLite。示例通过同机反向代理提供 HTTPS 访问。

### 1. 准备部署目录和镜像

在服务器上创建 Hub 专用目录，后续命令均在该目录执行：

```bash
mkdir -p hub
cd hub
mkdir -p storage
```

Hub 镜像由 beta 发布流程推送到以下两个仓库，支持 Linux amd64 和 arm64。

| 镜像仓库                  | 镜像名称                                        |
| ------------------------- | ----------------------------------------------- |
| GitHub Container Registry | `ghcr.io/nocobase/hub`                          |
| 阿里云镜像仓库            | `registry.cn-beijing.aliyuncs.com/nocobase/hub` |

每次发布推送两个标签：发布流程指定的标签（beta 发布使用 `latest`）和形如 `run-<运行ID>-<尝试号>` 的固定标签。使用前先在镜像仓库中确认标签确实存在；发布流程的配置本身不代表某个标签已经推送。首次试用可将下方 `YOUR_VERSION` 替换为 `latest`；固定部署版本时，使用仓库中实际存在的 `run-` 标签或镜像 digest。镜像不打 npm 包版本号标签，不要直接把 npm 版本当作镜像标签。

```bash
hub_image=ghcr.io/nocobase/hub:YOUR_VERSION
docker pull "$hub_image"
```

在部署目录创建 `.env`，填写相同的镜像名称和版本，供 Compose 读取（镜像 digest 使用 `镜像名@sha256:...` 格式）：

```dotenv
HUB_IMAGE=ghcr.io/nocobase/hub:YOUR_VERSION
```

### 2. 准备运行配置

首次部署时，从选定镜像提取配置模板：

```bash
docker run --rm --entrypoint cat "$hub_image" /app/config.example.yml > config.example.yml
test -s config.example.yml && { test -e config.yml || cp config.example.yml config.yml; }
```

编辑 `config.yml`，保留模板中的其他配置，修改以下字段：

| 配置项                               | 设置                                                                                                                         |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `auth.secret`                        | 运行 `openssl rand -hex 32` 生成随机值，替换占位值                                                                           |
| `session.secret`                     | 同样生成随机值并替换占位值                                                                                                   |
| `database.connections.main.database` | 使用 SQLite 时保留模板值 `hub/database/main.sqlite`，相对路径按持久目录解析，等价于容器内的 `/data/hub/database/main.sqlite` |

首次启动前，按[配置初始管理员](./configuration#配置初始管理员)设置 `users.initialAdmin` 中的用户名、邮箱和密码。

`database` 中的相对路径按 `APP_STORAGE_DIR` 解析，下一步将它设为 `/data`，并把服务器上的 `storage` 挂载到该位置，Hub 数据库和托管应用数据将保存在该持久目录中。写绝对路径时必须使用容器内路径。官方镜像只内置 SQLite 驱动。使用其他数据库时，按[数据库配置](./configuration#配置数据库)填写连接信息，并自行构建包含对应驱动的镜像——驱动要在构建前进入应用的 `dependencies`，镜像构建完成后无法补装。

镜像以 `node` 用户运行。可用以下命令确认 UID 和 GID，并为该用户设置 `config.yml` 的读取权限及 `storage` 的写入权限：

```bash
docker run --rm --entrypoint id "$hub_image"
```

### 3. 创建 Compose 配置

在部署目录创建 `compose.yml`：

```yaml
services:
  hub:
    image: ${HUB_IMAGE:?Set HUB_IMAGE to a verified image tag or digest}
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

按实际环境修改：

| 位置                | 说明                                                                  |
| ------------------- | --------------------------------------------------------------------- |
| `APP_PUBLIC_ORIGIN` | 替换为正式访问的协议和域名，不包含 `/hub`                             |
| `ports`             | 左侧 `13000` 为宿主机端口，已被占用时更换；示例仅允许本机反向代理连接 |
| `./config.yml`      | 实际运行配置，以只读方式挂载到容器                                    |
| `./storage`         | 持久数据目录，更新或重建容器时保留                                    |

完成后的目录结构：

```text
hub/
├── .env
├── compose.yml
├── config.example.yml
├── config.yml
└── storage/
```

### 4. 启动并检查

```bash
unset HUB_IMAGE
docker compose config --quiet
docker compose up -d
docker compose ps
docker compose logs --tail=100 hub
```

`unset HUB_IMAGE` 清除终端中的同名变量，使 Compose 使用 `.env` 中的镜像设置。确认容器运行正常，日志中没有配置、数据库连接或目录权限错误。随后按[配置访问与首次登录](#配置访问与首次登录)配置 HTTPS 并登录 Hub。

更新 `config.yml` 后执行 `docker compose up -d --force-recreate hub`，确保文件挂载读取到最新内容；修改镜像、端口或 Compose 环境变量后执行 `docker compose up -d`。这些操作都会重启 Hub 及其管理的应用。

## 通过安装器部署

不修改 Hub 源码、也不使用 Docker 时，用 `@nocobase/app-installer` 的 `--template hub` 在服务器上安装 Hub，以后的升级和回退也用它完成。它从已发布的 Hub 模板生成项目，在服务器上构建后只保留部署包，用 pm2 运行 Hub。修改过源码的 Hub 是一个普通的应用项目，在构建机上打成部署包后用 `--archive` 安装，做法见[独立部署：app-installer](./app-installer)。

### 环境要求

- Linux 或 macOS；Windows 请使用 WSL。
- Node.js 24 及以上、pnpm 11 及以上。
- 全局安装的 pm2，版本 4.3 及以上：`npm install -g pm2`。不要使用 `npx` 临时下载的 pm2，因为 `pm2 startup` 生成的开机服务会写死 pm2 的路径。

### 1. 安装 Hub

NocoBase 3 的包目前发布在 `https://npm.nocobase.ai`，不在公共 npm 上，所以要用 `--registry` 指定：

```bash
npx --registry=https://npm.nocobase.ai @nocobase/app-installer install /srv/nocobase/hub --template hub --origin https://apps.example.com
```

目标目录必须不存在或为空。`--template hub` 安装最新版本，指定版本时写成 `--template hub@<版本>`。`--origin` 是对外访问的协议和域名，不包含 `/hub`。命令先检查端口是否空闲、pm2 进程名是否已被占用，再依次解析版本、在服务器上构建、生成 `config.yml` 和 `app.env`、执行数据库迁移，最后用 pm2 启动 Hub，等到健康检查通过才结束，整个过程需要几分钟。Hub 启动之前的任何一步失败，安装器都会删除它写入的文件，重新执行即可。

默认监听 `127.0.0.1:13000`，使用 SQLite，pm2 进程名为 `nocobase-` 加目录名，本例为 `nocobase-hub`。使用其他数据库时，用 `--dialect` 指定方言，用 `--set` 设置连接参数，密码先放进环境变量，再用 `--set-from-env` 读取，例如 `--set-from-env database.connections.main.password=HUB_DB_PASSWORD`。全部参数和错误码见 `--help` 或[安装器的 README](https://github.com/nocobase/nocobase3/blob/develop/packages/tools/app-installer/README.md)。

安装完成后的目录：

| 路径                              | 内容                                                                         |
| --------------------------------- | ---------------------------------------------------------------------------- |
| `config.yml`、`app.env`           | 运行配置和环境变量，所有版本共用，升级时不动                                 |
| `storage/`                        | `APP_STORAGE_DIR` 指向的持久目录：Hub 的数据库、上传的部署包和托管应用的数据 |
| `releases/<版本>_<构建时间>/app/` | 每次构建的产物，只有 `dist/` 和 `config.example.yml`                         |
| `current`                         | 指向正在运行的版本                                                           |
| `backups/`                        | 每次升级前备份的数据库和配置                                                 |
| `logs/`                           | pm2 收集的输出日志 `app.out.log` 和 `app.err.log`                            |
| `ecosystem.config.cjs`            | pm2 的进程配置，每次启动都经过它                                             |
| `launcher.mjs`                    | pm2 运行的启动脚本，每次启动都读取 `app.env`，启动 `current` 指向的版本      |
| `installer.json`                  | 安装器的记录：应用、挂载路径、来源、已有版本和操作历史                       |

### 2. 设置开机自启

执行 `pm2 startup`，再用 sudo 执行它输出的那条命令，服务器重启后 pm2 会自动拉起 Hub。随后按[配置访问与首次登录](#配置访问与首次登录)配置 HTTPS 并登录 Hub。

### 3. 升级、回退与查看状态

```bash
npx --registry=https://npm.nocobase.ai @nocobase/app-installer upgrade --dir /srv/nocobase/hub
```

升级默认升到最新版本，也可以用 `--to` 指定版本，但不能低于当前版本，退回旧版本用 `rollback`。每次构建都是一个独立版本，按版本号和 UTC 构建时间命名，例如 `0.3.0_20260927T005500Z`。新版本在旧版本继续服务的同时构建，并用新版本检查现有配置和待执行的迁移；之后才开始停机：停止 Hub，把 SQLite 数据库、`config.yml` 和 `app.env` 备份到 `backups/`，切换版本，执行迁移，启动新版本并做健康检查。迁移或启动失败时，安装器会自动回退到旧版本，必要时恢复数据库。停机期间 Hub 托管的应用都不可用，进行中的部署会被标记为失败。使用外部数据库时，安装器无法备份，需要先自行备份，再加 `--backup-done`。服务器换了 Node 大版本、而 Hub 已经是最新版本时，用 `upgrade --dir /srv/nocobase/hub --rebuild` 为当前机器重新构建已安装的版本，流程和升级相同。

`rollback --dir /srv/nocobase/hub` 回到上一次升级前的版本，也可以用 `--to` 指定磁盘上保留的某个版本或版本 ID；如果被撤销的那次升级执行过迁移，会用升级前的备份恢复 SQLite 数据库，升级之后写入 Hub 的数据会丢失。`status --dir /srv/nocobase/hub` 只读，显示当前版本及构建时间、访问地址和监听地址、健康状态、pm2 进程、磁盘上的版本和是否有可用更新。

要更换访问域名或端口，修改 `app.env` 中的 `APP_PUBLIC_ORIGIN`、`APP_SERVER_HOST` 和 `APP_SERVER_PORT`，再执行 `pm2 restart nocobase-hub`；安装时用 `--name` 指定过进程名的，换成那个名字。新端口必须空闲，反向代理也要改为转发到新端口。

## 通过应用模板部署

使用 Hub 模板创建独立应用项目，在目标服务器上构建并运行。此方式获取完整的 Hub 项目源码，无需克隆 NocoBase 源码仓库。

### 环境要求

- Node.js 24。
- 项目 `packageManager` 指定版本的 pnpm。
- 可访问 NocoBase npm registry：`https://npm.nocobase.ai`。
- 可写的持久目录，用于保存 Hub 数据库、应用制品、配置和文件。

### 1. 创建项目

在目标服务器的项目存放目录执行：

```bash
npm_config_registry=https://npm.nocobase.ai \
pnpm create @nocobase/app hub --template=hub
cd hub
```

创建命令会下载 Hub 模板、安装依赖，并生成 `.env`。它不生成 `config.yml`——在应用目录里运行 `pnpm nocobase config init` 来生成，其中包含随机认证与会话密钥，默认主数据库为 SQLite。

使用其他主数据库时，先安装驱动再配置，例如 `pnpm add @nocobase/db-postgres` 后运行 `pnpm nocobase config init --dialect postgres`。固定版本时，将创建命令中的包名改为 `@nocobase/app@<CREATE_APP_VERSION>`，模板改为 `--template @nocobase/app-template-hub@<HUB_TEMPLATE_VERSION>`，替换为实际发布版本。

### 2. 配置运行环境

编辑项目根目录的 `config.yml`，确认数据库连接信息，设置初始管理员用户名和密码，并保留已生成的密钥。字段说明见[运行配置](./configuration)。

在项目根目录的 `.env` 中设置以下参数，保留文件中的其他配置：

```dotenv
APP_BASE_PATH=/hub
APP_PUBLIC_ORIGIN=https://apps.example.com
APP_SERVER_HOST=127.0.0.1
APP_SERVER_PORT=13000
APP_STORAGE_DIR=/srv/nocobase/hub/storage
```

| 参数                                  | 说明                                     |
| ------------------------------------- | ---------------------------------------- |
| `APP_BASE_PATH`                       | Hub 管理平台路径，与业务应用路径分开     |
| `APP_PUBLIC_ORIGIN`                   | 对外访问的协议和域名，不包含 `/hub`      |
| `APP_SERVER_HOST` / `APP_SERVER_PORT` | Hub 监听地址；示例由同机反向代理转发请求 |
| `APP_STORAGE_DIR`                     | 持久目录的绝对路径，运行账号需具备写权限 |

默认 SQLite 数据库位于 `APP_STORAGE_DIR` 下的 `hub/database/main.sqlite`。同一持久目录还保存 Release、业务应用数据卷和日志，更新项目时应保留。

### 3. 构建应用

在 Hub 项目根目录执行：

```bash
pnpm build
```

构建产物输出到 `dist`，包含前端资源、服务端代码和生产依赖。默认构建目标为当前机器；已有项目更新依赖后，应先按锁文件执行 `pnpm install --frozen-lockfile`。

### 4. 启动服务

在同一项目目录执行：

```bash
pnpm start
```

该命令启动生产构建，并加载项目的运行配置。随后按[配置访问与首次登录](#配置访问与首次登录)配置 HTTPS 并完成登录检查。

长期运行可使用 systemd 管理进程。参照[服务配置示例](./standalone#直接使用-nodejs)，将服务名和项目路径替换为 Hub 的实际值，并保持上述环境参数一致。交由服务管理器启动前，先停止前台进程。

如需在其他机器构建，可按[打包和运行](./standalone#构建部署包)生成部署包，并在目标服务器启动；Hub 构建时使用 `APP_BASE_PATH=/hub`。

## 配置访问与首次登录

### 1. 配置域名和 HTTPS

将域名解析到部署服务器，并按[HTTPS 与反向代理](./configuration#https-与反向代理)配置证书和转发。使用本页默认端口时，代理目标为 `http://127.0.0.1:13000`。

反向代理使用 `location /`，将域名下的请求统一转发到 Hub。这样 `/hub/` 管理平台和 `/crm/` 等业务应用都能通过同一入口访问。

在 Nginx 的对应 `server` 配置中增加上传大小设置：

```nginx
client_max_body_size 260m;
```

Hub 允许上传最大 256 MiB 的 Release 压缩包，这里为发布请求中的附加配置预留空间。执行 `nginx -t` 检查配置，通过后重新加载 Nginx。

### 2. 首次登录

打开 `https://apps.example.com/hub/`，使用运行配置中 `users.initialAdmin` 设置的用户名和密码登录。未修改默认配置时：

| 项目   | 默认值               |
| ------ | -------------------- |
| 用户名 | `nocobase`           |
| 邮箱   | `admin@nocobase.com` |
| 密码   | `admin123`           |

用户名和邮箱均可登录。使用默认密码时，首次登录后请修改密码。

![首次登录后的 Hub 控制台，应用列表为空](https://static-docs.nocobase.com/20260921171832.png)

已完成初始化的 Hub 使用已有管理员账号；修改 `users.initialAdmin` 不会重置账号或密码。

## Hub 升级

Hub 升级会重启其管理的应用，应安排在允许业务中断的时间进行。

### 升级前准备

确认没有正在执行或等待执行的应用部署任务，并备份 Hub 配置、数据库和持久目录。使用外部数据库或对象存储时，也需备份对应数据，具体范围见[备份恢复与排障](./operations)。

查看目标版本的升级说明，确认是否需要调整配置或执行数据库迁移。保留当前版本的镜像或构建产物。

### 更新 Hub

| 部署方式 | 操作                                                                          |
| -------- | ----------------------------------------------------------------------------- |
| Docker   | 将 `.env` 中的 `HUB_IMAGE` 更新为目标版本，执行下方命令                       |
| 安装器   | 执行 `app-installer upgrade`，见[升级、回退与查看状态](#3-升级回退与查看状态) |
| 应用模板 | 在更新后的 Hub 项目中安装对应依赖并重新构建，停止旧服务后使用新构建启动       |

Docker 部署在 `compose.yml` 所在目录执行：

```bash
unset HUB_IMAGE
docker compose pull hub
docker compose up -d hub
docker compose logs --tail=100 hub
```

三种方式都保留原有运行配置、密钥和持久目录。Hub 平台升级与业务应用版本发布分别管理；更新 Hub 不会自动为业务应用发布新版本。

### 升级后检查

登录 Hub，确认应用列表和运行状态正常，并访问业务应用检查功能。如果升级中断了应用部署任务，该任务会标记为失败；检查部署记录后再重新发起。

确认 Hub 的 Node 大版本是否发生变化，变化时[运行环境](#运行环境)一节中的构建参数随之改变。已发布的业务应用需要按新的 `--node-version` 重新构建并重新发布；沿用原参数构建的部署包仍可上传和部署，但应用启动时会因原生模块 ABI 不匹配而失败。

若需回退，先确认旧版本是否兼容升级后的数据库。涉及不兼容的数据库变更时，应按备份恢复流程处理，不能仅切回旧镜像或旧构建。

## 下一步

平台就绪后，按[使用 Hub 发布应用](./hub-publishing)发布业务应用。平台维护见[备份恢复与排障](./operations)。
