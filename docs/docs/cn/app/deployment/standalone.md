---
title: 独立部署：打包和运行
description: 不使用 Hub，构建部署包并在服务器独立运行应用。
---

# 独立部署：打包和运行

本页介绍不使用 Hub 的 Node.js 部署流程。容器路线在完成构建后转到[用 Docker 部署](./docker)，平台托管路线见 [Hub](./hub)。

不想手工解压部署包、维护进程和备份时，可以改用 [app-installer](./app-installer)：它把同一个部署包安装到服务器，用 pm2 运行，并负责升级前备份、升级和回退。本页的构建步骤同样适用，服务器上的步骤由安装器完成。

## 环境与目录准备

构建与运行采用 Node.js 24；构建工具版本参照项目 `packageManager`。本文采用 Linux x64、glibc；ARM64 选 `linux-arm64`，Alpine 等 musl 环境必须选择对应目标并核验原生依赖。

构建参数需要服务器的 CPU 架构、Node 大版本及 libc，在目标服务器上执行以下命令确认：

```bash
uname -sm
node -p "process.versions.node + ' ABI ' + process.versions.modules"
ldd --version 2>&1 | head -1   # 输出包含 musl 时为 Alpine 一类环境
```

区分三类内容：`dist` 是可替换代码，`config.yml` 是目标环境配置，`storage` 是需要保留的数据库、上传文件和日志等数据；默认会话保存在内存中，重启后需要重新登录。本文使用固定部署根目录，升级时仅替换 `dist`，不覆盖配置和 storage。

```text
/srv/nocobase/crm/
  dist/                  当前运行代码及生产依赖
  config.example.yml     当前版本的配置参考
  config.yml             实际运行配置
  storage/               持久数据
  releases/              保留的部署包，版本名称由运维指定
```

先创建 `/srv/nocobase/crm` 和专用服务账号。服务账号需要读取 `dist`、`config.yml`，并写入 `storage`。以下解压步骤应以该账号执行；若由管理员代为执行，需将配置文件和持久目录的所有权交给服务账号。

## 构建部署包

以下命令在业务应用源码根目录执行，不是在 NocoBase monorepo 根目录执行。依赖安装使用项目锁文件和对应 pnpm 版本。

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm lint
APP_BASE_PATH=/crm pnpm build --target linux-x64 --node-version 24 --tar
tar -tzf storage/exports/dist.tar.gz | head -30
```

产物为 `storage/exports/dist.tar.gz`，包含 `dist/` 和 `config.example.yml`，其中 dist 带有生产依赖。真实配置和本地业务数据不应加入制品；注意 `pnpm build` 会把项目 `.env` 中白名单键（如 `DB_PASSWORD`、`APP_BASE_PATH`）写入 `dist/.env` 随制品发布，构建前确认其中没有不该带到生产环境的值。不能把 macOS 下默认构建的原生依赖直接用于 Linux。构建时明确挂载路径，并在运行时保持一致；路径变化后重新构建并检查静态资源。

## 直接使用 Node.js

**首次安装。** 将部署包传到服务器，在尚未安装应用的 `/srv/nocobase/crm` 中解压。以下是首次安装步骤，已有运行版本应使用[更新与版本恢复](./standalone#更新与版本恢复)。

```bash
cd /srv/nocobase/crm
tar -xzf /path/to/dist.tar.gz
test -f config.yml || cp config.example.yml config.yml
mkdir -p storage
chmod 600 config.yml
```

保留模板的功能配置，修改数据库与密钥，并在首次启动前设置[初始管理员](./configuration#配置初始管理员)。分别执行 `openssl rand -hex 32` 生成两个随机值，填入 `auth.secret` 和 `session.secret`，不要保留模板占位值。下面是需要合入实际配置的关键部分，不是完整模板：

```yaml
auth:
  secret: REPLACE_WITH_GENERATED_AUTH_SECRET
session:
  secret: REPLACE_WITH_GENERATED_SESSION_SECRET
database:
  default: main
  connections:
    main:
      dialect: sqlite
      database: /srv/nocobase/crm/storage/database.sqlite
      schemaManagement: managed
      migrations:
        autoRun: true
      seeds:
        autoRun: true
```

SQLite 使用 `database` 指定文件路径。若使用 PostgreSQL、MySQL 等数据库，还需确认构建产物具有相应驱动，配置真实连接信息，并验证连通性；驱动要求见[运行配置](./configuration#连接前检查)。需要控制发布迁移时机时，关闭相应自动执行选项，由发布人员执行迁移。

**前台验证启动。** 在部署根目录执行：

```bash
NODE_ENV=production \
APP_CONFIG_FILE=/srv/nocobase/crm/config.yml \
APP_BASE_PATH=/crm \
APP_PUBLIC_ORIGIN=https://apps.example.com \
APP_SERVER_HOST=127.0.0.1 \
APP_SERVER_PORT=13000 \
node ./dist/server/standalone.js
```

`APP_PUBLIC_ORIGIN` 不带 `/crm`；挂载路径由 `APP_BASE_PATH` 指定。访问 `http://127.0.0.1:13000/crm/api/healthz`，返回的 JSON 中 `ok` 为 `true` 表示应用就绪，其余字段为应用名称和挂载路径；浏览器登录需通过 localhost 或 HTTPS，生产模式下会话 Cookie 带 `Secure` 标记。检查实际页面与日志后停止前台进程，再交给服务管理器，避免启动两个应用处理同一份数据。

