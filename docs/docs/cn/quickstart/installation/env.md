# 应用配置与 `.env`

这篇页只适用于通过 NocoBase CLI 创建或托管的应用。

如果你刚看完 [使用 CLI 安装（推荐）](./cli.md)，并且已经看到其中的“安装目录”一节，那么接下来最容易遇到的问题通常就是这几个：

- `.env` 文件放在哪里
- 哪些配置还适合写进 `.env`
- 哪些配置现在更适合交给 `nb env update`

先说结论：

- 对于 CLI 安装的应用，`.env` 默认放在 `<app-path>/.env`
- 这个文件是可选的，不是每个 env 都必须手动创建
- `APP_KEY`、`TZ`、`APP_PORT`、`APP_PUBLIC_PATH`、`DB_*` 这类基础配置，默认优先用 `nb env update` 管理
- `.env` 主要用来补充 CLI 还没有直接接管的运行时变量，比如存储、缓存、日志、观测和部分插件扩展变量

## 先找到 `app-path`

在 [使用 CLI 安装（推荐）](./cli.md#安装目录) 里，CLI env 的默认目录结构是这样：

```text
<app-path>/
├── source/
├── storage/
└── .env
```

如果你还不确定当前应用的 `app-path` 在哪，可以直接查看：

```bash
nb env info app1 --field app.appPath
```

把 `app1` 换成你的 env 名称就行。

也就是说，对一个通过 CLI 创建或托管的应用来说，`.env` 文件最合适的位置就是：

```text
<app-path>/.env
```

通常来说，不需要把它放到 `source/.env`，也不需要再按旧安装方式去找 Docker Compose 项目根目录里的 `.env`。

## 什么时候需要自己创建 `.env`

`.env` 是可选的。

如果你只是想把应用先跑起来，或者只是修改端口、时区、数据库连接、公开访问路径这类基础配置，那么很多时候根本不需要手动创建 `.env`。

只有当你需要补充一些 CLI 还没有直接接管的运行时变量时，才需要在 `<app-path>/.env` 里添加它们。

## 默认先用 `nb env update`

在新的 CLI 安装方式里，应用基础配置默认推荐优先交给 [`nb env update`](../../api/cli/env/update.md)。

这样做有两个好处：

- 配置和 env 本身保存在同一套 CLI 心智里，更容易查和改
- 后续你自己、脚本和 AI agent 都可以继续用同一组命令维护，不容易出现“文件里改了一套，CLI 里记的是另一套”的情况

### 这些配置现在更适合交给 `nb env update`

下面这些项目，过去你可能会习惯直接写进 `.env`。不过在 CLI 安装方式下，默认更推荐用 `nb env update`：

| 我想改…… | 默认怎么改 |
| --- | --- |
| `APP_KEY` | `nb env update <name> --app-key <value>` |
| `TZ` | `nb env update <name> --timezone <value>` |
| `APP_PORT` | `nb env update <name> --app-port <value>` |
| `APP_PUBLIC_PATH` | `nb env update <name> --app-public-path <value>` |
| `CDN_BASE_URL` | `nb env update <name> --cdn-base-url <value>` |
| 数据库类型和连接参数，比如 `DB_DIALECT`、`DB_HOST`、`DB_PORT`、`DB_DATABASE`、`DB_USER`、`DB_PASSWORD` | `nb env update <name> --db-dialect ... --db-host ... --db-port ... --db-database ... --db-user ... --db-password ...` |
| PostgreSQL schema、表前缀、下划线命名这类数据库补充项，比如 `DB_SCHEMA`、`DB_TABLE_PREFIX`、`DB_UNDERSCORED` | `nb env update <name> --db-schema ... --db-table-prefix ... --db-underscored` |

比如你想改应用端口和时区，可以直接这样写：

```bash
nb env update app1 --app-port 13080 --timezone Asia/Shanghai
```

如果你想改数据库连接参数，可以这样写：

```bash
nb env update app1 \
  --db-dialect postgres \
  --db-host 127.0.0.1 \
  --db-port 5432 \
  --db-database nocobase \
  --db-user nocobase \
  --db-password nocobase
```

改完之后，CLI 通常会提示你后续执行 `nb app restart`。更完整的参数说明直接看 [`nb env update`](../../api/cli/env/update.md) 就行。

## 哪些情况更适合写进 `.env`

如果某个变量还没有对应的 CLI 参数，或者它本身更像“直接传给应用运行时”的扩展配置，那么继续写进 `<app-path>/.env` 就可以。

通常包括这几类：

- 文件存储和对象存储配置，比如 `LOCAL_STORAGE_*`、`AWS_S3_*`、`ALI_OSS_*`、`TX_COS_*`
- 缓存和 Redis 配置，比如 `CACHE_*`、`REDIS_URL`
- 日志和观测配置，比如 `LOGGER_*`、`TELEMETRY_*`
- 某些插件或扩展专用变量，比如导出、异步任务、工作流、AI 扩展相关变量

比如：

```bash
LOCAL_STORAGE_DEST=storage/uploads
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=ap-southeast-1
LOGGER_LEVEL=info
REDIS_URL=redis://127.0.0.1:6379
```

这类变量本质上还是应用运行时配置，CLI 目前不会逐项接管，放在 `.env` 里最自然。

## `.env` 和 `nb env update` 怎么分工

如果你不确定某个配置该放哪，默认按这条规则判断就够了：

- 如果 `nb env update` 已经有对应参数，默认先用它
- 如果没有对应参数，或者它明显属于插件、存储、缓存、日志这类运行时扩展配置，就放进 `<app-path>/.env`

多数场景下，这样分工已经够用了。

### 一个常见误区

不要把同一个配置同时维护两份。

比如 `APP_PORT`、`TZ`、`APP_PUBLIC_PATH`、`DB_HOST` 这些基础项，如果你已经用 `nb env update` 保存了，通常就不要再在 `.env` 里重复写一遍。否则后面排查问题时，很容易分不清到底哪一层才是你真正想生效的值。

## 一个最小的 `.env` 例子

如果你的基础配置都已经通过 CLI 保存好了，那么 `.env` 很可能只需要保留少量扩展变量，比如：

```bash
LOGGER_LEVEL=info
REDIS_URL=redis://127.0.0.1:6379
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=ap-southeast-1
```

这也是这篇页最想帮你建立的心智：

`.env` 仍然有用，不过它在新的 CLI 安装方式里，更多是在补充运行时扩展配置，而不是继续承担所有基础安装参数。

## 下一步去哪里看

- 如果你还没确认应用目录结构，先回到 [使用 CLI 安装（推荐）](./cli.md#安装目录)
- 如果你要修改端口、时区、数据库连接、公开访问路径这类基础配置，继续看 [`nb env update`](../../api/cli/env/update.md)
- 如果你要启动、重启或查看应用日志，继续看 [管理应用](../operations/manage-app.md)
