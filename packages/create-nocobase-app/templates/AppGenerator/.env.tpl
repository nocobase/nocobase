########## DOCKER COMPOSE ENV ##########
ADMINER_PORT=8080
DB_MYSQL_PORT=3306
DB_POSTGRES_PORT=5432
VERDACCIO_PORT=4873
APP_PORT=13001
API_PORT=13002

########## NOCOBASE ENV ##########

# DATABASE
DB_DIALECT=sqlite
DB_STORAGE=db.sqlite

# DB_DIALECT=postgres
# DB_HOST=localhost
# DB_PORT=5432
# DB_DATABASE=nocobase
# DB_USER=nocobase
# DB_PASSWORD=nocobase

# set to 'on' to enable log
DB_LOG_SQL=

# API & APP

NOCOBASE_ENV=

# api server access point will be proxied from app(web when `umi dev`)
API_ORIGIN_DEV=http://localhost:13002
# api server access point for app(web when build)
API_ORIGIN=

# api base path endpoint for app(web)
API_BASE_PATH=/api/

# ADMIN USER (Initialization only)

ADMIN_EMAIL=admin@nocobase.com
ADMIN_PASSWORD=admin123

# STORAGE (Initialization only)

# local or ali-oss
DEFAULT_STORAGE_TYPE=local

# LOCAL STORAGE
LOCAL_STORAGE_USE_STATIC_SERVER=true
LOCAL_STORAGE_BASE_URL=http://localhost:13002

# ALI OSS STORAGE
ALI_OSS_STORAGE_BASE_URL=
ALI_OSS_REGION=oss-cn-beijing
ALI_OSS_ACCESS_KEY_ID=
ALI_OSS_ACCESS_KEY_SECRET=
ALI_OSS_BUCKET=

# AWS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_REGION=
AWS_S3_BUCKET=
AWS_S3_STORAGE_BASE_URL=
