# ============================================================
# NocoBase 本地源码构建 Dockerfile
# 基础镜像: node:22-bookworm-slim（本地已有）
# 不使用任何远程 Docker 仓库镜像
# ============================================================

# ============================================================
# 阶段 1: 构建 NocoBase 应用
# ============================================================
FROM node:22-bookworm-slim as builder

ARG NODE_ENV=production

# 安装构建依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# 复制源码（利用 .dockerignore 排除不必要文件）
COPY . .

# 安装依赖
RUN yarn config set network-timeout 600000 -g && \
    yarn install --production=false

# 构建应用
RUN yarn build

# 打包应用
RUN tar -zcf /nocobase.tar.gz \
    --exclude='node_modules/.cache' \
    --exclude='.git' \
    --exclude='packages/**/src' \
    --exclude='packages/**/__tests__' \
    --exclude='packages/**/*.test.*' \
    --exclude='packages/**/*.spec.*' \
    .

# ============================================================
# 阶段 2: 运行环境
# ============================================================
FROM node:22-bookworm-slim as runtime

ARG NODE_ENV=production
ARG COMMIT_HASH=latest

# 安装运行时依赖（nginx 用于内部反向代理）
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget gnupg ca-certificates \
    libaio1 \
    libfreetype6 \
    fontconfig \
    libgssapi-krb5-2 \
    fonts-liberation \
    fonts-noto-cjk \
    nginx \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/nocobase

# 复制构建产物
COPY --from=builder /nocobase.tar.gz /app/nocobase.tar.gz

# 解压应用
RUN tar -zxf /app/nocobase.tar.gz -C /app/nocobase && \
    rm /app/nocobase.tar.gz && \
    mkdir -p /app/nocobase/storage/uploads/ && \
    echo "$COMMIT_HASH" > /app/nocobase/storage/uploads/COMMIT_HASH

# 安装生产依赖
RUN cd /app/nocobase && yarn install --production

# 执行 postinstall
RUN cd /app/nocobase && yarn nocobase postinstall

# 配置 Nginx（NocoBase 内置 nginx 作为内部代理）
RUN rm -rf /etc/nginx/sites-enabled/default && \
    cd /app/nocobase && yarn nocobase create-nginx-conf && \
    ln -sf /app/nocobase/storage/nocobase.conf /etc/nginx/sites-enabled/nocobase.conf

# 创建启动脚本
RUN cat > /app/docker-entrypoint.sh << 'SCRIPT'
#!/bin/bash
set -e

export NOCOBASE_RUNNING_IN_DOCKER=true

cd /app/nocobase

# 启动 Nginx
nginx
echo 'nginx started'

# 数据库认证
yarn nocobase db:auth || true

# 启动应用
exec yarn start --quickstart
SCRIPT

RUN chmod +x /app/docker-entrypoint.sh

# 暴露端口
EXPOSE 80/tcp

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

# 启动命令
CMD ["/app/docker-entrypoint.sh"]
