---
title: 配置文件
order: 3
toc: menu
---

# 配置文件

<Alert title="注意" type="warning">
暂时只支持 <code>.env</code> 环境变量配置，这种方式有些局限，接下来会提供更完整的 <code>.nocobaserc.ts</code> 文件，用于支持更灵活的配置，包括但不局限于数据库信息、插件等。
</Alert>

## .env

### 数据库信息

<Alert title="注意" type="warning">
  暂时只提供了核心的一些配置参数，后续还需优化
</Alert>

#### DB_DIALECT

#### DB_HOST

#### DB_PORT

#### DB_DATABASE

#### DB_USER

#### DB_PASSWORD

#### DB_LOG_SQL

### APP 信息

<Alert title="注意" type="warning">
  暂时只提供了核心的一些配置参数，后续还需优化
</Alert>

#### NOCOBASE_ENV

NOCOBASE 环境

#### API_PREFIX

API 前缀

#### API_PORT

API 端口

#### APP_DIST

APP 前端静态文件路径

#### APP_USE_STATIC_SERVER

APP 前端静态文件是否使用 koa-static 代理。如不需要，你也可以使用 nginx 等服务。

### ADMIN 账号

<Alert title="注意" type="warning">
  仅用于初始化配置，后续会集成到 cli 里，安装时用户可输入。
</Alert>

#### ADMIN_EMAIL

初始化的管理员邮箱

#### ADMIN_PASSWORD

初始化的管理员密码

### 文件管理器插件

<Alert title="注意" type="warning">
  仅用于初始化，目前还未提供插件管理面板，如果有修改，需要去 storages 表里修改。后续优化会集成到 cli 里，在插件安装时由用户输入，或通过插件管理器修改。
</Alert>

#### STORAGE_TYPE

目前已支持的 storage 有：

- `local` 本地
- `ali-oss` 阿里云 OSS

#### LOCAL_STORAGE_USE_STATIC_SERVER

文件静态文件是否使用 koa-static 代理。如不需要，你也可以使用 nginx 等服务。

#### LOCAL_STORAGE_BASE_URL

静态文件地址前缀

#### ALI_OSS_REGION
#### ALI_OSS_ACCESS_KEY_ID
#### ALI_OSS_ACCESS_KEY_SECRET
#### ALI_OSS_BUCKET
#### ALI_OSS_STORAGE_BASE_URL

## .nocobaserc.ts

<Alert title="注意" type="warning">
  暂不支持 .nocobaserc 配置
</Alert>

### 数据库

待补充...

### APP 信息

待补充...

### 配置插件

待补充...
