# Docker 安装的升级

<Alert>

本篇文档所讲的 Docker 安装是基于 `docker-compose.yml` 配置文件，在 [NocoBase GitHub 仓库](https://github.com/nocobase/nocobase/tree/main/docker) 里也有提供。

</Alert>

## 1. 切换到之前安装时的目录

也可以根据实际情况，切换到 `docker-compose.yml` 所在的目录

```bash
# SQLite
cd nocobase/docker/app-sqlite
# MySQL
cd nocobase/docker/app-mysql
# PostgreSQL
cd nocobase/docker/app-postgres
```

## 2. 更新 image 版本号

`docker-compose.yml` 文件，app 容器的 image 替换为最新版本

```yml
services:
  app:
    image: nocobase/nocobase:0.8.0-alpha.1
```

## 3. 删除旧镜像（非必须）

如果使用的是 latest 镜像，需要先停止并删除相对应容器

```bash
# find container ID
docker ps
# stop container
docker stop <YOUR_CONTAINER_ID>
# delete container
docker rm <YOUR_CONTAINER_ID>
```

删除掉旧镜像

```bash
# find image
docker images
# delete image
docker rmi <YOUR_CONTAINER_ID>
```

## 4. 重启容器

```bash
docker-compose up -d app
# 查看 app 进程的情况
docker-compose logs app
```
