# Upgrading

<Alert>

This document only applies to versions after v0.7.0-alpha.57. Projects created before need to be recreated.

</Alert>

Make sure to back up your database before upgrading

## Docker

Switch to the project directory

```bash
# SQLite
cd nocobase/docker/app-sqlite
# MySQL
cd nocobase/docker/app-mysql
# PostgreSQL
cd nocobase/docker/app-postgres
```

In the `docker-compose.yml` file, replace the image of the app container with the latest version

```yml
services:
  app:
    image: nocobase/nocobase:0.7.0-alpha.62
```

Download the image and start it

```bash
# Download the latest image and start it
docker-compose up -d app
# Check the status of the app process
docker-compose logs app
```

## create-nocobase-app

Execute the `nocobase upgrade` command

```bash
# Switch to the project directory
cd my-nocobase-app
# Execute the update command
yarn nocobase upgrade
# Start
yarn start
```

## Git source code

```bash
# Switch to the project directory
cd my-nocobase-app
# Pull latest source code
git pull
# Execute the update command
yarn nocobase upgrade
# Start
yarn start
```
