#!/bin/bash
# ============================================================
# NocoBase Docker 部署脚本 - 在 Ubuntu VM 上执行
# 用法: ./deploy.sh [TAG]
#   TAG: 可选，指定要部署的镜像标签，默认为 feature/docker-deploy
# ============================================================
set -euo pipefail

# 配置
REGISTRY="ghcr.io"
IMAGE_NAME="naturegolden/nocobase"
DEFAULT_TAG="feature/docker-deploy"
TAG="${1:-$DEFAULT_TAG}"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${TAG}"
DEPLOY_DIR="/opt/nocobase-deploy"

echo "============================================"
echo "NocoBase Docker 部署"
echo "============================================"
echo "镜像: ${FULL_IMAGE}"
echo "部署目录: ${DEPLOY_DIR}"
echo "============================================"

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "错误: Docker Compose 未安装"
    exit 1
fi

# 创建部署目录
sudo mkdir -p "${DEPLOY_DIR}"

# 登录 GHCR（如果需要拉取私有镜像）
if [ -n "${GHCR_TOKEN:-}" ]; then
    echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USERNAME:-}" --password-stdin
fi

# 拉取镜像
echo "正在拉取镜像: ${FULL_IMAGE}"
docker pull "${FULL_IMAGE}"

# 准备 docker-compose.yml 和 .env
if [ ! -f "${DEPLOY_DIR}/docker-compose.yml" ]; then
    echo "首次部署，复制配置文件..."
    # 这里需要从仓库获取 docker-compose.yml 和 .env.example
    # 或者手动创建
    echo "请确保 ${DEPLOY_DIR}/docker-compose.yml 和 ${DEPLOY_DIR}/.env 已配置"
fi

# 更新 docker-compose.yml 中的镜像引用
if [ -f "${DEPLOY_DIR}/docker-compose.yml" ]; then
    echo "更新 docker-compose.yml 中的镜像引用..."
    sed -i "s|image: nocobase/nocobase:local|image: ${FULL_IMAGE}|g" "${DEPLOY_DIR}/docker-compose.yml"
fi

# 停止旧容器
echo "停止旧服务..."
cd "${DEPLOY_DIR}"
docker compose down || true

# 启动新服务
echo "启动新服务..."
docker compose up -d

# 等待服务就绪
echo "等待服务启动..."
sleep 10

# 健康检查
echo "检查服务状态..."
docker compose ps

echo "============================================"
echo "部署完成！"
echo "访问地址: http://<VM_IP>:13000"
echo "============================================"
