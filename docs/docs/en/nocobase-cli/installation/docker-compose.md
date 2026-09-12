# Install via Docker Compose

If you want to run NocoBase directly on the server, `docker compose` is still the most direct way. One serving of `docker-compose.yml` is sufficient for most scenarios.

However, in a production environment, it is recommended to fix the specific version number and not use `latest` directly for a long time. This will make the upgrade more controllable.

## Prerequisites

- Docker and Docker Compose installed
- Make sure the Docker service is started
- A port to be opened to the outside world has been prepared, such as `13000`

## Step 1: Create the project directory

```bash
mkdir my-nocobase-app
cd my-nocobase-app
```

## Step 2: Create `docker-compose.yml`

The following example uses PostgreSQL, which is also the most worry-free combination by default:

```yml
networks:
  nocobase:
    driver: bridge

services:
  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full
    restart: always
    networks:
      - nocobase
    depends_on:
      - postgres
    environment:
      - APP_KEY=replace-with-your-secret-key
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase
      - DB_USER=nocobase
      - DB_PASSWORD=nocobase
      - TZ=Asia/Shanghai
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - '13000:80'

  postgres:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
    restart: always
    command: postgres -c wal_level=logical
    environment:
      POSTGRES_USER: nocobase
      POSTGRES_DB: nocobase
      POSTGRES_PASSWORD: nocobase
    volumes:
      - ./storage/db/postgres:/var/lib/postgresql/data
    networks:
      - nocobase
```

in:

- `APP_KEY` Remember to change it to your own random string
- `13000:80` represents mapping the host's `13000` port to the container's `80` port
- If you already have a database service, you can delete the `postgres` section and change `DB_HOST` to the existing database address

If you use MySQL or MariaDB, remember to change `DB_DIALECT` to the corresponding type and add:

```bash
DB_UNDERSCORED=true
```

## Step 3: Start the application

```bash
docker compose up -d
```

Check the log:

```bash
docker compose logs -f app
```

## Step 4: Access the application

After the application has started, open:

```text
http://<服务器IP>:13000
```

If it is the first time to start, just follow the page prompts to initialize the administrator account.

## Common commands

Start or update containers:

```bash
docker compose up -d
```

Stop application:

```bash
docker compose down
```

Check the log:

```bash
docker compose logs -f app
```

## Where to look next

- If you want to adjust the configuration of keys, ports, databases, etc., continue to see [Application Environment Variables](./env.md)
- If you are ready to officially go online, continue to read [Nginx](../production/reverse-proxy/nginx.md) or [Caddy](../production/reverse-proxy/caddy.md)
- If you want to back up data later, continue to see [Backup and Restore](../operations/backup-restore.md)
