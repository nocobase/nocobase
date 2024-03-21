################# NOCOBASE APPLICATION #################

# !!! When `APP_ENV=production`, opening http://localhost:13000/ will show "Not Found".
# !!! It is recommended to use nginx to proxy static files. For example https://github.com/nocobase/nocobase/blob/main/docker/nocobase/nocobase.conf
APP_ENV=development
APP_PORT=20000
APP_KEY=test-key-e2e
SOCKET_PATH=storage/gateway-e2e.sock
__E2E__=true

APPEND_PRESET_BUILT_IN_PLUGINS=mock-collections

API_BASE_PATH=/api/
API_BASE_URL=

PROXY_TARGET_URL=

LOGGER_TRANSPORT=
LOGGER_LEVEL=
LOGGER_BASE_PATH=storage/logs-e2e

################# DATABASE #################

DB_DIALECT=sqlite
DB_STORAGE=storage/db/nocobase-e2e.sqlite
DB_TABLE_PREFIX=
# DB_HOST=localhost
# DB_PORT=5432
# DB_DATABASE=nocobase-e2e
# DB_USER=nocobase
# DB_PASSWORD=nocobase
# DB_LOGGING=on
# DB_UNDERSCORED=false

################# STORAGE (Initialization only) #################

INIT_ROOT_EMAIL=admin@nocobase.com
INIT_ROOT_PASSWORD=admin123
INIT_ROOT_NICKNAME=Super Admin
INIT_ROOT_USERNAME=nocobase
