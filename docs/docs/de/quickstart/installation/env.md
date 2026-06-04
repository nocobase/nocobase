# 应用环境变量

大部分场景只需要先看这几类环境变量：`APP_KEY`、`TZ`、`APP_PORT`，以及数据库相关的 `DB_*`。如果你只是想把应用先跑起来，通常来说先把这几项确认好就够了。

## 怎么设置环境变量

### `create-nocobase-app` 或 Git 源码方式

在项目根目录的 `.env` 文件里设置环境变量。修改完成后，重新启动应用。

```bash
APP_KEY=your-app-key
TZ=Asia/Shanghai
APP_PORT=13000
DB_DIALECT=postgres
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=nocobase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

### Docker Compose 方式

可以直接在 `docker-compose.yml` 的 `environment` 里设置：

```yml
services:
  app:
    image: nocobase/nocobase:latest
    environment:
      - APP_ENV=production
      - APP_KEY=your-app-key
      - TZ=Asia/Shanghai
```

也可以用 `env_file` 引入单独的 `.env` 文件：

```yml
services:
  app:
    image: nocobase/nocobase:latest
    env_file: .env
```

修改完成后，重新创建应用容器：

```bash
docker compose up -d app
```

## 先确认哪些变量

### `APP_KEY`

应用密钥，用于生成 token 等敏感数据。部署到正式环境前，记得改成你自己的值，并妥善保管。

:::warning 注意

如果 `APP_KEY` 改了，旧的 token 也会随之失效。

:::

### `TZ`

应用时区。和时间相关的处理都会受它影响。

```bash
TZ=Asia/Shanghai
```

### `APP_PORT`

应用端口，默认值通常是 `13000`。

```bash
APP_PORT=13000
```

### `DB_*`

如果你使用外部数据库，至少要确认这些变量：

```bash
DB_DIALECT=postgres
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=nocobase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

如果你使用 MySQL 或 MariaDB，并且数据库配置了 `lower_case_table_names=1`，还需要确认：

```bash
DB_UNDERSCORED=true
```

## 完整变量列表

如果你需要查看全部环境变量说明，比如 `CLUSTER_MODE`、`CACHE_*`、`FILE_STORAGE`、插件相关变量等，继续看 [全局环境变量](/api/app/env)。
