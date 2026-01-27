---
pkg: "@nocobase/plugin-data-source-kingbase"
---

# 数据源 - 人大金仓（KingbaseES）

## 介绍

使用人大金仓（KingbaseES）数据库作为数据源，可以作为主数据库，也可以作为外部数据库使用。

:::warning
目前只支持 pg 模式运行的人大金仓（KingbaseES）数据库。
:::

## 安装

### 作为主数据库使用

安装流程参考安装文档，区别主要在于环境变量。

#### 环境变量

修改 .env 文件添加或修改以下相关环境变量配置

```bash
# 根据实际情况调整 DB 相关参数
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Docker 安装

```yml
networks:
  nocobase:
    driver: bridge

services:
  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
    restart: always
    networks:
      - nocobase
    depends_on:
      - kingbase
    environment:
      # Application key for generating user tokens, etc.
      # Changing APP_KEY invalidates old tokens
      # Use a random string and keep it confidential
      - APP_KEY=your-secret-key
      # Database type
      - DB_DIALECT=kingbase
      # Database host, replace with existing database server IP if needed
      - DB_HOST=kingbase
      - DB_PORT=54321
      # Database name
      - DB_DATABASE=kingbase
      # Database user
      - DB_USER=nocobase
      # Database password
      - DB_PASSWORD=nocobase
      # Timezone
      - TZ=UTC
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "11000:80"

  # Kingbase service for testing purposes only
  kingbase:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/kingbase:v009r001c001b0030_single_x86
    platform: linux/amd64
    restart: always
    privileged: true
    networks:
      - nocobase
    volumes:
      - ./storage/db/kingbase:/home/kingbase/userdata
    environment:
      ENABLE_CI: no # Must be set to no
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # pg only
      NEED_START: yes
    command: ["/usr/sbin/init"]
```

#### 使用 create-nocobase-app 安装

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### 作为外部数据库使用

执行安装或升级命令

```bash
yarn nocobase install
# or
yarn nocobase upgrade
```

激活插件

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## 使用手册

- 主数据库：查阅 主数据源
- 外部数据库：查阅 [数据源 / 外部数据库](/data-sources/data-source-manager/external-database) 
