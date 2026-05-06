FROM node:22-bookworm as app-builder
ARG VERDACCIO_URL=http://host.docker.internal:10104/
ARG APPEND_PRESET_LOCAL_PLUGINS
ARG BEFORE_PACK_NOCOBASE="ls -l"
ARG PLUGINS_DIRS

ENV PLUGINS_DIRS=${PLUGINS_DIRS}

RUN apt-get update && apt-get install -y jq expect

SHELL ["/bin/bash", "-c"]

RUN expect <<EOD
spawn npm login --auth-type=legacy --registry $VERDACCIO_URL
expect {
  "Username:" {send "test\r"; exp_continue}
  "Password:" {send "test\r"; exp_continue}
  "Email: (this IS public)" {send "test@nocobase.com\r"; exp_continue}
}
EOD

RUN yarn config set registry $VERDACCIO_URL && \
  mkdir /app && \
  cd /app && \
  yarn config set network-timeout 600000 -g && \
  yarn create nocobase-app my-nocobase-app -a -e APP_ENV=production -e APPEND_PRESET_LOCAL_PLUGINS=$APPEND_PRESET_LOCAL_PLUGINS && \
  cd /app/my-nocobase-app && \
  yarn install --production && \
  yarn add newrelic --production -W && \
  $BEFORE_PACK_NOCOBASE && \
  rm -rf /app/my-nocobase-app/packages/app/client/src/.umi && \
  tar -zcf /nocobase.tar.gz -C /app/my-nocobase-app . && \
  rm -rf /app/my-nocobase-app

FROM scratch as app-artifact
COPY --from=app-builder /nocobase.tar.gz /nocobase.tar.gz

FROM node:22-bookworm-slim as runtime
ARG COMMIT_HASH
ARG NGINX_VERSION=1.30.0

RUN apt-get update && apt-get install -y --no-install-recommends wget gnupg ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN echo "deb [signed-by=/usr/share/keyrings/pgdg.asc] http://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list
RUN wget --quiet -O /usr/share/keyrings/pgdg.asc https://www.postgresql.org/media/keys/ACCC4CF8.asc

RUN apt-get update && apt-get install -y --no-install-recommends \
  libaio1 \
  postgresql-client-16 \
  postgresql-client-17 \
  libfreetype6 \
  fontconfig \
  libgssapi-krb5-2 \
  fonts-liberation \
  fonts-noto-cjk \
  wget \
  build-essential \
  libssl-dev \
  libxml2-dev \
  libxslt1-dev \
  libpcre3-dev \
  zlib1g-dev \
  && rm -rf /var/lib/apt/lists/*

RUN wget http://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz -O /tmp/nginx.tar.gz \
 && tar -zxvf /tmp/nginx.tar.gz -C /tmp \
 && mv /tmp/nginx-${NGINX_VERSION} /tmp/nginx \
 && rm -f /tmp/nginx.tar.gz

RUN cd /tmp/nginx && ./configure \
    --prefix=/usr/share/nginx \
    --sbin-path=/usr/sbin/nginx \
    --conf-path=/etc/nginx/nginx.conf \
    --pid-path=/run/nginx.pid \
    --lock-path=/run/lock/nginx.lock \
    --error-log-path=/var/log/nginx/error.log \
    --http-log-path=/var/log/nginx/access.log \
    --modules-path=/usr/lib/nginx/modules \
    --with-compat \
    --with-http_ssl_module \
 && make \
 && make install \
 && rm -rf /tmp/nginx

RUN mkdir -p /etc/nginx/sites-enabled/ \
 && rm -f /etc/nginx/sites-enabled/default
COPY ./docker/nocobase/nocobase-docs.conf /etc/nginx/sites-enabled/nocobase-docs.conf
COPY nocobase.tar.gz /app/nocobase.tar.gz
COPY dist.tar.gz /app/nocobase-docs.tar.gz

WORKDIR /app/nocobase

RUN mkdir -p /app/nocobase/storage/uploads/ && \
  echo "$COMMIT_HASH" > /app/nocobase/storage/uploads/COMMIT_HASH && \
  echo "$COMMIT_HASH" > /app/commit_hash.txt

COPY ./docker/nocobase/docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

RUN apt-get purge -y \
    build-essential \
    libssl-dev \
    libxml2-dev \
    libxslt1-dev \
    libpcre3-dev \
    zlib1g-dev \
    linux-libc-dev \
 && apt-get autoremove -y \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

CMD ["/app/docker-entrypoint.sh"]
