########## DOCKER COMPOSE ENV ##########
DB_POSTGRES_PORT=15432
APP_PORT=13000
ADMINER_PORT=18080

# set to 'on' to enable log
DB_LOG_SQL=on

{{#quickstart}}
DB_DIALECT=sqlite
DB_STORAGE=db.sqlite
{{/quickstart}}
{{^quickstart}}
DB_HOST=localhost
DB_PORT=15432
DB_DATABASE=nocobase
DB_DIALECT=pgsql
DB_USER=
DB_PASSWORD=
{{/quickstart}}

# API & APP

NOCOBASE_ENV=
API_PORT=13001
API_URL=/api/

# ADMIN USER (Initialization only)

ADMIN_EMAIL=admin@nocobase.com
ADMIN_PASSWORD=admin

# STORAGE (Initialization only)

# local or ali-oss
STORAGE_TYPE=local

# LOCAL STORAGE
LOCAL_STORAGE_USE_STATIC_SERVER=true
LOCAL_STORAGE_BASE_URL=http://localhost:23000

