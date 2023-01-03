# Environment Variables

## Global Environment Variables

Saved in the `.env` file

### APP_ENV

Application environment, default is `development`, options include

- `production` production environment
- `development` development environment

```bash
APP_ENV=production
```

### APP_HOST

Application host, default is `0.0.0.0`

```bash
APP_HOST=192.168.3.154
```

### APP_PORT

Application port, default is `13000`

```bash
APP_PORT=13000
```

### APP_KEY

Secret key, for scenarios such as jwt

```bash
APP_KEY=app-key-test
```

### API_BASE_PATH

NocoBase API address prefix, default is `/api/`

```bash
API_BASE_PATH=/api/
```

### PLUGIN_PACKAGE_PREFIX

Plugin package prefix, default is `@nocobase/plugin-,@nocobase/preset-`

For example, add plugin `hello` into project `my-nocobase-app`, the plugin package name is `@my-nocobase-app/plugin-hello`.

PLUGIN_PACKAGE_PREFIX is configured as follows:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

The correspondence between plugin name and package name is:

- `users` plugin package name is `@nocobase/plugin-users`
- `nocobase` plugin package name is `@nocobase/preset-nocobase`
- `hello` plugin package name is `@my-nocobase-app/plugin-hello`

### DB_DIALECT

Database type, default is `sqlite`, options include

- `sqlite`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_STORAGE

Database file path (required when using a SQLite database)

```bash
### Relative path
DB_HOST=storage/db/nocobase.db
# Absolute path
DB_HOST=/your/path/nocobase.db
```

### DB_HOST

Database host (required when using MySQL or PostgreSQL databases)

Default is `localhost`

```bash
DB_HOST=localhost
```

### DB_PORT

Database port (required when using MySQL or PostgreSQL databases)

- Default port of MySQL is 3306
- Default port of PostgreSQL is 5432

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

Database password (required when using MySQL or PostgreSQL databases)

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

Data table prefix

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_LOGGING

Database log switch, default is `off`, options include

- `on` on
- `off` off

```bash
DB_LOGGING=on
```

### LOGGER_TRANSPORT

Log transport, default is `console,dailyRotateFile`, options include

- `console`
- `dailyRotateFile`

### DAILY_ROTATE_FILE_DIRNAME

Path to save `dailyRotateFile` logs, default is `storage/logs`

## Temporary Environment Variables

The installation of NocoBase can be assited by setting temporary environment variables, such as:

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

Language at the time of installation, default is `en-US`, options include

- `en-US` English
- `zh-CN` Chinese (Simplified)

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
