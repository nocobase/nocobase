# Environment variables

## Global environment variables

Saved in the `.env` file

### APP_ENV

Application environment, default value `development`, options include

- `production` production environment
- `development` development environment

```bash
APP_ENV=production
```

### APP_HOST

Application host, default value `0.0.0.0`

```bash
APP_HOST=192.168.3.154
```

### APP_PORT

Application port, default value `13000`

```bash
APP_PORT=13000
```

### APP_KEY

Secret key for scenarios such as jwt

```bash
APP_KEY=app-key-test
```

### API_BASE_PATH

NocoBase API address prefix, default value `/api/`

```bash
API_BASE_PATH=/api/
```

### DB_DIALECT

Database type, default value `sqlite`，options include

- `sqlite`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_STORAGE

Database file path (configured when using SQLite)

```bash
# Relative path
DB_HOST=storage/db/nocobase.db
# Absolute path
DB_HOST=/your/path/nocobase.db
```

### DB_HOST

Database host (required when using MySQL or PostgreSQL)

Default value `localhost`

```bash
DB_HOST=localhost
```

### DB_PORT

Database port (required when using MySQL or PostgreSQL)

- MySQL default port 3306
- PostgreSQL default port 5432

```bash
DB_PORT=3306
```

### DB_DATABASE

Database name (required when using MySQL or PostgreSQL)

```bash
DB_DATABASE=nocobase
```

### DB_USER

Database user (required when using MySQL or PostgreSQL)

```bash
DB_USER=nocobase
```

### DB_PASSWORD

Database password (required when using MySQL or PostgreSQL)

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

Data Table Prefix

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_LOGGING

Switching of logs, default value `off`, options include：

- `on` On
- `off` Off

```bash
DB_LOGGING=on
```

## Temporary environment variables

When installing NocoBase, you can assist in the installation by setting temporary environment variables, such as

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install

# Equivalent to
yarn nocobase install \
  --lang=en-US  \
  --root-email=demo@nocobase.com \
  --root-password=admin123 \
  --root-nickname="Super Admin"

# Equivalent to
yarn nocobase install -l en-US -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INIT_APP_LANG

Language at installation, default value `en-US`, options include

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  nocobase install
```

### INIT_ROOT_EMAIL

Root user's email

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  nocobase install
```

### INIT_ROOT_PASSWORD

Root user's password

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  nocobase install
```

### INIT_ROOT_NICKNAME

Root user's name

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install
```
