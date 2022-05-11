---
order: 2
---

# Upgrading

升级前请务必将数据库数据进行备份

## Docker

---

切换到对应的目录

```bash
# SQLite
cd nocobase/docker/app-sqlite
# MySQL
cd nocobase/docker/app-mysql
# PostgreSQL
cd nocobase/docker/app-postgres
```

使用 docker-compose 停止、删除并下载最新镜像

```bash
# 停止应用
docker-compose stop app
# 删除应用
docker-compose rm app
# 下载最新镜像并启动
docker-compose up app -d
# 查看 app 进程的情况
docker-compose logs app
```

## CLI

---

执行 `nocobase upgrade` 升级命令

```bash
# 切换到对应的目录
cd my-nocobase-app
# 升级开发工具包
yarn add @nocobase/cli @nocobase/devtools -W
# 执行更新命令
yarn nocobase upgrade
# 启动
yarn start
```
