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

## CLI

Execute the `nocobase upgrad` upgrade command

```bash
# Switch to the corresponding directory
cd my-nocobase-app
# Execute the update command
yarn nocobase upgrade
# Start
yarn start
```
