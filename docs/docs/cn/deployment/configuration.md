---
title: 运行配置
description: 生产环境的配置文件、数据库、密钥、初始管理员、地址变量和反向代理配置。
---

# 运行配置

应用的运行配置是一份 `config.yml`。数据库、密钥、初始管理员等字段在所有部署方式中相同，不同之处在于配置文件的位置和生成方式。

| 部署方式      | 配置文件位置                                                | 生成方式                                                            |
| ------------- | ----------------------------------------------------------- | ------------------------------------------------------------------- |
| app-installer | 安装目录下的 `config.yml`，所有版本共用                     | 由 app-installer 生成，通过 `--set` 和 `--set-from-env` 填写值      |
| Docker        | 宿主机上的文件，只读挂载到 `/app/config.yml`                | 手动编写，启动前通过镜像中的 `config check` 检查                    |
| Node.js       | 与 `dist/` 并列的 `config.yml`，通过 `APP_CONFIG_FILE` 指定 | 通过 `node dist/cli/index.js config init` 生成，`config set` 填写值 |

## 通过 CLI 生成和检查

部署包和 Docker 镜像都包含应用的 CLI：在 `dist/` 中通过 `node dist/cli/index.js` 调用，在源码项目中通过 `pnpm nocobase` 调用。

| 命令                             | 作用                                                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `config init [--dialect <方言>]` | 根据 `config.example.yml` 生成 `config.yml` 并填入随机密钥；不安装任何驱动                                 |
| `config set <路径>=<值>`         | 修改一个字段；`--from-env <路径>=<变量名>` 从环境变量读取值，用于密码等敏感信息                            |
| `config check`                   | 按服务启动的方式加载配置，并连接 SQLite 以外的所有数据库；存在问题时以非零状态退出并说明原因               |
| `config env`                     | 列出应用读取的全部环境变量、对应的配置路径及是否已设置                                                     |
| `config variables`               | 为部署说明每个环境变量：用途、是否密钥、是否必填、可否生成、是否只在首次启动读取；即 `dist/variables.json` |

## 数据库

主数据库配置在 `database.connections.main` 下。`pnpm nocobase config init --dialect` 支持 `sqlite`、`postgres`、`mysql`、`mssql`、`oracle`、`dameng`、`kingbase` 和 `oceanbase`。SQLite 以外的驱动需要在构建前加入项目，包名为 `@nocobase/db-<方言>`；部署包和镜像仅包含构建时已安装的驱动。

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

SQLite 使用 `dialect: sqlite`，并通过 `database` 指定文件的绝对路径，文件应位于 `storage/` 目录下；Docker 中使用容器内路径 `/app/storage/database.sqlite`。

- **连接地址**：`host` 必须能从应用的运行环境访问；容器内的 `localhost` 指向容器自身。
- **权限**：启用自动迁移时，数据库账号需要具备建表和修改表结构的权限。
- **迁移与初始化**：`migrations.autoRun` 在启动时执行未应用的迁移，`seeds.autoRun` 执行初始化任务，例如创建管理员账号。由发布流程单独执行时，将两项设为 `false`，并在启动前通过 `node dist/cli/index.js db apply` 完成。

## 文件存储（S3 / 阿里云 OSS）

部署在阿里云 ECS 上的应用可以使用实例 RAM 角色访问 OSS，无需在 `config.yml` 保存密钥。先为 ECS 绑定 RAM 角色，授予目标 bucket 的 `oss:ListObjects` 权限及其对象的 `oss:GetObject`、`oss:PutObject`、`oss:DeleteObject` 权限。启用 ACL 操作时，还需授予 `oss:GetObjectAcl` 和 `oss:PutObjectAcl`。

添加以下 Drive 配置，将 bucket 和地域替换为实际值：

```yaml
drive:
  default: oss
  disks:
    oss:
      driver: s3
      bucket: your-bucket
      region: cn-hangzhou
      endpoint: https://s3.oss-cn-hangzhou.aliyuncs.com
      forcePathStyle: false
      supportsACL: false
      visibility: private
      credentials:
        provider: aliyun-ecs-ram-role
```

