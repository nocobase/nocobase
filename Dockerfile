# ========== 构建阶段 ==========
FROM node:20-bookworm AS builder

ARG VERDACCIO_URL=http://host.docker.internal:10104/
ARG COMMIT_HASH
ARG APPEND_PRESET_LOCAL_PLUGINS
ARG BEFORE_PACK_NOCOBASE="ls -l"
ARG PLUGINS_DIRS

ENV PLUGINS_DIRS=${PLUGINS_DIRS}

# 安装依赖
RUN apt-get update && apt-get install -y --no-install-recommends jq expect git && rm -rf /var/lib/apt/lists/*

# 登录私有 npm
RUN expect <<EOD
spawn npm adduser --registry $VERDACCIO_URL
expect {
  "Username:" {send "test\r"; exp_continue}
  "Password:" {send "test\r"; exp_continue}
  "Email: (this IS public)" {send "test@nocobase.com\r"; exp_continue}
}
EOD

WORKDIR /build
COPY . .

# ⚡️ 合并为单层命令，防止 node_modules 占空间
RUN yarn install && \
    yarn build --no-dts && \
    CURRENTVERSION="$(jq -r '.version' lerna.json)" && \
    IFS='.-' read -r major minor patch label <<< "$CURRENTVERSION" && \
    if [ -z "$label" ]; then CURRENTVERSION="$CURRENTVERSION-rc"; fi && \
    NEWVERSION="${CURRENTVERSION}.$(date +'%Y%m%d%H%M%S')" && \
    git config user.email "test@mail.com" && \
    git config user.name "test" && \
    git checkout -b "release-$(date +'%Y%m%d%H%M%S')" && \
    yarn lerna version "$NEWVERSION" -y --no-git-tag-version && \
    git add . && git commit -m "chore(versions): test publish packages" && \
    yarn release:force --registry $VERDACCIO_URL && \
    yarn config set registry $VERDACCIO_URL && \
    cd docs && yarn install && yarn build && \
    cd .. && \
    yarn create nocobase-app my-nocobase-app -a \
      -e APP_ENV=production \
      -e APPEND_PRESET_LOCAL_PLUGINS=$APPEND_PRESET_LOCAL_PLUGINS && \
    cd my-nocobase-app && \
    yarn install --production && \
    yarn add newrelic --production -W && \
    mkdir -p /build/my-nocobase-app/docs && \
    cp -r /build/docs/dist /build/my-nocobase-app/docs && \
    cd /build/my-nocobase-app && \
    $BEFORE_PACK_NOCOBASE && \
    rm -rf packages/app/client/src/.umi && \
    tar -zcf /build/nocobase.tar.gz -C /build/my-nocobase-app .

# ========== 运行阶段 ==========
FROM node:20-bookworm-slim

# 安装必要依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    libaio1 \
    postgresql-client-16 \
    libfreetype6 \
    fontconfig \
    fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

RUN rm -rf /etc/nginx/sites-enabled/default
COPY ./docker/nocobase/nocobase.conf /etc/nginx/sites-enabled/nocobase.conf

WORKDIR /app/nocobase
COPY --from=builder /build/nocobase.tar.gz /app/nocobase.tar.gz
COPY ./docker/nocobase/docker-entrypoint.sh /app/

RUN mkdir -p /app/nocobase/storage/uploads/ && \
    echo "$COMMIT_HASH" > /app/nocobase/storage/uploads/COMMIT_HASH

CMD ["/app/docker-entrypoint.sh"]