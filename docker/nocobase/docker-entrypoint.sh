#!/bin/sh
set -e

echo "COMMIT_HASH: $(cat /app/commit_hash.txt)"

export NOCOBASE_RUNNING_IN_DOCKER=true

if [ -f /opt/libreoffice24.8.zip ] && [ ! -d /opt/libreoffice24.8 ]; then
  echo "Unzipping /opt/libreoffice24.8.zip..."
  unzip /opt/libreoffice24.8.zip -d /opt/
fi

if [ -f /opt/instantclient_19_25.zip ] && [ ! -d /opt/instantclient_19_25 ]; then
  echo "Unzipping /opt/instantclient_19_25.zip..."
  unzip /opt/instantclient_19_25.zip -d /opt/
  echo "/opt/instantclient_19_25" > /etc/ld.so.conf.d/oracle-instantclient.conf
  ldconfig
fi

if [ ! -d "/app/nocobase" ]; then
  mkdir nocobase
fi

if [ ! -f "/app/nocobase/package.json" ]; then
  echo 'copying...'
  tar -zxf /app/nocobase.tar.gz --absolute-names -C /app/nocobase
  touch /app/nocobase/node_modules/@nocobase/app/dist/client/index.html
fi

cd /app/nocobase && yarn nocobase create-nginx-conf
rm -rf /etc/nginx/sites-enabled/nocobase.conf
ln -s /app/nocobase/storage/nocobase.conf /etc/nginx/sites-enabled/nocobase.conf

nginx
echo 'nginx started';

# run scripts in storage/scripts
if [ -d "/app/nocobase/storage/scripts" ]; then
  for f in /app/nocobase/storage/scripts/*.sh; do
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
