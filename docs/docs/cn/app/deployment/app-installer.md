---
title: 独立部署：app-installer
description: 用 app-installer 把部署包安装到服务器，由 pm2 运行，并完成升级、回退和状态检查。
---

# 独立部署：app-installer

`@nocobase/app-installer` 把在构建机上打好的部署包安装到服务器，用 pm2 运行，之后的升级、回退和状态检查也由它完成。适合不使用 Hub、也没有容器平台，又不想手工解压部署包、维护进程配置和备份的情况。手工运行部署包见[打包和运行](./standalone)，容器部署见 [Docker](./docker)，由平台统一管理多个应用的发布见[部署 Hub 平台](./hub)。

## 构建机与服务器

部署分在两个环境完成：

| 环境   | 需要                                                                    | 做什么                        |
| ------ | ----------------------------------------------------------------------- | ----------------------------- |
| 构建机 | 应用源码、Node.js 24、项目 `packageManager` 指定版本的 pnpm             | 构建部署包，可以是开发机或 CI |
| 服务器 | Linux 或 macOS（Windows 请使用 WSL）、Node.js 24 及以上、全局安装的 pm2 | 安装、运行、升级和回退        |

服务器上不需要源码、pnpm 或 `tar`。pm2 版本需为 4.3 及以上，用 `npm install -g pm2` 全局安装；不要使用 `npx` 临时下载的 pm2，因为 `pm2 startup` 生成的开机服务会写死 pm2 的路径。

## 1. 构建部署包

在构建机的应用项目根目录执行，然后把部署包复制到服务器：

```bash
APP_BASE_PATH=/crm pnpm build --target linux-x64 --node-version 24 --tar
scp storage/exports/dist.tar.gz user@server:/tmp/crm.tar.gz
```

