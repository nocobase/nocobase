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
    image: nocobase/nocobase:main
```

## 3. Restart the container

```bash
docker-compose pull
docker-compose up -d app
docker-compose logs app
```
