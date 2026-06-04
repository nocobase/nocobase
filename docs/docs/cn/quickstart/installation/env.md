# 应用环境变量

如果你只是想把应用先跑起来，通常来说先确认 `APP_KEY`、`TZ`、`APP_PORT`，以及数据库相关的 `DB_*` 就够了。

不过按当前源码来扫，应用运行时实际会读取的环境变量比这多不少。下面这份清单以源码为准整理，只统计应用运行时会读到的变量，不包含文档站构建变量，也不包含大部分测试专用变量。

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

## 源码里主要有哪些变量

:::tip 说明

当前源码里没有读取统一的 `FILE_STORAGE` 变量。文件存储相关配置已经拆成了 `LOCAL_STORAGE_DEST`、`AWS_S3_*`、`ALI_OSS_*`、`TX_COS_*` 等更具体的变量。

:::

- **应用启动与路由**：`APP_ENV`、`APP_KEY`、`APP_PORT`、`APP_PUBLIC_PATH`、`APP_PUBLIC_ORIGIN`、`API_BASE_PATH`、`API_BASE_URL`、`WEBSOCKET_URL`、`WS_PATH`、`APP_MODERN_CLIENT_PREFIX`、`CDN_BASE_URL`、`ESM_CDN_BASE_URL`、`ESM_CDN_SUFFIX`
- **数据库连接**：`DB_DIALECT`、`DB_STORAGE`、`DB_HOST`、`DB_PORT`、`DB_DATABASE`、`DB_USER`、`DB_PASSWORD`、`DB_TIMEZONE`、`DB_TABLE_PREFIX`、`DB_SCHEMA`、`DB_UNDERSCORED`、`DB_LOGGING`
- **数据库高级配置**：`DB_POOL_MAX`、`DB_POOL_MIN`、`DB_POOL_IDLE`、`DB_POOL_ACQUIRE`、`DB_POOL_EVICT`、`DB_POOL_MAX_USES`、`DB_DIALECT_OPTIONS_SSL_MODE`、`DB_DIALECT_OPTIONS_SSL_CA`、`DB_DIALECT_OPTIONS_SSL_KEY`、`DB_DIALECT_OPTIONS_SSL_CERT`、`DB_DIALECT_OPTIONS_SSL_REJECT_UNAUTHORIZED`、`DB_SQL_BENCHMARK`
- **缓存、日志与观测**：`CACHE_DEFAULT_STORE`、`CACHE_MEMORY_MAX`、`CACHE_REDIS_URL`、`REDIS_URL`、`LOGGER_TRANSPORT`、`LOGGER_LEVEL`、`LOGGER_FORMAT`、`LOGGER_MAX_FILES`、`LOGGER_MAX_SIZE`、`TELEMETRY_SERVICE_NAME`、`TELEMETRY_ENABLED`、`TELEMETRY_METRIC_READER`、`TELEMETRY_TRACE_PROCESSOR`、`ENABLE_PERF_HOOKS`
- **初始化与安全**：`INIT_LANG`、`INIT_APP_LANG`、`INIT_ROOT_EMAIL`、`INIT_ROOT_PASSWORD`、`INIT_ROOT_NICKNAME`、`INIT_ROOT_USERNAME`、`SERVER_REQUEST_WHITELIST`、`CORS_ORIGIN_WHITELIST`、`CORS_DISALLOW_NO_ORIGIN`、`REQUEST_BODY_LIMIT`、`APP_AES_SECRET_KEY`、`APP_AES_SECRET_KEY_PATH`
- **存储与插件目录**：`STORAGE_PATH`、`LOCAL_STORAGE_DEST`、`LOCAL_STORAGE_ALLOWED_ROOTS`、`PLUGIN_STORAGE_PATH`、`NODE_MODULES_PATH`、`PLUGIN_PATH`、`PLUGIN_STATICS_PATH`、`PLUGIN_PACKAGE_PREFIX`、`APPEND_PRESET_BUILT_IN_PLUGINS`、`DISABLE_PM_ADD`
- **集群、Worker 与多应用**：`CLUSTER_MODE`、`WORKER_MODE`、`APP_MODE`、`APP_DISCOVERY_ADAPTER`、`APP_PROCESS_ADAPTER`、`APP_COMMAND_ADAPTER`、`APP_SUPERVISOR_AES_SECRET_KEY`、`STARTUP_SUBAPP`、`USE_DB_SCHEMA_IN_SUBAPP`、`SUBAPP_BOOTSTRAP_CONCURRENCY`、`SUBAPP_BOOTSTRAP_INTERVAL_CAP`、`SUBAPP_BOOTSTRAP_INTERVAL`、`LOCK_ADAPTER_DEFAULT`
- **常见插件扩展**：`EXPORT_LIMIT`、`EXPORT_AUTO_MODE_THRESHOLD`、`EXPORT_ATTACHMENTS_AUTO_MODE_THRESHOLD`、`ASYNC_TASK_MAX_CONCURRENCY`、`ASYNC_TASK_CONCURRENCY_MODE`、`ASYNC_TASK_WORKER_MAX_OLD`、`ASYNC_TASK_WORKER_MAX_YOUNG`、`WORKFLOW_NODES_LIMIT`、`WORKFLOW_LOOP_LIMIT`、`WORKFLOW_SCRIPT_MODULES`、`NOCOBASE_AI_DOCS_DIR`
- **对象存储提供商**：`AWS_S3_*`、`ALI_OSS_*`、`TX_COS_*`

## 多数场景先确认哪些变量

### `APP_KEY`

应用密钥，用于生成 token 等敏感数据。部署到正式环境前，记得改成你自己的值，并妥善保管。

如果你没有显式配置，源码里会优先尝试读取 `storage/apps/main/jwt_secret.dat`，再决定是否自动生成。所以正式环境里最好还是明确配置 `APP_KEY`，不要依赖默认行为。

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

### 另外这几项也比较常见

- `DB_STORAGE`：如果你用 SQLite，实际会读这个变量来确定数据库文件路径
- `APP_PUBLIC_PATH`：如果你把应用部署在子路径下，而不是直接挂在 `/`，通常要配这个
- `CACHE_DEFAULT_STORE` 和 `CACHE_REDIS_URL`：如果你要做集群、多实例或把缓存切到 Redis，这两个变量通常会一起出现
- `DB_SCHEMA` 和 `USE_DB_SCHEMA_IN_SUBAPP`：如果你在 PostgreSQL 下跑多应用，或者需要按 schema 隔离数据，经常会用到

## 源码里的默认值

- `STORAGE_PATH` 默认是项目根目录下的 `storage`
- `DB_STORAGE` 默认是 `storage/db/nocobase.sqlite`
- `LOCAL_STORAGE_DEST` 默认是 `storage/uploads`
- `PLUGIN_STORAGE_PATH` 默认是 `storage/plugins`
- `DB_TIMEZONE` 没有单独配置时，会跟 `TZ` 对齐

## 继续往下看

如果你要看 `APP_KEY`、`TZ`、`DB_*` 这类基础项的逐项说明，继续看 [全局环境变量](/api/app/env)。如果你要看文件存储、工作流、队列、多应用这类插件专用变量，直接看对应插件文档会更准。
