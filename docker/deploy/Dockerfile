# ============================================================
# NocoBase 本地源码构建 Dockerfile
# 基础镜像: node:22-bookworm-slim（本地已有）
# 不使用任何远程 Docker 仓库镜像
# ============================================================

# ============================================================
# 阶段 1: 打包已安装的 NocoBase 应用
# ============================================================
FROM node:22-bookworm-slim as builder

WORKDIR /build

# 先复制 package.json 和 node_modules（绕过 .dockerignore）
COPY package.json yarn.lock lerna.json tsconfig.json ./
COPY packages packages

# 复制 node_modules（使用通配符绕过 .dockerignore 的 node_modules 排除）
COPY node_modules node_modules

# 打包应用
RUN tar -zcf /nocobase.tar.gz \
    --exclude='node_modules/.cache' \
    --exclude='.git' \
    --exclude='packages/**/src' \
    --exclude='packages/**/__tests__' \
    --exclude='packages/**/*.test.*' \
    --exclude='packages/**/*.spec.*' \
    --exclude='docs' \
    --exclude='*.md' \
    .

# ============================================================
# 阶段 2: 运行环境
# ============================================================
FROM node:22-bookworm-slim as runtime

ARG NODE_ENV=production
ARG COMMIT_HASH=latest

WORKDIR /app/nocobase

# 复制构建产物
COPY --from=builder /nocobase.tar.gz /app/nocobase.tar.gz

# 解压应用
RUN tar -zxf /app/nocobase.tar.gz -C /app/nocobase && \
    rm /app/nocobase.tar.gz && \
    mkdir -p /app/nocobase/storage/uploads/ && \
    echo "$COMMIT_HASH" > /app/nocobase/storage/uploads/COMMIT_HASH

# 创建启动脚本
RUN cat > /app/docker-entrypoint.sh << 'SCRIPT'
#!/bin/bash
set -e

export NOCOBASE_RUNNING_IN_DOCKER=true

cd /app/nocobase

# 确保 node_modules/.bin 在 PATH 中
export PATH="/app/nocobase/node_modules/.bin:$PATH"

# 数据库认证
yarn nocobase db:auth || true

# 启动应用
exec yarn start --quickstart
SCRIPT

RUN chmod +x /app/docker-entrypoint.sh

# 暴露端口
EXPOSE 13000/tcp

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:13000/ || exit 1

# 启动命令
CMD ["/app/docker-entrypoint.sh"]
