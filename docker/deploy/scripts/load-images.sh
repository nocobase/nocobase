#!/bin/bash
# ============================================================
# 加载本地 Docker 镜像脚本
# 从 /home/parallels/docker/docker-images 目录加载镜像到 Docker
# 不依赖任何外部网络资源
# ============================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 本地镜像目录
LOCAL_IMAGES_DIR="/home/parallels/docker/docker-images"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Docker 是否运行
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker 未运行，请先启动 Docker 服务"
        exit 1
    fi
    log_success "Docker 运行正常"
}

# 检查本地镜像目录
check_images_dir() {
    if [ ! -d "$LOCAL_IMAGES_DIR" ]; then
        log_error "本地镜像目录不存在: $LOCAL_IMAGES_DIR"
        exit 1
    fi
    log_success "本地镜像目录存在: $LOCAL_IMAGES_DIR"
}

# 加载单个镜像文件
load_image() {
    local image_file="$1"
    local image_name=$(basename "$image_file")

    log_info "正在加载镜像: $image_name"

    if docker load -i "$image_file"; then
        log_success "镜像加载成功: $image_name"
    else
        log_error "镜像加载失败: $image_name"
        return 1
    fi
}

# 标记镜像
tag_images() {
    log_info "标记镜像..."

    # MinIO 镜像标记
    if docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "minio/minio"; then
        log_success "MinIO 镜像已存在"
    fi

    # Node 镜像标记
    if docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "node:22-bookworm-slim"; then
        log_success "Node 镜像已存在"
    fi

    # PostgreSQL 镜像标记
    if docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "postgres:17"; then
        log_success "PostgreSQL 镜像已存在"
    fi

    # Redis 镜像标记
    if docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "redis:7.4.0-alpine"; then
        log_success "Redis 镜像已存在"
    fi
}

# 主函数
main() {
    echo "============================================"
    echo "  NocoBase Docker 本地镜像加载工具"
    echo "============================================"
    echo ""

    check_docker
    check_images_dir

    echo ""
    log_info "开始加载本地镜像..."
    echo ""

    local success_count=0
    local fail_count=0

    # 遍历所有 tar 文件
    for image_file in "$LOCAL_IMAGES_DIR"/*.tar; do
        if [ -f "$image_file" ]; then
            if load_image "$image_file"; then
                ((success_count++))
            else
                ((fail_count++))
            fi
        fi
    done

    echo ""
    echo "============================================"
    log_info "镜像加载完成"
    log_success "成功: $success_count 个"
    if [ $fail_count -gt 0 ]; then
        log_warn "失败: $fail_count 个"
    fi
    echo "============================================"
    echo ""

    tag_images

    echo ""
    log_info "当前 Docker 镜像列表:"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep -E "REPOSITORY|postgres|node|redis|minio" || true

    echo ""
    log_success "镜像加载完成，可以开始部署 NocoBase"
}

main "$@"
