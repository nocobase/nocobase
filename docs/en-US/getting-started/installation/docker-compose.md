# Docker (👍 Recommended)

## 0. Prerequisites

⚡⚡ Please make sure you have installed [Docker](https://docs.docker.com/get-docker/)

## 1. Download NocoBase

Download with Git (or Download Zip，and extract it to the nocobase directory)

```bash
git clone https://github.com/nocobase/nocobase.git nocobase
```

## 2. Select database (choose one)

Change the directory to the folder downloaded in the first step.

```bash
# MacOS, Linux...
cd /your/path/nocobase
# Windows
cd C:\your\path\nocobase
```

The docker configuration of different databases is slightly different, please choose to switch to the corresponding directory.

### SQLite

```bash
cd docker/app-sqlite
```

### MySQL

```bash
cd docker/app-mysql
```

### PostgreSQL

```bash
cd docker/app-postgres
```

## 3. Configure docker-compose.yml (optional)

<Alert>

Non-developers skip this step. If you know development, you can also learn more about how to configure `docker-compose.yml`.

</Alert>

Directory structure (related to docker)

```bash
├── nocobase
  ├── docker
    ├── app-sqlite
      ├── storage
      ├── docker-compose.yml
    ├── app-mysql
      ├── storage
      ├── docker-compose.yml
    ├── app-postgres
      ├── storage
      ├── docker-compose.yml
```

Configuration notes for `docker-compose.yml`:

SQLite only has app service, PostgreSQL and MySQL will have corresponding postgres or mysql service, you can use the example database service or configure it yourself.

```yml
services:
  app:
  postgres:
  mysql:
```

App port, the URL is `http://your-ip:13000/`

```yml
services:
  app:
    ports:
      - "13000:80"
```

NocoBase version ([click here for the latest version](https://hub.docker.com/r/nocobase/nocobase/tags)). When upgrading, you need to change to the latest version.

```yml
services:
  app:
    image: nocobase/nocobase:0.7.0-alpha.78
```

Environment variables

```yml
services:
  app:
    image: nocobase/nocobase:0.7.0-alpha.78
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_DATABASE=nocobase
      - DB_USER=nocobase
      - DB_PASSWORD=nocobase
      - LOCAL_STORAGE_BASE_URL=http://localhost:13000/storage/uploads
```

- `DB_*` is the database related, if it is not the default database service of the example, please change it according to the actual situation.
- `LOCAL_STORAGE_BASE_URL` is the base URL for local storage, if it is not a local installation, you need to change it to the corresponding ip or domain name.

## 4. Install and start NocoBase

It may take a few minutes

```bash
# run in the background
$ docker-compose up -d
# view app logs
$ docker-compose logs app

app-sqlite-app-1  | nginx started
app-sqlite-app-1  | yarn run v1.22.15
app-sqlite-app-1  | $ cross-env DOTENV_CONFIG_PATH=.env node -r dotenv/config packages/app/server/lib/index.js install -s
app-sqlite-app-1  | Done in 2.72s.
app-sqlite-app-1  | yarn run v1.22.15
app-sqlite-app-1  | $ pm2-runtime start --node-args="-r dotenv/config" packages/app/server/lib/index.js -- start
app-sqlite-app-1  | 2022-04-28T15:45:38: PM2 log: Launching in no daemon mode
app-sqlite-app-1  | 2022-04-28T15:45:38: PM2 log: App [index:0] starting in -fork mode-
app-sqlite-app-1  | 2022-04-28T15:45:38: PM2 log: App [index:0] online
app-sqlite-app-1  | 🚀 NocoBase server running at: http://localhost:13000/
```

## 4. Log in to NocoBase

Open [http://localhost:13000](http://localhost:13000) in a web browser. The initial account and password are `admin@nocobase.com` and `admin123`.
