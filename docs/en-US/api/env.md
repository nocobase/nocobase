# Environment variables

## Global environment variables

Saved in the `.env` file

### APP_ENV

Application environment, default value `development`, options include

- `production` production environment
- ``development`` development environment

```bash
APP_ENV=production
```

### APP_HOST

Application host, default value ``0.0.0.0``

```bash
APP_HOST=192.168.3.154
```

### APP_PORT

Application port, default value ``13000``

```bash
APP_PORT=13000
```

### APP_KEY

Secret key, for scenarios such as jwt

```bash
APP_KEY=app-key-test
```

### API_BASE_PATH

NocoBase API address prefix, default value ``/api/``

```bash
API_BASE_PATH=/api/
```

### PLUGIN_PACKAGE_PREFIX

Plugin package prefix, default value `@nocobase/plugin-,@nocobase/preset-`

For example, a project named `my-nocobase-app` adds the `hello` plugin with the package name `@my-nocobase-app/plugin-hello`.

PLUGIN_PACKAGE_PREFIX is configured as follows.

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

The correspondence between plugin names and package names is

- `users` plugin package name is `@nocobase/plugin-users`
- `nocobase` plugin package name is `@nocobase/preset-nocobase`
- `hello` Plugin package named `@my-nocobase-app/plugin-hello`

### DB_DIALECT

Database type, default value `sqlite`, options include

- `sqlite`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_STORAGE

Database file path (configured when using a SQLite database)

```bash
### Relative path
DB_HOST=storage/db/nocobase.db
# Absolute path
DB_HOST=/your/path/nocobase.db
```

### DB_HOST

Database host (required when using MySQL or PostgreSQL databases)

Default value ``localhost``

```bash
DB_HOST=localhost
```

### DB_PORT

Database port (required when using MySQL or PostgreSQL databases)

- MySQL default port 3306
- PostgreSQL default port 5432

```bash
DB_PORT=3306
```

### DB_DATABASE

Database name (required when using MySQL or PostgreSQL databases)

```bash
DB_DATABASE=nocobase
```

### DB_USER

Database user (required when using MySQL or PostgreSQL databases)

```bash
DB_USER=nocobase
```

### DB_PASSWORD

Database password(required when using MySQL or PostgreSQL databases)

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

Data table prefix

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_LOGGING

Database logging switch, default value ``off``, options include

- `on` on
- `off` off

```bash
DB_LOGGING=on
```

### LOGGER_TRANSPORT

Log transport, default ``console,dailyRotateFile``, options include

- `console`
- `dailyRotateFile`

### DAILY_ROTATE_FILE_DIRNAME

`dailyRotateFile` path to store logs, default is `storage/logs`

## Temporary environment variables

When installing NocoBase, you can assist the installation by setting temporary environment variables, such as

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install

# Equivalent to
yarn nocobase install \
  --lang=zh-CN \
  --root-email=demo@nocobase.com \
  --root-password=admin123 \
  --root-nickname="Super Admin"

# Equivalent to
yarn nocobase install -l zh-CN -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INIT_APP_LANG

Language at installation, default value `en-US`, options include

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  nocobase install
```

### INIT_ROOT_EMAIL

Root user mailbox

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  nocobase install
```

### INIT_ROOT_PASSWORD

Root user password

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  nocobase install
```

### INIT_ROOT_NICKNAME

Root user nickname

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install
```
