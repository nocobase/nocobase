---
title: 快速上手
order: 2
toc: menu
---

# 快速上手

为大家提供了三种方式安装并运行 NocoBase

- [Npm & Yarn](#npm--yarn)：仅用于无代码平台体验
- [Docker](#docker)：仅用于无代码平台体验
- [Git](#git)：参与项目开发

<Alert title="安装前准备" type="warning">

**OS：**

- Docker
- Linux
- MacOS（仅开发环境）
- Windows（仅开发环境），没有在 win 平台测试过，可能存在一些小问题

**Node：**

- Node.js 12.x or 14.x

**Database（任选其一）：**

现阶段还是以关系型数据库为主，接下来陆续兼容更多的关系型数据库。未来 @nocobase/database 稳定之后，会考虑适配 MongoDB。因为有几处用到了 JSON 类型字段，不同数据库的 JSON 字段有差异，现只兼容了 PostgreSQL 数据库的查询。

- PostgreSQL 10.x+（推荐）
- MySQL 5.7.x+（JSON 类型查询有问题，后续会提供支持）
- MariaDB 10.x（未知，后续会提供支持）
- SQLite 3（未知，后续会提供支持）

</Alert>

## Npm & Yarn

创建并进入新目录

```bash
mkdir my-nocobase-project && cd my-nocobase-project
```

使用 yarn 或 npm 包管理器进行初始化

```bash
yarn init # or npm init
```

安装 NocoBase 依赖

```bash
yarn add @nocobase/api @nocobase/app
```

复制并配置 .env，[环境变量说明点此查看](config.md#.env)

```bash
cp -r node_modules/@nocobase/api/.env.example .env
```

数据库初始化

```bash
yarn nocobase db-init
```

启动应用

```bash
yarn nocobase start
```

<Alert title="注意" type="warning">

为什么是 @nocobase/api 和 @nocobase/app，而不是 create-nocobase-project？

早之前想提供 create-nocobase-project 的，但是有些细节还没想清楚，暂时不会提供，目前只提供了封装度较高的 @nocobase/api 和 @nocobase/app 两个前后端包，如果有二次开发需要，可 fork 相关 api 或 app 源码，再重新构建。

</Alert>


## Docker

<Alert title="注意" type="warning">
  Docker 镜像暂未发布
</Alert>

为了更方便的安装与部署，NocoBase 也发布了 Docker 镜像 `nocobase/nocobase`，创建并配置 `docker-compose.yml` 文件，样例如下：

```yaml
version: "3"

services:
  postgres:
    image: postgres:10
    networks:
      - nocobase
    environment:
      POSTGRES_USER: nocobase
      POSTGRES_DB: nocobase
      POSTGRES_PASSWORD: nocobase
  nocobase:
    image: nocobase/nocobase:latest
    networks:
      - nocobase
    ports:
      - 23000:23000
    environment:
      DB_DIALECT: postgres
      DB_HOST: postgres
      DB_PORT: 5432
      DB_DATABASE: nocobase
      DB_USER: nocobase
      DB_PASSWORD: nocobase

      API_PORT: 23000

      ADMIN_EMAIL: admin@nocobase.com
      ADMIN_PASSWORD: admin

networks:
  nocobase:
    driver: bridge
```

初始化并启动 NocoBase 应用

```bash
docker-compose up -d
```


## Git

通过 git 克隆 nocobase 仓库

```bash
git clone https://github.com/nocobase/nocobase.git my-nocobase-project
```

进入项目目录

```bash
cd my-nocobase-project
```

复制并配置 .env，[环境变量说明点此查看](#)

```bash
cp .env.example .env
```

安装依赖

```bash
yarn install
```

构建 packages 依赖

```bash
yarn bootstrap
yarn build
```

数据库初始化

```bash
yarn db-migrate init
```

启动应用

```bash
yarn start
```

开发过程中其他常用的命令还有：

```bash
### 测试 ###

yarn test
# or
yarn test packages/<name> packages/<name>

### 打包 ###

yarn build
# or
yarn build <package_name_1> <package_name_2> ...
```
