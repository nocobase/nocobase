################# NOCOBASE APPLICATION #################

NOCOBASE_ENV=development

SERVER_PORT=3000

# api base path endpoint for app(web)
SERVER_BASE_PATH=/api/

# api server access point for app(web when build)
SERVER_BASE_URL=

JWT_SECRET={{{env.JWT_SECRET}}}

################# DATABASE #################

DB_LOG_SQL=off
DB_DIALECT={{{env.DB_DIALECT}}}
{{{envs}}}

################# STORAGE (Initialization only) #################

# local or ali-oss
DEFAULT_STORAGE_TYPE=local

# LOCAL STORAGE
LOCAL_STORAGE_USE_STATIC_SERVER=true
LOCAL_STORAGE_BASE_URL=
LOCAL_STORAGE_DEST=storage/uploads

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
