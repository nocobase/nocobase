# ============================================================
# NocoBase 本地源码构建 Dockerfile
# 基于本地 node:22-bookworm-slim 镜像，从源码构建应用
# 不使用任何远程 Docker 仓库的 NocoBase 镜像
# ============================================================

# 构建阶段
FROM node:22-bookworm-slim as builder

ARG NODE_ENV=production

# 安装构建依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# 复制源码
COPY . .

# 安装依赖并构建
RUN yarn install --production=false && \
    yarn build

# ============================================================
# 运行阶段
# ============================================================
FROM node:22-bookworm-slim as runtime

ARG NODE_ENV=production
ARG COMMIT_HASH=latest

# 安装运行时依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget gnupg ca-certificates \
    libaio1 \
    libfreetype6 \
    fontconfig \
    libgssapi-krb5-2 \
    fonts-liberation \
    fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/nocobase

# 复制构建产物
COPY --from=builder /build .

# 创建存储目录
RUN mkdir -p /app/nocobase/storage/uploads/ && \
    echo "$COMMIT_HASH" > /app/nocobase/storage/uploads/COMMIT_HASH

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

# 启动命令
CMD ["yarn", "start"]