**长期运行。** Linux systemd 示例：将以下内容作为 `/etc/systemd/system/nocobase-crm.service`，账号 `nocobase` 必须已创建，并将 Node 路径替换成服务器 `command -v node` 的实际结果。

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

`NOCOBASE_STRICT_STARTUP=true` 让应用在启动失败时以非零状态退出，`Restart=on-failure` 才会真正重启它。由管理员执行 `systemctl daemon-reload` 和 `systemctl enable --now nocobase-crm`。检查 `systemctl status nocobase-crm` 与 `journalctl -u nocobase-crm`。重启使用 `systemctl restart nocobase-crm`。

**使用 pm2 运行。** 不使用 systemd 时，可以用 [pm2](https://pm2.keymetrics.io/) 管理进程。应用项目根目录自带 `ecosystem.config.js`，它让 pm2 直接执行 `node ./dist/server/standalone.js`（`interpreter: 'none'`）并设置 `NODE_ENV=production`。不要改成把 `script` 指向 `standalone.js`：pm2 默认会用自己的包装脚本加载它，`standalone.js` 判断自己不是主模块，就不会启动服务，而 pm2 仍显示进程在线。该文件不在部署包内，需要从项目复制到部署根目录，与 `dist` 并列。其余运行参数通过环境变量传入，或补充到文件的 `env` 中。文件里设置了 `cwd: import.meta.dirname`，相对路径按文件所在目录解析，所以可以在任意目录下用文件的完整路径启动，下面的示例在部署根目录执行：

```bash
APP_CONFIG_FILE=/srv/nocobase/crm/config.yml \
APP_BASE_PATH=/crm \
APP_PUBLIC_ORIGIN=https://apps.example.com \
APP_SERVER_HOST=127.0.0.1 \
APP_SERVER_PORT=13000 \
pm2 start ecosystem.config.js
pm2 save
```

进程名默认是 `nocobase-` 加上应用的包名（去掉 scope），从项目根目录的 `package.json` 读取，在部署根目录则读 `dist/package.json`；设置环境变量 `APP_PM2_NAME` 可以换成别的名字。同一台机器上的两个应用必须用不同的进程名，否则第二个 `pm2 start` 会重启第一个。该文件是 ES 模块，若 pm2 在没有 `package.json` 的部署根目录加载它时报语法错误，将其重命名为 `ecosystem.config.mjs`。使用 `pm2 restart <name>` 重启，`pm2 logs <name>` 查看日志，`pm2 startup` 生成开机自启命令。

## 配置 HTTPS

完成前台启动后，按[HTTPS 与反向代理](./configuration#https-与反向代理)配置域名、证书和转发，再执行以下验收。

## 初始化与验收

打开 `https://apps.example.com/crm/`，使用[初始管理员配置](./configuration#配置初始管理员)中的用户名和密码登录。未修改默认配置时，用户名为 `nocobase`、密码为 `admin123`；也可使用配置中的邮箱登录，默认为 `admin@nocobase.com`。使用默认密码时，首次登录后立即修改，再开放正式访问。已有应用使用原账号，修改初始化配置不会重置密码；定制初始化任务以实际项目为准。

先请求 `https://apps.example.com/crm/api/healthz`，返回的 JSON 中 `ok` 为 `true` 表示应用已就绪，该地址也可作为服务管理器或负载均衡的健康检查。随后验证登录、退出、页面刷新、静态资源、API、实时连接及实际业务操作。创建一条测试记录并上传文件，重启服务后确认仍存在。确认外部回调和通知链接使用正确域名及挂载路径。

## 更新与版本恢复

先在构建环境生成新包，检查迁移兼容性，备份数据库、文件和配置。在新临时目录解包并核对，保留旧包。安排维护窗口，停止应用，将旧 dist 移至保留目录，再把新 dist 放入原部署根目录；保留原 config.yml 和 storage。按新模板审阅必要配置差异，不直接覆盖真实配置。启动后重复[初始化与验收](./standalone#初始化与验收)。

Docker 路线使用新镜像标签，备份后更新 compose 的 image，再执行 `docker compose up -d`，保留原挂载。验收失败时，只有数据库仍与旧代码兼容才能直接退回旧镜像或 dist；否则按[备份与灾难恢复](./operations#备份与灾难恢复)配套恢复。

## 排障与运维

启动或更新失败时，参阅[备份恢复与排障](./operations)。

## 进阶：不接 Hub 的 App Host

App Host 还支持 standalone 模式，从本地应用目录发现构建产物并按路径挂载应用，默认按需激活。它与[独立应用部署](./standalone)不同，也不提供 Hub 的完整管理页面和发布流程。采用这一模式时需自行管理目录、制品、配置与恢复，参阅仓库 `packages/app/app-host/README.md`。
