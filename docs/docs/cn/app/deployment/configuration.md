---
title: 运行配置
description: 区分通用应用配置、独立部署配置和 Hub 托管配置。
---

# 运行配置

数据库连接、认证密钥等应用配置在两种部署方式中使用相同字段；配置文件、持久目录和网络入口的管理方式不同。

| 配置内容                   | 独立部署应用       | Hub 托管业务应用                     |
| -------------------------- | ------------------ | ------------------------------------ |
| 数据库、迁移和业务服务参数 | 写入运行配置       | 使用相同字段，提交到 Hub             |
| 认证与会话密钥             | 在运行配置中提供   | 配置文件模式可由 Hub 自动补全        |
| 配置文件与持久目录         | 自行维护文件和挂载 | Hub 与 Host 为各应用管理             |
| 监听端口与反向代理         | 为应用配置         | 使用平台统一入口，应用不单独监听端口 |

**Hub 平台自身也需要独立部署。** 安装 Hub 时仍需配置它自己的数据库、密钥、监听端口和持久目录，详见[部署 Hub 平台](./hub)。下文“Hub 托管”专指在平台内发布业务应用。

## 通用应用配置

以下配置用于业务应用本身。独立部署时写入 `config.yml`；Hub 托管时在部署页面填写，或通过 CLI 的 `--config` 提交。示例字段应合入该应用的配置模板，保留模板中的其他功能设置。

### 配置数据库

应用的主数据库连接配置在 `database.connections.main` 下，`database.default: main` 指定它为默认连接。

#### 可选的主数据库

`pnpm nocobase config init --dialect` 提供以下八种选项，应用运行时具有对应的官方驱动加载入口。具体数据库版本与业务插件的兼容性仍需在目标环境验证。

| 数据库                 | `dialect`   | 说明                                                  |
| ---------------------- | ----------- | ----------------------------------------------------- |
| SQLite                 | `sqlite`    | 默认选项，使用文件存储                                |
| PostgreSQL             | `postgres`  | 使用 PostgreSQL 驱动                                  |
| MySQL                  | `mysql`     | 使用 MySQL 驱动                                       |
| SQL Server             | `mssql`     | 需配置 `encrypt`、`trustServerCertificate` 等连接选项 |
| Oracle                 | `oracle`    | 使用 `serviceName` 指定服务                           |
| 达梦（Dameng）         | `dameng`    | 驱动 README 仍标记为实验性，需验证目标版本的集成契约  |
| 人大金仓（KingbaseES） | `kingbase`  | 当前针对 PostgreSQL 兼容模式（`DB_MODE=pg`）          |
| OceanBase CE           | `oceanbase` | 当前针对 MySQL 兼容租户                               |

主数据库在应用内选择，而不是在创建时：先安装驱动，再运行 `pnpm nocobase config init --dialect <dialect>` 生成对应的连接配置。模板已依赖 `@nocobase/db-sqlite`，使用 SQLite 无需额外安装。非 SQLite 数据库仍需填写实际连接信息；配置成功不代表数据库连接已验证。以下先列出 SQLite、PostgreSQL 和 MySQL 的配置示例。

#### 使用 SQLite

默认应用模板使用 SQLite。以下配置沿用模板提供的数据库文件路径：

```yaml
database:
  default: main
  connections:
    main:
      dialect: sqlite
      schemaManagement: managed
      migrations:
        autoRun: true
      seeds:
        autoRun: true
```

