# Upgrading for Docker compose

<Alert>

The Docker installation described in this document is based on the `docker-compose.yml` configuration file, which is also available in the [NocoBase GitHub repository](https://github.com/nocobase/nocobase/tree/main/docker).

</Alert>

## 1. Switch to the directory where you installed it before

You can also switch to the directory where `docker-compose.yml` is located, depending on the situation.

```bash
# SQLite
cd nocobase/docker/app-sqlite
# MySQL
cd nocobase/docker/app-mysql
# PostgreSQL
cd nocobase/docker/app-postgres
```

## 2. Update the image version number

`docker-compose.yml` file, replace the image of the app container with the latest version.

```yml
services:
  app:
    image: nocobase/nocobase:0.8.0-alpha.1
```

## 3. Delete old images (not required)

If you are using the latest image, you need to stop and delete the corresponding container first.

```bash
# find container ID
docker ps
# stop container
docker stop <YOUR_CONTAINER_ID>
# delete container
docker rm <YOUR_CONTAINER_ID>
```

Delete the old image

```bash
# find image
docker images
# delete image
docker rmi <YOUR_CONTAINER_ID>
```

## 4. Restart the container

```bash
docker-compose up -d app
# 查看 app 进程的情况
docker-compose logs app
```
