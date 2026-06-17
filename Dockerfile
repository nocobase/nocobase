FROM node:22-bookworm AS app-builder
ARG VERDACCIO_URL=http://host.docker.internal:10104/
ARG APPEND_PRESET_LOCAL_PLUGINS
ARG BEFORE_PACK_NOCOBASE="ls -l"
ARG PLUGINS_DIRS
ARG USE_ALIYUN_MIRROR=0

ENV PLUGINS_DIRS=${PLUGINS_DIRS}

RUN set -eux; \
  rm -f /etc/apt/sources.list.d/*.list /etc/apt/sources.list.d/*.sources; \
  if [ "$USE_ALIYUN_MIRROR" = "1" ]; then \
    printf '%s\n' \
      'deb http://mirrors.aliyun.com/debian bookworm main contrib non-free non-free-firmware' \
      'deb http://mirrors.aliyun.com/debian bookworm-updates main contrib non-free non-free-firmware' \
      'deb http://mirrors.aliyun.com/debian-security bookworm-security main contrib non-free non-free-firmware' \
      > /etc/apt/sources.list; \
  else \
    printf '%s\n' \
      'deb http://deb.debian.org/debian bookworm main contrib non-free non-free-firmware' \
      'deb http://deb.debian.org/debian bookworm-updates main contrib non-free non-free-firmware' \
      'deb http://deb.debian.org/debian-security bookworm-security main contrib non-free non-free-firmware' \
      > /etc/apt/sources.list; \
  fi; \
  apt-get update && apt-get install -y jq expect

SHELL ["/bin/bash", "-c"]

RUN expect <<EOD
spawn npm login --auth-type=legacy --registry $VERDACCIO_URL
expect {
  "Username:" {send "test\r"; exp_continue}
  "Password:" {send "test\r"; exp_continue}
  "Email: (this IS public)" {send "test@nocobase.com\r"; exp_continue}
}
EOD

RUN corepack enable pnpm && \
  corepack prepare pnpm@10.29.1 --activate && \
  pnpm config set registry $VERDACCIO_URL && \
  mkdir /app && \
  cd /app && \
  pnpm config set fetch-timeout 600000 -g && \
  pnpm create nocobase-app my-nocobase-app -a --skip-dev-dependencies -e APP_ENV=production -e APPEND_PRESET_LOCAL_PLUGINS=$APPEND_PRESET_LOCAL_PLUGINS && \
  cd /app/my-nocobase-app && \
  pnpm install --prod --ignore-scripts && \
  pnpm add newrelic --prod -w --config.strict-peer-dependencies=false --ignore-scripts && \
  $BEFORE_PACK_NOCOBASE && \
  rm -rf /app/my-nocobase-app/packages/app/client/src/.umi

COPY ./docker/nocobase/cleanup-node-modules.sh /usr/local/bin/cleanup-node-modules.sh

RUN chmod +x /usr/local/bin/cleanup-node-modules.sh && \
  cleanup-node-modules.sh /app/my-nocobase-app && \
  tar -zcf /nocobase.tar.gz -C /app/my-nocobase-app . && \
  rm -rf /app/my-nocobase-app

FROM scratch AS app-artifact
COPY --from=app-builder /nocobase.tar.gz /nocobase.tar.gz

FROM node:22-bookworm-slim AS docs-archive
ARG INCLUDE_DOCS_ARCHIVE=1
RUN mkdir -p /out
COPY dist.tar.gz /tmp/dist.tar.gz
RUN if [ "$INCLUDE_DOCS_ARCHIVE" = "1" ]; then \
    cp /tmp/dist.tar.gz /out/nocobase-docs.tar.gz; \
  fi && \
  rm -f /tmp/dist.tar.gz

FROM mysql:8.0.39 AS mysql-client-assets

FROM node:22-bookworm-slim AS runtime
ARG COMMIT_HASH
ARG INCLUDE_DOCS_ARCHIVE=1
ARG INSTALL_POSTGRES_16_CLIENT=1
ARG INSTALL_CJK_FONTS=1
ARG NGINX_VERSION=1.30.1-1~bookworm
ARG USE_ALIYUN_MIRROR=0
ENV NB_SKIP_STARTUP_UPDATE=1 \
    NOCOBASE_RUNNING_IN_DOCKER=true

COPY --from=mysql-client-assets /usr/bin/mysql /usr/bin/mysql
COPY --from=mysql-client-assets /usr/bin/mysqldump /usr/bin/mysqldump

RUN set -eux; \
  rm -f /etc/apt/sources.list.d/*.list /etc/apt/sources.list.d/*.sources; \
  if [ "$USE_ALIYUN_MIRROR" = "1" ]; then \
    printf '%s\n' \
      'deb http://mirrors.aliyun.com/debian bookworm main contrib non-free non-free-firmware' \
      'deb http://mirrors.aliyun.com/debian bookworm-updates main contrib non-free non-free-firmware' \
      'deb http://mirrors.aliyun.com/debian-security bookworm-security main contrib non-free non-free-firmware' \
      > /etc/apt/sources.list; \
    PGDG_MIRROR='http://mirrors.aliyun.com/postgresql/repos/apt'; \
  else \
    printf '%s\n' \
      'deb http://deb.debian.org/debian bookworm main contrib non-free non-free-firmware' \
      'deb http://deb.debian.org/debian bookworm-updates main contrib non-free non-free-firmware' \
      'deb http://deb.debian.org/debian-security bookworm-security main contrib non-free non-free-firmware' \
      > /etc/apt/sources.list; \
    PGDG_MIRROR='http://apt.postgresql.org/pub/repos/apt'; \
  fi; \
  apt-get update; \
  apt-get install -y --no-install-recommends wget gnupg ca-certificates; \
  echo "deb [signed-by=/usr/share/keyrings/pgdg.asc] ${PGDG_MIRROR} bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list; \
  wget --quiet -O /usr/share/keyrings/pgdg.asc https://www.postgresql.org/media/keys/ACCC4CF8.asc; \
  wget --quiet -O /tmp/nginx_signing.key https://nginx.org/keys/nginx_signing.key; \
  gpg --batch --yes --dearmor -o /usr/share/keyrings/nginx-archive-keyring.gpg /tmp/nginx_signing.key; \
  printf '%s\n' \
    'deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] https://nginx.org/packages/debian bookworm nginx' \
    > /etc/apt/sources.list.d/nginx.list; \
  apt-get update; \
  apt-get install -y --no-install-recommends \
    "nginx=${NGINX_VERSION}" \
    libaio1 \
    postgresql-client-17 \
    libfreetype6 \
    fontconfig \
    libgssapi-krb5-2 \
    libncurses6 \
    fonts-liberation; \
  if [ "$INSTALL_POSTGRES_16_CLIENT" = "1" ]; then \
    apt-get install -y --no-install-recommends postgresql-client-16; \
  fi; \
  if [ "$INSTALL_CJK_FONTS" = "1" ]; then \
    apt-get install -y --no-install-recommends fonts-noto-cjk; \
  fi; \
  nginx -v; \
  mysql --version; \
  mysqldump --version; \
  apt-get purge -y --auto-remove wget gnupg dirmngr; \
  rm -rf \
    /etc/apt/sources.list.d/nginx.list \
    /tmp/nginx_signing.key \
    /usr/share/keyrings/nginx-archive-keyring.gpg \
    /var/lib/apt/lists/* \
    /usr/share/doc/* \
    /usr/share/man/*

RUN rm -rf /etc/nginx/conf.d/default.conf
COPY ./docker/nocobase/nocobase-docs.conf /etc/nginx/conf.d/nocobase-docs.conf
ADD nocobase.tar.gz /app/nocobase/
COPY --from=docs-archive /out/ /app/

WORKDIR /app/nocobase

RUN ln -sf /app/nocobase/node_modules/.bin/nb /usr/local/bin/nb && \
  mkdir -p /app/nocobase/docs /app/nocobase/storage/uploads /app/nocobase/node_modules/@nocobase/app/dist/client && \
  touch /app/nocobase/node_modules/@nocobase/app/dist/client/index.html && \
  echo "$COMMIT_HASH" > /app/commit_hash.txt

COPY ./docker/nocobase/docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

CMD ["/app/docker-entrypoint.sh"]
