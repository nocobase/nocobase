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

cd /app/nocobase && pnpm nocobase postinstall
case "${NOCOBASE_EXTRACT_CLIENT_ASSETS:-false}" in
  1|true|TRUE|yes|YES)
    echo 'NOCOBASE_EXTRACT_CLIENT_ASSETS is enabled; extracting client assets...'
    cd /app/nocobase && pnpm nocobase client:extract
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

cd /app/nocobase && pnpm nocobase db:auth
cd /app/nocobase && pnpm nocobase create-nginx-conf
cd /app/nocobase && pnpm nocobase generate-instance-id
rm -f /etc/nginx/conf.d/nocobase.conf
ln -s /app/nocobase/storage/nocobase.conf /etc/nginx/conf.d/nocobase.conf

nginx
echo 'nginx started';

# run scripts in storage/scripts
if [ -d "/app/nocobase/storage/scripts" ]; then
  for f in /app/nocobase/storage/scripts/*.sh; do
    [ -e "$f" ] || continue
    echo "Running $f"
    sh "$f"
  done
fi

cd /app/nocobase && pnpm start --quickstart

# Run command with node if the first argument contains a "-" or is not a system command. The last
# part inside the "{}" is a workaround for the following bug in ash/dash:
# https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=874264
if [ "${1#-}" != "${1}" ] || [ -z "$(command -v "${1}")" ] || { [ -f "${1}" ] && ! [ -x "${1}" ]; }; then
  set -- node "$@"
fi

exec "$@"
