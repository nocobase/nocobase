#!/bin/sh
set -e

echo "COMMIT_HASH: $(cat /app/commit_hash.txt)"

if [ ! -d "/app/nocobase" ]; then
  mkdir nocobase
fi

if [ ! -f "/app/nocobase/package.json" ]; then
  echo "Missing /app/nocobase/package.json; the image is expected to include a pre-extracted app directory."
  exit 1
fi

cd /app/nocobase && yarn nocobase postinstall
case "${NOCOBASE_EXTRACT_CLIENT_ASSETS:-false}" in
  1|true|TRUE|yes|YES)
    echo 'NOCOBASE_EXTRACT_CLIENT_ASSETS is enabled; extracting client assets...'
    cd /app/nocobase && yarn nocobase client:extract
    ;;
esac

if [ -z "${CDN_BASE_URL:-}" ]; then
  ACTIVE_VERSION_FILE='/app/nocobase/storage/dist-client/active-version'
  if [ -f "${ACTIVE_VERSION_FILE}" ]; then
    ACTIVE_VERSION="$(tr -d '\r\n' < "${ACTIVE_VERSION_FILE}")"
    if [ -n "${ACTIVE_VERSION}" ]; then
      APP_PUBLIC_PATH_VALUE="${APP_PUBLIC_PATH:-/}"
      case "${APP_PUBLIC_PATH_VALUE}" in
        /*) ;;
        *) APP_PUBLIC_PATH_VALUE="/${APP_PUBLIC_PATH_VALUE}" ;;
      esac
      APP_PUBLIC_PATH_VALUE="${APP_PUBLIC_PATH_VALUE%/}/"
      export CDN_BASE_URL="${APP_PUBLIC_PATH_VALUE%/}/dist/${ACTIVE_VERSION}/"
      echo "CDN_BASE_URL is not set; defaulting to ${CDN_BASE_URL}"
    fi
  fi
fi

NGINX_STORAGE_PATH="${NGINX_STORAGE_PATH:-/app/nocobase/storage}"
NGINX_CONF_PATH="${NGINX_STORAGE_PATH}/nocobase.conf"
NGINX_UPSTREAM_HOST="${NGINX_UPSTREAM_HOST:-127.0.0.1}"

cd /app/nocobase && yarn nocobase db:auth
cd /app/nocobase && yarn nocobase generate-instance-id

case "${NOCOBASE_EXTRACT_CLIENT_ASSETS:-false}" in
  1|true|TRUE|yes|YES)
    if [ -z "${ACTIVE_VERSION_FILE:-}" ] || [ ! -f "${ACTIVE_VERSION_FILE}" ]; then
      echo 'Missing dist-client active-version; cannot generate nginx proxy config from extracted client assets.'
      exit 1
    fi
    ACTIVE_VERSION="$(tr -d '\r\n' < "${ACTIVE_VERSION_FILE}")"
    if [ -z "${ACTIVE_VERSION}" ]; then
      echo 'dist-client active-version is empty; cannot generate nginx proxy config from extracted client assets.'
      exit 1
    fi

    export NB_CLI_ROOT=/app/nocobase/storage
    APP_PUBLIC_PATH_VALUE="${APP_PUBLIC_PATH:-/}"
    echo 'NOCOBASE_EXTRACT_CLIENT_ASSETS is enabled; generating nginx proxy config via nb proxy nginx.'
    cd /app/nocobase && nb proxy nginx generate \
      --manual \
      --name default \
      --app-port "${APP_PORT:-13000}" \
      --storage-path "${NGINX_STORAGE_PATH}" \
      --dist-root-path /app/nocobase/storage/dist-client \
      --runtime-version "${ACTIVE_VERSION}" \
      --app-public-path "${APP_PUBLIC_PATH_VALUE}" \
      --upstream-host "${NGINX_UPSTREAM_HOST}"
    NGINX_CONF_PATH="${NB_CLI_ROOT}/.nocobase/proxy/nginx/nocobase.conf"
    ;;
  *)
    cd /app/nocobase && yarn nocobase create-nginx-conf
    ;;
esac

if command -v nginx >/dev/null 2>&1; then
  rm -f /etc/nginx/conf.d/nocobase.conf
  ln -s "${NGINX_CONF_PATH}" /etc/nginx/conf.d/nocobase.conf
  nginx
  echo 'nginx started'
fi

# run scripts in storage/scripts
if [ -d "/app/nocobase/storage/scripts" ]; then
  for f in /app/nocobase/storage/scripts/*.sh; do
    [ -e "$f" ] || continue
    echo "Running $f"
    sh "$f"
  done
fi

cd /app/nocobase && yarn start --quickstart

# Run command with node if the first argument contains a "-" or is not a system command. The last
# part inside the "{}" is a workaround for the following bug in ash/dash:
# https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=874264
if [ "${1#-}" != "${1}" ] || [ -z "$(command -v "${1}")" ] || { [ -f "${1}" ] && ! [ -x "${1}" ]; }; then
  set -- node "$@"
fi

exec "$@"
