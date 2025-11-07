# 变量和密钥

<PluginInfo name="environment-variables"></PluginInfo>

## 介绍

集中配置和管理环境变量和密钥，用于敏感数据存储、配置数据重用、环境配置隔离等。

## 与 `.env` 的区别

| **特性**     | **`.env` 文件**                                         | **动态配置的环境变量和密钥**                                             |
| ------------ | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| **存储位置** | 存储在项目根目录的 `.env` 文件中                        | 存储在数据库 `environmentVariables` 表里                                 |
| **加载方式** | 通过 `dotenv` 等工具在应用启动时加载到 `process.env` 中 | 动态读取，在应用启动时加载到 `app.environment` 中                        |
| **修改方式** | 需要直接编辑文件，修改后需要重启应用才能生效            | 支持在运行时修改，修改后直接重载应用配置即可                             |
| **环境隔离** | 每个环境（开发、测试、生产）需要单独维护 `.env` 文件    | 每个环境（开发、测试、生产）需要单独维护 `environmentVariables` 表的数据 |
| **适用场景** | 适合固定的静态配置，如应用主数据库信息                  | 适合需要频繁调整或与业务逻辑绑定的动态配置，如外部数据库、文件存储等信息 |

## 安装

内置插件，无需单独安装。

## 用途

### 配置数据重用

例如工作流多个地方需要邮件节点，都需要配置 SMTP，就可以将通用的 SMTP 配置存到环境变量里。

![20250102181045](https://static-docs.nocobase.com/20250102181045.png)

### 敏感数据存储

各种外部数据库的数据库配置信息、云文件存储密钥等数据的存储等。

![20250102103513](https://static-docs.nocobase.com/20250102103513.png)

### 环境配置隔离

在软件开发、测试和生产等不同环境中，使用独立的配置管理策略来确保每个环境的配置和数据互不干扰。每个环境有各自独立的设置、变量和资源，这样可以避免开发、测试和生产环境之间的冲突，同时确保系统在每个环境中都能按预期运行。

例如，文件存储服务，开发环境和生产环境的配置可能不同，如下：

开发环境

```bash
FILE_STORAGE_OSS_BASE_URL=dev-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=dev-storage
```

生产环境

```bash
FILE_STORAGE_OSS_BASE_URL=prod-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=prod-storage
```

## 环境变量管理

![20250102155314](https://static-docs.nocobase.com/20250102155314.png)

### 添加环境变量

- 支持单个和批量添加
- 支持明文和加密

![20250102155509](https://static-docs.nocobase.com/20250102155509.png)

单个添加

![20250102155731](https://static-docs.nocobase.com/20250102155731.png)

批量添加

![20250102155258](https://static-docs.nocobase.com/20250102155258.png)

## 注意事项

### 重启应用

修改或删除环境变量之后，顶部会出现重启应用的提示，重启之后变更的环境变量才会生效。

![20250102155007](https://static-docs.nocobase.com/20250102155007.png)

### 加密存储

环境变量的加密数据使用 AES 对称加密，加解密的 PRIVATE KEY 存储在 storage 里，请妥善保管，丢失或重写，加密的数据将无法解密。

```bash
./storage/environment-variables/<app-name>/aes_key.dat
```

## 目前支持环境变量的插件

### Action: Custom request

![20250102180751](https://static-docs.nocobase.com/20250102180751.png)

### Auth: CAS

![20250102160129](https://static-docs.nocobase.com/20250102160129.png)

### Auth: DingTalk

![20250102160205](https://static-docs.nocobase.com/20250102160205.png)

### Auth: LDAP

![20250102160312](https://static-docs.nocobase.com/20250102160312.png)

### Auth: OIDC

![20250102160426](https://static-docs.nocobase.com/20250102160426.png)

### Auth: SAML

![20250102160652](https://static-docs.nocobase.com/20250102160652.png)

### Auth: WeCom

![20250102160758](https://static-docs.nocobase.com/20250102160758.png)

### Data source: External MariaDB

![20250102160935](https://static-docs.nocobase.com/20250102160935.png)

### Data source: External MySQL

![20250102173602](https://static-docs.nocobase.com/20250102173602.png)

### Data source: External Oracle

![20250102174153](https://static-docs.nocobase.com/20250102174153.png)

### Data source: External PostgreSQL

![20250102175630](https://static-docs.nocobase.com/20250102175630.png)

### Data source: External SQL Server

![20250102175814](https://static-docs.nocobase.com/20250102175814.png)

### Data source: KingbaseES

![20250102175951](https://static-docs.nocobase.com/20250102175951.png)

### Data source: REST API

![20250102180109](https://static-docs.nocobase.com/20250102180109.png)

### File storage: Local

![20250102161114](https://static-docs.nocobase.com/20250102161114.png)

### File storage: Aliyun OSS

![20250102161404](https://static-docs.nocobase.com/20250102161404.png)

### File storage: Amazon S3

![20250102163730](https://static-docs.nocobase.com/20250102163730.png)

### File storage: Tencent COS

![20250102173109](https://static-docs.nocobase.com/20250102173109.png)

### File storage: S3 Pro

未适配

### Map: AMap

![20250102163803](https://static-docs.nocobase.com/20250102163803.png)

### Map: Google

![20250102171524](https://static-docs.nocobase.com/20250102171524.png)

### Email settings

未适配

### Notification: Email

![20250102164059](https://static-docs.nocobase.com/20250102164059.png)

### Public forms

![20250102163849](https://static-docs.nocobase.com/20250102163849.png)

### System settings

![20250102164139](https://static-docs.nocobase.com/20250102164139.png)

### Verification: Aliyun SMS

![20250102164247](https://static-docs.nocobase.com/20250102164247.png)

### Verification: Tencent SMS

![20250102165814](https://static-docs.nocobase.com/20250102165814.png)

### Workflow

![20250102180537](https://static-docs.nocobase.com/20250102180537.png)
