#!/bin/sh
set -e

nginx
echo 'nginx started';

if [ ! -d "/app/nocobase" ]; then
  mkdir nocobase
fi

if [ ! -f "/app/nocobase/package.json" ]; then
  echo 'copying...'
  tar -zxf /app/nocobase.tar.gz --absolute-names -C /app/nocobase
fi

cd /app/nocobase && yarn nocobase db:auth --retry=30
cd /app/nocobase && yarn nocobase install -s
cd /app/nocobase && yarn nocobase upgrade -S
cd /app/nocobase && yarn start

# Run command with node if the first argument contains a "-" or is not a system command. The last
# part inside the "{}" is a workaround for the following bug in ash/dash:
# https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=874264
if [ "${1#-}" != "${1}" ] || [ -z "$(command -v "${1}")" ] || { [ -f "${1}" ] && ! [ -x "${1}" ]; }; then
  set -- node "$@"
fi

exec "$@"
