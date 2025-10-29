# 数据源 - 人大金仓（KingbaseES）

<PluginInfo licenseBundled="true" name="data-source-kingbase"></PluginInfo>

## 介绍

使用人大金仓（KingbaseES）数据库作为数据源，可以作为主数据库，也可以作为外部数据库使用。

:::warning
目前只支持 pg 模式运行的人大金仓（KingbaseES）数据库。
:::

## 安装

### 作为主数据库使用

安装流程参考 [安装概述](/welcome/getting-started/installation)，区别主要在于环境变量。

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
version: "3"

networks:
  nocobase:
    driver: bridge

  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
    restart: always
    networks:
      - nocobase
    depends_on:
      - postgres
    environment:
      # 应用的密钥，用于生成用户 token 等
      # 如果 APP_KEY 修改了，旧的 token 也会随之失效
      # 可以是任意随机字符串，并确保不对外泄露
      - APP_KEY=your-secret-key
      # 数据库类型
      - DB_DIALECT=kingbase
      # 数据库主机，可以替换为已有的数据库服务器 IP
      - DB_HOST=kingbase
      # 数据库名
      - DB_DATABASE=kingbase
      # 数据库用户
      - DB_USER=nocobase
      # 数据库密码
      - DB_PASSWORD=nocobase
      # 时区
      - TZ=Asia/Shanghai
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "13000:80"

  # 仅用于测试的 kingbase 服务
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
      ENABLE_CI: no # 必须用是 no
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # 仅限于 pg
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

- 主数据库：查阅 [使用手册](/handbook)
- 外部数据库：查阅 [数据源 / 外部数据库](/handbook/data-source-manager/external-database) 
