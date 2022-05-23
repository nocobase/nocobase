# 升级

<Alert>

此篇升级文档只适用于 v0.7.0-alpha.57 之后的版本，在此之前创建的项目需要重新创建。

</Alert>

升级前请务必将数据库数据进行备份

## Docker

切换到对应的目录

```bash
# SQLite
cd nocobase/docker/app-sqlite
# MySQL
cd nocobase/docker/app-mysql
# PostgreSQL
cd nocobase/docker/app-postgres
```

`docker-compose.yml` 文件，app 容器的 image 替换为最新版本

```yml
services:
  app:
    image: nocobase/nocobase:0.7.0-alpha.62
```

下载最新镜像并启动容器

```bash
docker-compose up -d app
# 查看 app 进程的情况
docker-compose logs app
```

## create-nocobase-app

执行 `nocobase upgrade` 升级命令

```bash
# 切换到对应的目录
cd my-nocobase-app
# 执行更新命令
yarn nocobase upgrade
# 启动
yarn start
```

## Git 源码

```bash
# 切换到对应的目录
cd my-nocobase-app
# pull 最新代码
git pull
# 执行更新命令
yarn nocobase upgrade
# 启动
yarn start
```
