#!/bin/bash
# ============================================================
# NocoBase 服务管理脚本
# 标准化启动、停止、重启、状态查看和日志管理
# ============================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$DEPLOY_DIR/logs"
mkdir -p "$LOG_DIR"

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 启动服务
start_services() {
    echo "============================================"
    echo "  启动 NocoBase 服务"
    echo "============================================"
    echo ""

    cd "$DEPLOY_DIR"

    log_info "检查本地镜像..."
    ./scripts/load-images.sh

    echo ""
    log_info "启动所有服务..."
    docker compose up -d

    echo ""
    log_info "等待服务启动..."
    sleep 10

    log_info "运行健康检查..."
    ./scripts/health-check.sh || {
        log_warn "部分服务未就绪，请稍后重试"
        echo ""
        log_info "查看服务状态: $0 status"
        log_info "查看日志: $0 logs [服务名]"
    }
}

# 停止服务
stop_services() {
    echo "============================================"
    echo "  停止 NocoBase 服务"
    echo "============================================"
    echo ""

    cd "$DEPLOY_DIR"

    log_info "正在停止所有服务..."
    docker compose down

    log_success "所有服务已停止"
}

# 重启服务
restart_services() {
    echo "============================================"
    echo "  重启 NocoBase 服务"
    echo "============================================"
    echo ""

    cd "$DEPLOY_DIR"

    log_info "正在重启所有服务..."
    docker compose restart

    echo ""
    log_info "等待服务就绪..."
    sleep 10

    log_info "运行健康检查..."
    ./scripts/health-check.sh
}

# 查看服务状态
show_status() {
    echo "============================================"
    echo "  NocoBase 服务状态"
    echo "============================================"
    echo ""

    cd "$DEPLOY_DIR"

    docker compose ps

    echo ""
    echo "============================================"
    echo "  容器资源使用"
    echo "============================================"
    echo ""

    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" $(docker ps --filter "name=nocobase" -q) 2>/dev/null || echo "无运行中的容器"
}

# 查看日志
show_logs() {
    local service="${1:-app}"
    local lines="${2:-100}"

    echo "============================================"
    echo "  NocoBase $service 日志 (最近 $lines 行)"
    echo "============================================"
    echo ""

    docker logs --tail "$lines" "nocobase-$service" 2>&1
}

# 跟随日志
follow_logs() {
    local service="${1:-app}"

    log_info "跟随 nocobase-$service 日志 (Ctrl+C 退出)..."
    docker logs -f "nocobase-$service" 2>&1
}

# 导出日志
export_logs() {
    local service="${1:-app}"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local log_file="$LOG_DIR/nocobase-${service}_${timestamp}.log"

    log_info "导出日志到: $log_file"
    docker logs "nocobase-$service" > "$log_file" 2>&1
    log_success "日志已导出: $log_file"
}

# 清理日志
clean_logs() {
    log_info "清理旧日志文件..."
    find "$LOG_DIR" -name "*.log" -mtime +7 -delete 2>/dev/null || true
    log_success "7天前的日志已清理"
}

# 进入容器
exec_container() {
    local service="${1:-app}"
    local shell="${2:-bash}"

    log_info "进入 nocobase-$service 容器..."
    docker exec -it "nocobase-$service" "$shell" 2>/dev/null || \
    docker exec -it "nocobase-$service" sh
}

# 显示帮助
show_help() {
    echo "============================================"
    echo "  NocoBase 服务管理工具"
    echo "============================================"
    echo ""
    echo "用法: $0 <命令> [参数]"
    echo ""
    echo "命令:"
    echo "  start              - 启动所有服务"
    echo "  stop               - 停止所有服务"
    echo "  restart            - 重启所有服务"
    echo "  status             - 查看服务状态"
    echo "  logs [服务] [行数]  - 查看服务日志"
    echo "  follow [服务]      - 跟随服务日志"
    echo "  export [服务]      - 导出服务日志"
    echo "  clean-logs         - 清理旧日志"
    echo "  exec [服务]        - 进入容器"
    echo "  help               - 显示帮助"
    echo ""
    echo "服务名: postgres, redis, minio, app, nginx"
    echo ""
    echo "示例:"
    echo "  $0 start                    # 启动所有服务"
    echo "  $0 logs app 200             # 查看 app 最近 200 行日志"
    echo "  $0 follow app               # 跟随 app 日志"
    echo "  $0 exec postgres            # 进入 PostgreSQL 容器"
    echo "  $0 status                   # 查看服务状态"
}

# 主函数
case "${1:-help}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$2" "$3"
        ;;
    follow)
        follow_logs "$2"
        ;;
    export)
        export_logs "$2"
        ;;
    clean-logs)
        clean_logs
        ;;
    exec)
        exec_container "$2"
        ;;
    help|*)
        show_help
        ;;
esac