- **构建目标**：`--target` 和 `--node-version` 要与服务器一致，原生模块只能在构建时指定的平台、架构、libc 和 Node 大版本上加载。确认方法见[环境与目录准备](./standalone#环境与目录准备)。安装器会拒绝为其他环境构建的部署包，并给出应使用的构建命令。
- **挂载路径**：`APP_BASE_PATH` 会编译进前端，省略时为 `/main`。部署包记录了这个路径，安装器就在该路径下提供应用；以后要换路径，需要重新构建并安装到新目录。
- **数据库驱动**：使用 SQLite 以外的数据库时，构建前先把驱动加入项目，例如 `pnpm add @nocobase/db-postgres`。部署包只带构建时已有的驱动。
- **版本要求**：部署包会在 `dist/package.json` 中记录挂载路径和构建时间。较旧的 `@nocobase/app-cli` 构建的部署包没有这些信息，安装器会以 `ARCHIVE_TOO_OLD` 拒绝；`@nocobase/app-server` 早于 `APP_STORAGE_DIR` 的版本会把数据写进版本目录，安装器以 `STORAGE_IN_RELEASE` 拒绝。遇到这两种情况，在项目中升级对应的包后重新构建。

## 2. 安装应用

NocoBase 3 的包目前发布在 `https://npm.nocobase.ai`，不在公共 npm 上，所以要用 `--registry` 指定。在服务器上执行：

```bash
npx --registry=https://npm.nocobase.ai @nocobase/app-installer install /srv/nocobase/crm --archive /tmp/crm.tar.gz --origin https://apps.example.com
```

目标目录必须不存在或为空。`--origin` 是对外访问的协议和域名，不包含 `/crm`。默认监听 `127.0.0.1:13000`，使用 SQLite，pm2 进程名为 `nocobase-` 加目录名，本例为 `nocobase-crm`。由脚本或 Agent 执行时，在 `--registry` 前加 `--yes`，跳过 npx 自身的安装确认。

命令依次完成：

1. **预检**：写入任何文件之前，确认端口空闲（被占用时给出一个可用端口）、pm2 进程名没有被其他进程占用、`--set-from-env` 引用的环境变量都已设置。
2. **解压**：把部署包解压到 `releases/<版本>_<构建时间>/app`，检查它是为本机构建的。
3. **写配置**：生成带随机密钥的 `config.yml` 和记录运行参数的 `app.env`。
4. **迁移**：执行数据库迁移。
5. **启动**：让 `current` 指向新版本，用 pm2 启动应用，等到健康检查通过才结束。

应用启动之前的任何一步失败，安装器都会删除它写入的文件，重新执行即可。

使用其他数据库时，用 `--dialect` 指定方言，用 `--set` 设置连接参数。密码先放进环境变量，再用 `--set-from-env` 读取；用 `--set` 传入的值在命令运行期间能被其他用户从进程列表看到：

```bash
CRM_DB_PASSWORD=... npx --registry=https://npm.nocobase.ai @nocobase/app-installer install /srv/nocobase/crm \
  --archive /tmp/crm.tar.gz --origin https://apps.example.com --dialect postgres \
  --set database.connections.main.host=db.internal \
  --set database.connections.main.username=crm \
  --set-from-env database.connections.main.password=CRM_DB_PASSWORD
```

## 3. 安装之后

- **开机自启**：执行 `pm2 startup`，再用 sudo 执行它输出的那条命令，服务器重启后 pm2 会自动拉起应用。
- **反向代理**：按[HTTPS 与反向代理](./configuration#https-与反向代理)配置域名、证书，把请求转发到 `http://127.0.0.1:13000`。
- **首次登录**：打开 `https://apps.example.com/crm/`，使用 `config.yml` 中 `users.initialAdmin` 的账号登录。未修改时用户名为 `nocobase`、密码为 `admin123`，登录后立即修改密码。安装结果中的 `initialAdmin` 显示该账号的用户名和邮箱，`defaultPassword` 表示密码是否仍是模板默认值。随后按[初始化与验收](./standalone#初始化与验收)检查应用。

查看日志用 `pm2 logs nocobase-crm`，或直接读 `logs/app.out.log` 和 `logs/app.err.log`。

## 同一台服务器上的多个应用

每个应用单独安装一次，各自使用自己的目录、端口和 pm2 进程名；进程名默认取自目录名，目录不同就不会冲突。构建时为每个应用指定不同的 `APP_BASE_PATH`：

```bash
npx --registry=https://npm.nocobase.ai @nocobase/app-installer install /srv/nocobase/crm --archive /tmp/crm.tar.gz --origin https://apps.example.com --port 13000
npx --registry=https://npm.nocobase.ai @nocobase/app-installer install /srv/nocobase/erp --archive /tmp/erp.tar.gz --origin https://apps.example.com --port 13001
```

反向代理按路径或域名把请求分给各自的端口。共用一个域名时，每个应用一个 `location`，`proxy_pass` 同样不追加路径，其余转发头与[HTTPS 与反向代理](./configuration#https-与反向代理)中的示例相同：

```nginx
location /crm/ {
    proxy_pass http://127.0.0.1:13000;
}
location /erp/ {
    proxy_pass http://127.0.0.1:13001;
}
```

## 目录结构

| 路径                              | 内容                                                                    |
| --------------------------------- | ----------------------------------------------------------------------- |
| `app.env`                         | 运行参数，pm2 和每个安装器命令都读取它                                  |
| `config.yml`                      | 运行配置，所有版本共用，升级时不动                                      |
| `storage/`                        | `APP_STORAGE_DIR` 指向的持久目录：数据库、上传文件和应用的其他数据      |
| `logs/`                           | pm2 收集的 `app.out.log` 和 `app.err.log`                               |
| `releases/<版本>_<构建时间>/app/` | 每个版本的 `dist/` 和 `config.example.yml`                              |
| `current`                         | 指向正在运行的版本                                                      |
| `backups/`                        | 每次升级前备份的数据库和配置                                            |
| `ecosystem.config.cjs`            | pm2 的进程配置，每次启动都经过它                                        |
| `launcher.mjs`                    | pm2 运行的启动脚本，每次启动都读取 `app.env`，启动 `current` 指向的版本 |
| `installer.json`                  | 安装器的记录：应用、挂载路径、来源、已有版本和操作历史                  |

## 升级

在构建机上构建新的部署包并复制到服务器，然后执行：

```bash
npx --registry=https://npm.nocobase.ai @nocobase/app-installer upgrade --dir /srv/nocobase/crm --archive /tmp/crm.tar.gz
```

新部署包必须是同一个应用、使用同一个挂载路径，版本不能低于当前版本；退回旧版本用 `rollback`。每次构建都是一个独立版本，按版本号和 UTC 构建时间命名，例如 `0.3.0_20260927T005500Z`，所以不改版本号重新部署也算一次升级。

新版本在旧版本继续服务的同时解压，并用新版本检查配置、统计待执行的迁移；之后才开始停机：停止应用，把 `config.yml` 声明的所有 SQLite 数据库以及 `config.yml`、`app.env` 备份到 `backups/`，切换 `current`，执行迁移，启动新版本并做健康检查。迁移或启动失败时，安装器自动回到旧版本，必要时恢复数据库。

- **外部数据库**：安装器无法备份，需要先自行备份，再加 `--backup-done`。
- **确认**：命令会先说明将要执行的操作并请求确认；由脚本执行时加 `--yes`。
- **保留版本**：磁盘上默认保留 3 个版本，用 `--keep` 调整。升级前的备份不会自动清理，也不包含上传文件，不能代替对 `storage/` 的定期备份。
- **Node 大版本变化**：服务器换了 Node 大版本后，已有版本的原生模块无法加载，`status` 会提示。用新的 `--node-version` 重新构建部署包并升级。

## 回退

```bash
npx --registry=https://npm.nocobase.ai @nocobase/app-installer rollback --dir /srv/nocobase/crm
```

回到上一次升级前的版本，也可以用 `--to` 指定磁盘上保留的某个版本 ID 或版本号。如果被撤销的那次升级执行过迁移，会用升级前的备份恢复 SQLite 数据库，升级之后写入的数据会丢失；加 `--no-restore` 则保留当前数据库。外部数据库不在备份中，需要用自己的备份恢复。回退不会反向执行迁移。

升级或回退在应用停止期间被中断时，`installer.json` 会记录下来：`status` 给出警告，`upgrade` 拒绝执行，执行 `rollback` 即可恢复。

## 查看状态与修改访问地址

```bash
npx --registry=https://npm.nocobase.ai @nocobase/app-installer status --dir /srv/nocobase/crm
```

`status` 只读，显示应用及其来源、当前版本和构建时间、访问地址和监听地址、健康状态、pm2 进程、磁盘上的版本及占用空间，以及本机 Node 大版本是否仍与构建时一致。

要更换访问域名或端口，修改 `app.env` 中的 `APP_PUBLIC_ORIGIN`、`APP_SERVER_HOST` 和 `APP_SERVER_PORT`，再执行 `pm2 restart nocobase-crm`；安装时用 `--name` 指定过进程名的，换成那个名字。新端口必须空闲，反向代理也要改为转发到新端口。挂载路径编译在前端里，不能在这里修改。

## 更多参数

全部参数、退出码和错误码见 `--help` 或[安装器的 README](https://github.com/nocobase/nocobase3/blob/develop/packages/tools/app-installer/README.md)。数据备份和故障排查见[备份恢复与排障](./operations)。
