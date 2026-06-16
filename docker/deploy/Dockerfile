# ============================================================
# NocoBase 本地源码构建 Dockerfile
# 基于 node:22-bookworm-slim，从源码构建完整应用
# ============================================================

# ============================================================
# 阶段 1: 打包已安装的 NocoBase 应用
# ============================================================
FROM node:22-bookworm-slim as builder

WORKDIR /build

# 复制项目元数据和依赖
COPY package.json yarn.lock lerna.json tsconfig.json ./
COPY packages packages

# 复制 node_modules（由 GitHub Actions 预先安装）
COPY node_modules node_modules

# 打包应用（排除不必要的文件以减小体积）
RUN tar -zcf /nocobase.tar.gz \
    --exclude='node_modules/.cache' \
    --exclude='.git' \
    --exclude='packages/**/src' \
    --exclude='packages/**/__tests__' \
    --exclude='packages/**/*.test.*' \
    --exclude='packages/**/*.spec.*' \
    --exclude='docs' \
    --exclude='*.md' \
    --exclude='storage/uploads' \
    --exclude='storage/backups' \
    .

# ============================================================
# 阶段 2: 运行环境
# ============================================================
FROM node:22-bookworm-slim as runtime

ARG NODE_ENV=production
ARG COMMIT_HASH=latest

# 安装运行时依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    ca-certificates \
    libaio1 \
    libfreetype6 \
    fontconfig \
    libgssapi-krb5-2 \
    fonts-liberation \
    fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

# 安装 PostgreSQL 客户端（用于数据库迁移和备份）
RUN echo "deb [signed-by=/usr/share/keyrings/pgdg.asc] http://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && wget --quiet -O /usr/share/keyrings/pgdg.asc https://www.postgresql.org/media/keys/ACCC4CF8.asc \
    && apt-get update && apt-get install -y --no-install-recommends postgresql-client-17 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/nocobase

# 复制构建产物
COPY --from=builder /nocobase.tar.gz /app/nocobase.tar.gz

# 解压应用并清理
RUN tar -zxf /app/nocobase.tar.gz -C /app/nocobase \
    && rm /app/nocobase.tar.gz \
    && mkdir -p /app/nocobase/storage/uploads/ \
    && echo "$COMMIT_HASH" > /app/nocobase/storage/uploads/COMMIT_HASH

# 创建启动脚本
RUN cat > /app/docker-entrypoint.sh << 'SCRIPT'
#!/bin/bash
set -e

export NOCOBASE_RUNNING_IN_DOCKER=true
export NODE_ENV=${NODE_ENV:-production}

cd /app/nocobase

# 确保 node_modules/.bin 在 PATH 中
export PATH="/app/nocobase/node_modules/.bin:$PATH"

# 等待数据库就绪
echo "Waiting for database to be ready..."
for i in $(seq 1 30); do
    if yarn nocobase db:auth 2>/dev/null; then
        echo "Database is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "Database connection timeout after 30 attempts"
        exit 1
    fi
    sleep 2
done

# 执行数据库迁移（如果需要）
yarn nocobase upgrade || true

# 启动应用
exec yarn start
SCRIPT

RUN chmod +x /app/docker-entrypoint.sh

# 暴露端口
EXPOSE 13000/tcp

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:13000/api/health || exit 1

# 启动命令
CMD ["/app/docker-entrypoint.sh"]
