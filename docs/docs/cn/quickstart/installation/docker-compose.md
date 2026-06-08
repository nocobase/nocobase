# 通过 Docker Compose 安装

如果你希望直接在服务器上把 NocoBase 跑起来，`docker compose` 仍然是最直接的方式。大部分场景用一份 `docker-compose.yml` 就够了。

不过生产环境里，建议固定具体版本号，不要长期直接使用 `latest`。这样升级时更可控。

## 前提条件

- 已安装 Docker 和 Docker Compose
- 确保 Docker 服务已经启动
- 已准备好一个要对外开放的端口，比如 `13000`

## 第一步：创建项目目录

```bash
mkdir my-nocobase-app
cd my-nocobase-app
```

## 第二步：创建 `docker-compose.yml`

下面这个示例使用 PostgreSQL，也是默认最省心的一种组合：

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

其中：

- `APP_KEY` 记得改成你自己的随机字符串
- `13000:80` 代表把主机的 `13000` 端口映射到容器的 `80` 端口
- 如果你已经有数据库服务，可以删掉 `postgres` 这一段，并把 `DB_HOST` 改成现有数据库地址

如果你使用 MySQL 或 MariaDB，记得把 `DB_DIALECT` 改成对应类型，并补上：

```bash
DB_UNDERSCORED=true
```

## 第三步：启动应用

```bash
docker compose up -d
```

查看日志：

```bash
docker compose logs -f app
```

## 第四步：访问应用

应用启动完成后，打开：

```text
http://<服务器IP>:13000
```

如果是第一次启动，按页面提示初始化管理员账号即可。

## 常用命令

启动或更新容器：

```bash
docker compose up -d
```

停止应用：

```bash
docker compose down
```

查看日志：

```bash
docker compose logs -f app
```

## 下一步去哪里看

- 如果你要调整密钥、端口、数据库等配置，继续看 [应用环境变量](./env.md)
- 如果你准备正式上线，继续看 [Nginx](../production/reverse-proxy/nginx.md) 或 [Caddy](../production/reverse-proxy/caddy.md)
- 如果你后续要备份数据，继续看 [备份还原](../operations/backup-restore.md)
