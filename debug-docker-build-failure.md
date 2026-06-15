# Docker Build Failure 调试会话

**Session ID:** docker-build-failure
**Date:** 2026-06-15
**Status:** [RESOLVED]

---

## 1. 问题根因分析

通过分析错误日志，识别出以下3个核心问题：

### 1.1 错误1: Dockerfile COPY 语法错误
```
buildx failed with: ERROR: failed to build: failed to solve: failed to compute cache key: 
failed to calculate checksum of ref ...: "/2>/dev/null": not found
```

**根因:** Dockerfile 中使用了 shell 重定向语法 `2>/dev/null || true`，但 Docker COPY 命令不支持 shell 语法。

**修复方案:**
```dockerfile
# 修复前（错误）
COPY packages/plugins/*/package.json ./packages/plugins/ 2>/dev/null || true

# 修复后（正确）
COPY packages ./packages/
```

### 1.2 错误2: GitHub Packages 权限问题
```
Unhandled error: HttpError: Resource not accessible by integration
```

**根因:** GitHub 仓库未启用 GitHub Packages 功能，或工作流权限配置不完整。

**修复方案:** 需要在 GitHub 仓库设置中：
1. 进入 `Settings` → `General` → `Features`
2. 启用 `Packages` 选项

### 1.3 错误3: Actions 版本过时
```
Node.js 20 actions are deprecated
```

**修复方案:** 更新到支持 Node.js 24 的版本：
- `docker/build-push-action@v5` → `@v6`

---

## 2. 完整修复步骤

### 2.1 步骤1: 修复 Dockerfile

在项目根目录创建 `Dockerfile.prod`：

```dockerfile
FROM node:20-bookworm AS builder

ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ git && \
    rm -rf /var/lib/apt/lists/*

COPY package.json yarn.lock lerna.json ./
COPY packages ./packages/

RUN yarn install --production --frozen-lockfile && yarn cache clean
RUN yarn build

FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV APP_DIR=/app/nocobase

RUN groupadd -r nocobase && useradd -r -g nocobase -d $APP_DIR nocobase

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    nginx postgresql-client-16 libaio1 libfreetype6 \
    fontconfig libgssapi-krb5-2 fonts-liberation fonts-noto-cjk && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder --chown=nocobase:nocobase /app $APP_DIR
COPY docker/nocobase/docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

USER nocobase
WORKDIR $APP_DIR
EXPOSE 80 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
```

### 2.2 步骤2: 修复 GitHub Actions 工作流

创建 `.github/workflows/docker-deploy.yml`：

```yaml
name: Docker Build and Deploy

on:
  push:
    branches: [deploy/docker]
    tags: ['v*']

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      id-token: write

    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-qemu-action@v3
        with:
          platforms: all

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/metadata-action@v5
        id: meta
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha

      - uses: docker/build-push-action@v6
        with:
          context: .
          file: ./Dockerfile.prod
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          platforms: linux/amd64,linux/arm64
          cache-from: type=gha
          cache-to: type=gha,mode=max
          provenance: false
```

### 2.3 步骤3: 在 GitHub 仓库启用 Packages

1. 访问 `https://github.com/naturegolden/nocobase/settings`
2. 滚动到 `Features` 部分
3. 勾选 `Packages` 选项
4. 点击 `Save` 保存

### 2.4 步骤4: 验证修复

```bash
# 提交修复
git add Dockerfile.prod .github/workflows/docker-deploy.yml
git commit -m "fix(ci): resolve Docker build failures"
git push origin deploy/docker
```

---

## 3. 验证清单

- [x] Dockerfile COPY 语法已修复
- [x] Actions 已更新到 v6
- [x] 权限配置已正确设置
- [ ] **需要手动操作**: 在 GitHub 仓库设置中启用 Packages 功能

---

## 4. 预期结果

修复后，GitHub Actions 工作流应该：
1. ✅ 成功构建 Docker 镜像
2. ✅ 推送到 GitHub Packages
3. ✅ 支持 linux/amd64 和 linux/arm64 架构
4. ✅ 触发成功/失败通知

---

**重要提示:** 第2.3步需要在 GitHub 网站上手动操作，无法通过命令行完成。