默认自动发现实例角色名；如需显式指定，在 `credentials` 下添加 `roleName: your-role`。提供器只使用加固元数据模式，运行环境（包括容器）必须能访问 `http://100.100.100.200` 并取得元数据 token。容器或 ACK 部署不一定天然具备访问能力，请检查网络和实例元数据设置。参见 [ECS 实例元数据说明](https://www.alibabacloud.com/help/en/ecs/user-guide/view-instance-metadata)。

使用 OSS 的 S3 兼容 endpoint，region 与 bucket 所在地域一致。示例采用虚拟主机寻址（`your-bucket.s3.oss-cn-hangzhou.aliyuncs.com`）。同地域内网访问可使用 `https://s3.oss-cn-hangzhou-internal.aliyuncs.com`。使用签名链接的客户端也必须能访问该 endpoint，内网链接不适用于外网客户端。使用公网 endpoint 前，请核对账号和地域的域名限制，尤其是受影响中国内地账号的自定义域名要求，参见[阿里云 AWS SDK 接入说明](https://www.alibabacloud.com/help/en/oss/developer-reference/use-aws-sdks-to-access-oss)。

示例关闭对象 ACL 操作，由 bucket 策略控制访问。独立 Host 将相同磁盘对象（上方 `oss` 的内容）放在 `host.artifact`；发布插件使用 `releases.artifact`。

AWS SDK 缓存临时凭证，在临近到期时按需刷新，无需后台任务。上传、下载签名链接的实际有效期不超过签发时凭证的有效期，即使配置的链接有效期更长；刷新凭证也不会延长已有链接的寿命。未指定 provider 时，原有静态密钥配置及 AWS 默认凭证链行为保持不变；指定未知或空 provider 时，创建磁盘会报错。

## 密钥

```yaml
secrets:
  keys:
    - version: 1
      key: REPLACE_WITH_OPENSSL_RAND_HEX_32
```

`secrets.keys` 是应用加密存储的密钥材料，用于加密插件凭证、模型密钥、OAuth 令牌等需要回读的机密，登录和会话的密钥也由它派生。第一个密钥为当前密钥，新数据都用它加密；其余密钥只用于解密。每个密钥至少 32 字节，可通过 `openssl rand -hex 32` 生成。也可以用环境变量 `SECRETS_KEYS=2:<key>,1:<key>` 设置，当前密钥在前。

`config init` 和 app-installer 会生成第一个密钥。密钥在重启和升级时保持不变，随配置一起备份并与数据库分开保存，不提交到代码仓库。占位值、不足 32 字节的密钥或重复的版本号会导致应用启动报错，`config check` 也会报告。

轮换时，把新密钥放在第一位并使用比其他密钥都大的版本号，旧密钥保留在后面；重启后运行 `node dist/cli/index.js secrets rotate`（源码项目中为 `pnpm nocobase secrets rotate`），直到 `secrets status` 显示没有待重新加密的数据，再删除旧密钥。轮换可以在应用运行时进行，也可以重复执行。更换当前密钥会使所有用户退出登录一次，因为登录 Cookie 由当前密钥签名。

`auth.secret` 和 `session.secret` 不再必需。在 `secrets.keys` 出现之前就配置了 `auth.secret` 的应用应保留它，以便之前加密的认证数据仍可解密；为这类应用添加 `secrets.keys` 会使所有用户退出登录一次。

## 初始管理员

```yaml
users:
  initialAdmin:
    username: my_admin
    email: admin@example.com
    password: REPLACE_WITH_INITIAL_ADMIN_PASSWORD
```

该配置仅在初始化任务执行且用户表为空时生效；对已有应用修改这些字段不会重置账号。模板默认用户名为 `nocobase`、邮箱为 `admin@nocobase.com`、密码为 `admin123`；未修改时，首次登录后应立即修改密码。

## 地址与环境变量

| 环境变量                  | 示例                           | 说明                                                                                                        |
| ------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `APP_PUBLIC_ORIGIN`       | `https://apps.example.com`     | 对外访问的协议和域名，不包含挂载路径                                                                        |
| `APP_BASE_PATH`           | `/crm`                         | 挂载路径，启动时读取，无需重新构建；默认为 `/main`                                                          |
| `APP_SERVER_HOST`         | `127.0.0.1`                    | 监听地址；容器内使用 `0.0.0.0`                                                                              |
| `APP_SERVER_PORT`         | `13000`                        | 监听端口                                                                                                    |
| `APP_CONFIG_FILE`         | `/srv/nocobase/crm/config.yml` | 指定配置文件路径；未设置时默认查找部署根目录的配置文件（如 `config.yml`），其中保存的密钥会在重启后继续使用 |
| `APP_STORAGE_DIR`         | `/srv/nocobase/crm/storage`    | 持久目录，默认为部署根目录下的 `storage/`                                                                   |
| `NODE_ENV`                | `production`                   | 会话 Cookie 带 `Secure` 标记，仅可通过 HTTPS 或 localhost 登录                                              |
| `NOCOBASE_STRICT_STARTUP` | `true`                         | 启动失败时以非零状态退出，以便服务管理器重启应用                                                            |

同一配置项同时出现在文件和对应环境变量中时，以环境变量为准，例如 `SECRETS_KEYS` 覆盖 `secrets.keys`。仅 `config env` 列出的变量有效，不要按名称推测。

## HTTPS 与反向代理

以下示例假设 Nginx 与应用在同一台服务器上，`map` 位于 `http` 上下文：

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

`proxy_pass` 不追加路径，以保留应用的 `/crm` 前缀；`Upgrade` 和 `Connection` 用于支持 WebSocket。同一域名下部署多个应用时，每个应用使用一个 `location /crm/`，转发至各自的端口。执行 `nginx -t` 检查配置后再重新加载。
