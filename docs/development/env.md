---
order: 2
nav:
  path: /
group:
  title: 开发指南
  order: 3
---

# 环境变量

## 全局环境变量

保存在 `.env` 文件里，也可以放置在操作系统的环境变量里

### NOCOBASE_ENV

NocoBase 应用环境，包括 `production` 和 `development`

```bash
NOCOBASE_ENV=production
```

### NOCOBASE_PORT

NocoBase 服务器端口，默认值 `13000`

```bash
NOCOBASE_PORT=13000
```

### NOCOBASE_API

NocoBase API 地址前缀，默认值 `/api/`

```bash
NOCOBASE_API=/api/
```

### NOCOBASE_KEY

秘钥，用于 jwt 等场景

```bash
NOCOBASE_KEY=1111
```

### DB_DIALECT

数据库类型，默认值 `sqlite`，可选项包括：

- `sqlite`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_STORAGE

数据库文件路径（使用 SQLite 数据库时配置）

```bash
# 相对路径
DB_HOST=storage/db/nocobase.db
# 绝对路径
DB_HOST=/your/path/nocobase.db
```

### DB_HOST

数据库主机（使用 mysql 或 postgres 数据库时需要配置）

默认值 `localhost`

```bash
DB_HOST=localhost
```

### DB_PORT

数据库端口（使用 mysql 或 postgres 数据库时需要配置）

- MySQL 默认端口 3356
- PostgreSQL 默认端口 5432

```bash
DB_PORT=3356
```

### DB_DATABASE

数据库名（使用 mysql 或 postgres 数据库时需要配置）

```bash
DB_DATABASE=nocobase
```

### DB_USER

数据库用户（使用 mysql 或 postgres 数据库时需要配置）

```bash
DB_USER=nocobase
```

### DB_PASSWORD

数据库密码（使用 mysql 或 postgres 数据库时需要配置）

```bash
DB_PASSWORD=nocobase
```

### DB_LOG_SQL

sql 日志开关，默认值 `off`，可选项包括：

- `on` 打开
- `off` 关闭

```bash
DB_LOG_SQL=on
```

## 临时环境变量

安装 NocoBase 时，可以通过设置临时的环境变量来辅助安装，如：

```bash
yarn cross-env \
  && INTI_APP_LANG=zh-CN \
  && INIT_ADMIN_EMAIL=demo@nocobase.com \
  && INIT_ADMIN_PASSWORD=admin123 \
  && INIT_ADMIN_NICKNAME="Super Admin"
  && nocobase install

# 等同于
yarn nocobase install \
  && --lang=zh-CN  \
  && --admin-email=demo@nocobase.com \
  && --admin-password=admin123 \
  && --admin-nickname="Super Admin"

# 等同于
yarn nocobase install -l zh-CN -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INTI_APP_LANG

安装时的语言，默认值 `en-US`，可选项包括：

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  && INTI_APP_LANG=zh-CN \
  && nocobase install
```

### INIT_ADMIN_EMAIL

创始人邮箱账号

```bash
yarn cross-env \
  && INTI_APP_LANG=zh-CN \
  && INIT_ADMIN_EMAIL=demo@nocobase.com \
  && nocobase install
```

### INIT_ADMIN_PASSWORD

创始人账号密码

```bash
yarn cross-env \
  && INTI_APP_LANG=zh-CN \
  && INIT_ADMIN_EMAIL=demo@nocobase.com \
  && INIT_ADMIN_PASSWORD=admin123 \
  && nocobase install
```

### INIT_ADMIN_NICKNAME

创始人账号昵称

```bash
yarn cross-env \
  && INTI_APP_LANG=zh-CN \
  && INIT_ADMIN_EMAIL=demo@nocobase.com \
  && INIT_ADMIN_PASSWORD=admin123 \
  && INIT_ADMIN_NICKNAME="Super Admin"
  && nocobase install
```