数据库文件默认位于应用持久目录的 `database.sqlite`。独立部署时可通过 `database.connections.main.database` 指定绝对路径；Hub 托管时通常沿用 Host 分配的目录。具体路径分别见下方[独立部署配置](#独立部署配置)和[Hub 托管应用配置](#hub-托管应用配置)。

#### 使用 PostgreSQL

PostgreSQL 主连接配置示例：

```yaml
database:
  default: main
  connections:
    main:
      dialect: postgres
      host: db.internal
      port: 5432
      database: crm
      username: crm
      password: REPLACE_WITH_DATABASE_PASSWORD
      schemaManagement: managed
      migrations:
        autoRun: true
      seeds:
        autoRun: true
```

#### 使用 MySQL

MySQL 使用 `dialect: mysql`，默认端口为 `3306`：

```yaml
database:
  default: main
  connections:
    main:
      dialect: mysql
      host: db.internal
      port: 3306
      database: crm
      username: crm
      password: REPLACE_WITH_DATABASE_PASSWORD
      schemaManagement: managed
      migrations:
        autoRun: true
      seeds:
        autoRun: true
```

#### 连接前检查

- **数据库与权限**：提前创建数据库和账号。启用自动迁移时，账号需具备迁移所需的建表、变更表结构等权限；Oracle、达梦等按各自的服务和 schema 配置准备。
- **连接地址**：`host` 必须能从应用运行环境访问。容器中的 `localhost` 指向容器自身，连接其他数据库服务时应使用对应的服务名或网络地址。
- **数据库驱动**：应用能使用哪些方言由它声明的驱动决定。`pnpm nocobase config init` 不安装任何东西——驱动缺失时它会报出来且不写入配置——所以要先用 `pnpm add` 安装。已有项目改用其他数据库时，需确认目标驱动已安装并重新构建；官方驱动包名为 `@nocobase/db-<dialect>`，例如 `@nocobase/db-mssql`。

#### 迁移与初始化设置

上面的示例使用 `schemaManagement: managed`，由应用的数据库迁移管理表结构，并在启动时执行以下任务：

| 配置                       | 作用                                                   |
| -------------------------- | ------------------------------------------------------ |
| `migrations.autoRun: true` | 执行尚未应用的数据库迁移，包括首次建表和后续结构变更   |
| `seeds.autoRun: true`      | 执行应用和插件提供的初始化任务，例如默认账号与权限数据 |

这两个选项位于对应连接的配置下。首次部署可沿用模板设置；如果由发布流程单独执行迁移或初始化任务，将对应选项设为 `false`，并在启动前完成这些任务。升级涉及数据库变更时，参阅[备份恢复与排障](./operations)。

### 配置初始管理员

首次启动前，可在运行配置中设置管理员用户名、邮箱和密码。独立应用、Hub 平台和 Hub 托管业务应用均使用以下字段，各应用分别初始化自己的账号：

```yaml
users:
  initialAdmin:
    username: my_admin
    email: admin@example.com
    password: REPLACE_WITH_INITIAL_ADMIN_PASSWORD
```

用户名支持 3–30 个字母、数字、下划线或点，邮箱须为有效地址，两者保存时均转为小写，均可用于登录。显式配置 `users.initialAdmin` 时必须提供非空密码；省略用户名时使用 `nocobase`，省略邮箱时使用 `admin@nocobase.com`。

默认模板提供的用户名为 `nocobase`，邮箱为 `admin@nocobase.com`，密码为 `admin123`，部署前应替换。此配置仅在默认初始化任务执行且用户表为空时生效；已有应用修改这些字段不会重置账号或密码。

### 配置认证与会话密钥

应用使用两项服务端密钥：

| 配置项           | 用途                                   |
| ---------------- | -------------------------------------- |
| `auth.secret`    | 供认证组件对认证相关数据进行签名和加密 |
| `session.secret` | 加密应用会话 Cookie 中的会话标识       |

这两项是应用配置，不是用户的登录密码，也不是 Hub 的发布 API Key。

#### 密钥来源

| 配置来源                                 | 如何处理                                                     |
| ---------------------------------------- | ------------------------------------------------------------ |
| 创建应用命令生成的 `config.yml`          | 已填入随机密钥，可保留使用；当前脚手架为两项填写同一个生成值 |
| 从部署包的 `config.example.yml` 新建配置 | 模板只有占位值，必须替换；保留占位值时应用启动会直接报错     |
| 通过 Hub 以配置文件模式部署业务应用      | Hub 自动补全缺失、空白或示例占位的密钥，保留已有有效值       |
| 更新已部署应用                           | 沿用该环境已有的密钥                                         |

Hub 的自动补全用于其托管的业务应用。部署 Hub 平台自身时，按实际配置来源处理：已有生成的密钥则保留，从模板新建配置则手动生成。

#### 手动配置

运行以下命令生成随机密钥，每次输出为一个 64 位十六进制字符串：

```bash
openssl rand -hex 32
```

可为两项分别运行一次，并把结果填入 `config.yml`：

```yaml
auth:
  secret: REPLACE_WITH_GENERATED_AUTH_SECRET
session:
  secret: REPLACE_WITH_GENERATED_SESSION_SECRET
```

只替换已有 `auth`、`session` 节点中的 `secret` 字段，保留其他设置，不要重复添加同名节点。

密钥随环境配置保存和备份，不提交到代码仓库。重启和升级时保持不变；直接更换密钥可能使已有登录状态或会话失效。

## 独立部署配置

本节用于直接以 Node.js 或 Docker 运行的应用。Hub 托管业务应用请跳到[Hub 托管应用配置](#hub-托管应用配置)。

### 配置文件放在哪里

独立部署采用以下目录结构，`config.yml` 和 `storage` 与 `dist` 并列：

```text
/srv/nocobase/crm/
├── dist/                 构建产物和生产依赖
├── config.example.yml    随部署包提供的配置模板
├── config.yml            当前环境的实际配置
└── storage/              数据库、文件等持久数据
```

首次部署从 `config.example.yml` 创建 `config.yml`，保留模板中的功能配置，再修改数据库、密钥等环境参数。升级时替换 `dist`，保留 `config.yml` 和 `storage`；新版本增加的配置需对照新模板补充。

用 `APP_CONFIG_FILE` 显式指定配置文件，建议使用绝对路径：

```bash
export APP_CONFIG_FILE=/srv/nocobase/crm/config.yml
```

相对路径会相对 `dist/` 目录解析，因此必须使用绝对路径。不设置 `APP_CONFIG_FILE` 时应用仍会启动，但认证和会话会使用每次启动随机生成的临时密钥，重启后所有登录失效，生产环境必须显式指定。

Docker 中填写容器内路径，例如 `/app/config.yml`，并将宿主机上的配置文件挂载到该位置。完整挂载示例见 [Docker 部署](./docker)。

### 环境变量覆盖

默认模板先加载配置文件，再应用各配置段声明的环境变量。**同一个配置项同时出现在文件和对应环境变量中时，环境变量优先。** 例如，`AUTH_SECRET` 和 `SESSION_SECRET` 分别覆盖 `auth.secret` 和 `session.secret`。

只有已声明的环境变量才会覆盖对应字段；不要按名称自行推断 `DB_HOST` 等变量一定可用。在应用目录（构建产物则在 `dist/`）执行 `pnpm nocobase config env`，可以列出应用读取的全部环境变量、各自对应的配置路径，以及是否已设置。

### 持久目录

`storage` 需要保留在代码更新范围之外，并允许应用进程写入。SQLite 使用 `database.connections.main.database` 指定文件路径：

| 运行方式 | 路径示例                                                              |
| -------- | --------------------------------------------------------------------- |
| Node.js  | `/srv/nocobase/crm/storage/database.sqlite`                           |
| Docker   | `/app/storage/database.sqlite`，将宿主机持久目录挂载到 `/app/storage` |

SQLite 的文件路径写在 `database` 字段，与模板自带的 `config.example.yml` 一致；旧配置中的 `filename` 仍被接受，两者同时存在时以 `database` 为准。完整目录与挂载示例见[独立部署](./standalone)和[Docker 部署](./docker)。

### 配置访问地址

以用户访问 `https://apps.example.com/crm/`、反向代理连接本机 `13000` 端口为例：

| 环境变量            | 示例值                     | 用途                       |
| ------------------- | -------------------------- | -------------------------- |
| `APP_PUBLIC_ORIGIN` | `https://apps.example.com` | 外部 origin，不包含 `/crm` |
| `APP_BASE_PATH`     | `/crm`                     | 应用公开挂载路径           |
| `APP_SERVER_HOST`   | `127.0.0.1`                | Node.js 服务的监听地址     |
| `APP_SERVER_PORT`   | `13000`                    | Node.js 服务的监听端口     |

Node.js 独立部署时可在启动环境中设置：

```bash
export APP_PUBLIC_ORIGIN=https://apps.example.com
export APP_BASE_PATH=/crm
export APP_SERVER_HOST=127.0.0.1
export APP_SERVER_PORT=13000
```

容器内通常将 `APP_SERVER_HOST` 设为 `0.0.0.0`，再通过端口映射控制宿主机入口。`APP_BASE_PATH` 在服务启动时读取，改路径后重启即可，无需重新构建；反向代理要同步转发新路径。未设置时应用默认挂载在 `/main`，而不是根路径。

`NODE_ENV=production` 会给会话 Cookie 加上 `Secure` 标记，浏览器只在 HTTPS 或 localhost 下发送它，因此通过服务器 IP 或域名的纯 HTTP 访问无法登录。

### HTTPS 与反向代理

以下示例假设 Nginx 与应用在同一台服务器，证书已准备好。将 `map` 放在 Nginx 的 `http` 上下文，并修改域名和证书路径。

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 443 ssl;
    server_name apps.example.com;
    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:13000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_read_timeout 300s;
    }
}
```

这段配置有三个需要保留的设置：

- `proxy_pass` 不追加路径，保留应用的 `/crm` 前缀及 API 路径。
- 转发 `Host` 和 `X-Forwarded-Proto` 等头，供日志和上游组件使用；应用识别外部地址依赖 `APP_PUBLIC_ORIGIN`，而不是这些头。
- 转发 `Upgrade` 和 `Connection`，支持 WebSocket。

执行 `nginx -t` 检查后再 reload。用于 Hub 时，应转发整站流量，让 Hub 处理平台与业务应用的路径；上传大小设置见[Hub 对外访问](./hub#配置访问与首次登录)。

## Hub 托管应用配置

### 提交运行配置

以下说明采用 Hub 的配置文件模式：

| 操作                   | 配置来源                                                      |
| ---------------------- | ------------------------------------------------------------- |
| 首次部署               | 使用 Release 中的配置模板填写，或通过 CLI `--config` 提供文件 |
| 后续部署，不提交新配置 | 沿用 Hub 当前保存的配置                                       |
| 显式提交 `--config`    | 替换配置文档，经过 Hub 的密钥处理和 YAML 校验                 |

数据库连接、迁移选项及邮件等业务服务参数仍需按目标环境填写。Hub 自动补全缺失、空白或示例占位的 `auth.secret` 与 `session.secret`，并保留已有有效值。部署操作见[使用 Hub 发布应用](./hub-publishing)。

外部配置模式要求应用已接入外部配置来源，不使用上述配置文件模式的模板初始化和密钥补全规则。

### 配置文件与持久目录

Hub 保存期望配置，Host 将配置提供给应用，并为应用分配独立的持久目录。托管应用无需自行设置 `APP_CONFIG_FILE`，也无需为每个应用单独创建容器挂载。

使用默认模板的 SQLite 和文件存储路径时，数据位于该应用的持久目录中。不要直接照搬开发机或独立部署示例里的绝对路径。连接外部数据库时，地址必须能从 Host 的运行环境访问；Hub 以容器运行时，应按容器网络配置。

平台运维仍需持久化整个 Hub 存储目录，具体挂载见[部署 Hub 平台](./hub)。应用由 Host 分配目录，不代表平台存储已自动获得持久化或备份。

### 访问路径与网络入口

按照 Hub 中显示的应用路径构建和访问，例如 `/crm`。托管应用不需要设置 `APP_SERVER_HOST`、`APP_SERVER_PORT`，也不需要配置单独的 Nginx 入口；外部请求通过 Hub 统一转发。

业务功能需要生成外部回调或链接时，仍需核对应用使用的公开地址。`app.publicOrigin` 表示不含挂载路径的外部 origin，例如 `https://apps.example.com`。它与 Host 分配的 `/crm` 路径是不同配置，不能用修改监听端口代替。

## 确认配置生效

| 检查项       | 验证方法                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| 整体配置     | 独立部署在目标机器的 `dist/` 中运行 `pnpm nocobase config check`；它按服务启动的方式加载配置，并连接除 SQLite 以外的所有数据库 |
| 配置来源     | 独立部署检查 `APP_CONFIG_FILE` 和挂载；Hub 托管检查目标应用当前配置及部署记录                                                  |
| 环境变量覆盖 | 独立部署中，文件修改未生效时检查对应环境变量                                                                                   |
| 数据库连接   | 检查启动日志，并读取目标库中的已知业务记录                                                                                     |
| 访问地址     | 通过正式域名登录、刷新子页面，检查资源和回调地址                                                                               |
| 实时连接     | 确认应用使用的 WebSocket 功能正常                                                                                              |
| 数据持久化   | 创建测试记录和文件，重启后确认保留；Docker 还需验证容器重建                                                                    |

检查日志时不要输出整份配置。出现问题时，参阅[故障排查](./operations#故障排查)。
