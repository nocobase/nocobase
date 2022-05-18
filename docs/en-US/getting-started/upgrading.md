---
order: 3
---

# Upgrading

Make sure to back up your database before upgrading

## Docker

Switch to the corresponding directory

```bash
# SQLite
cd nocobase/docker/app-sqlite
# MySQL
cd nocobase/docker/app-mysql
# PostgreSQL
cd nocobase/docker/app-postgres
```

Use `docker-compose` to stop, delete the application, and download the latest image

```bash
# Stop the app
docker-compose stop app
# Delete the app
docker-compose rm app
# Download the latest image and start it
docker-compose up -d app
# Check the status of the app process
docker-compose logs app
```

## create-nocobase-app

Execute the `nocobase upgrad` command

```bash
# Switch to the corresponding directory
cd my-nocobase-app
# Execute the update command
yarn nocobase upgrade
# Start
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
