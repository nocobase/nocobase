#!/bin/bash
# ============================================================
# NocoBase 灰度发布管理脚本
# 支持权重调整、版本切换、A/B 测试、回滚等操作
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
NGINX_DIR="$DEPLOY_DIR/nginx"
CONF_DIR="$NGINX_DIR/conf.d"
CANARY_DIR="$NGINX_DIR/canary"

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================================
# 灰度发布策略管理
# ============================================================

# 1. 基于权重的灰度发布
weighted_canary() {
    local canary_weight="${1:-10}"  # 默认 10% 灰度流量
    local stable_weight=$((100 - canary_weight))

    echo "============================================"
    echo "  灰度发布 - 基于权重"
    echo "  稳定版本: ${stable_weight}%"
    echo "  灰度版本: ${canary_weight}%"
    echo "============================================"
    echo ""

    # 生成权重配置
    cat > "$CONF_DIR/canary-active.conf" << EOF
# 灰度发布配置 - 权重模式
# 生成时间: $(date '+%Y-%m-%d %H:%M:%S')
# 稳定版本权重: ${stable_weight}%
# 灰度版本权重: ${canary_weight}%

upstream nocobase_backend {
    server app:80 weight=${stable_weight};
    server app-canary:80 weight=${canary_weight};
    keepalive 32;
}

server {
    listen 80;
    server_name _;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Canary-Strategy "weighted" always;
    add_header X-Canary-Weight "${canary_weight}%" always;

    location /storage/uploads/ {
        alias /var/www/nocobase/storage/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location / {
        proxy_pass http://nocobase_backend;
        proxy_http_version 1.1;

        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;

        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        add_header X-Upstream-Server \$upstream_addr always;
    }

    location /api/ {
        proxy_pass http://nocobase_backend;
        proxy_http_version 1.1;

        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }

    location /nginx-health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

    log_success "权重灰度配置已生成"
    log_info "稳定版本: app:80 (weight=${stable_weight})"
    log_info "灰度版本: app-canary:80 (weight=${canary_weight})"
    log_info "配置文件: $CONF_DIR/canary-active.conf"
}

# 2. 基于 Header 的精准灰度
header_canary() {
    echo "============================================"
    echo "  灰度发布 - 基于 Header"
    echo "  触发条件: X-Canary: true"
    echo "============================================"
    echo ""

    cp "$CONF_DIR/canary-precise.conf" "$CONF_DIR/canary-active.conf"

    log_success "Header 灰度配置已激活"
    log_info "请求头: X-Canary: true → 灰度版本"
    log_info "其他请求 → 稳定版本"
}

# 3. A/B 测试
ab_test() {
    echo "============================================"
    echo "  A/B 测试模式"
    echo "  分流依据: 用户 ID 哈希"
    echo "============================================"
    echo ""

    cp "$CONF_DIR/canary-ab-test.conf" "$CONF_DIR/canary-active.conf"

    log_success "A/B 测试配置已激活"
    log_info "分流策略: 基于 user_id cookie/参数哈希"
    log_info "A 组 → 稳定版本, B 组 → 灰度版本"
}

# ============================================================
# 版本管理
# ============================================================

# 启动灰度版本容器
start_canary() {
    local version="${1:-latest}"

    echo "============================================"
    echo "  启动灰度版本容器"
    echo "  版本: $version"
    echo "============================================"
    echo ""

    cd "$DEPLOY_DIR"

    # 检查是否已有灰度容器
    if docker ps -a --format '{{.Names}}' | grep -q "nocobase-app-canary"; then
        log_warn "灰度容器已存在，正在删除..."
        docker rm -f nocobase-app-canary 2>/dev/null || true
    fi

    # 启动灰度容器
    log_info "启动灰度版本容器..."
    docker run -d \
        --name nocobase-app-canary \
        --network nocobase-network \
        -e APP_ENV=production \
        -e DB_DIALECT=postgres \
        -e DB_HOST=postgres \
        -e DB_PORT=5432 \
        -e DB_DATABASE=nocobase \
        -e DB_USER=nocobase \
        -e DB_PASSWORD=nocobase \
        -e REDIS_HOST=redis \
        -e REDIS_PORT=6379 \
        -e REDIS_PASSWORD=nocobase \
        --health-cmd "wget -qO- http://localhost:80/ || exit 1" \
        --health-interval=30s \
        --health-timeout=10s \
        --health-retries=3 \
        --health-start-period=60s \
        nocobase/nocobase:local

    log_success "灰度版本容器已启动"
    log_info "容器名: nocobase-app-canary"
    log_info "等待健康检查..."
    sleep 10

    # 检查健康状态
    if docker inspect -f '{{.State.Health.Status}}' nocobase-app-canary 2>/dev/null | grep -q "healthy"; then
        log_success "灰度版本健康检查通过"
    else
        log_warn "灰度版本健康检查中，请稍后重试"
    fi
}

# 停止灰度版本容器
stop_canary() {
    echo "============================================"
    echo "  停止灰度版本容器"
    echo "============================================"
    echo ""

    if docker ps -a --format '{{.Names}}' | grep -q "nocobase-app-canary"; then
        docker stop nocobase-app-canary
        docker rm nocobase-app-canary
        log_success "灰度版本容器已停止并删除"
    else
        log_warn "灰度版本容器不存在"
    fi
}

# ============================================================
# 流量调整
# ============================================================

# 调整灰度流量比例
adjust_traffic() {
    local canary_percent="$1"

    if [ -z "$canary_percent" ]; then
        log_error "请指定灰度流量百分比 (0-100)"
        echo "用法: $0 adjust <百分比>"
        exit 1
    fi

    weighted_canary "$canary_percent"
    reload_nginx
}

# ============================================================
# 回滚操作
# ============================================================

# 回滚到稳定版本
rollback() {
    echo "============================================"
    echo "  回滚到稳定版本"
    echo "============================================"
    echo ""

    # 移除灰度配置
    rm -f "$CONF_DIR/canary-active.conf"

    # 恢复标准配置
    cp "$CONF_DIR/nocobase.conf" "$CONF_DIR/canary-active.conf" 2>/dev/null || {
        log_warn "标准配置不存在，使用默认配置"
    }

    # 停止灰度容器
    stop_canary

    # 重载 Nginx
    reload_nginx

    log_success "已回滚到稳定版本"
}

# ============================================================
# Nginx 管理
# ============================================================

# 重载 Nginx 配置
reload_nginx() {
    log_info "重载 Nginx 配置..."

    # 验证配置
    if docker exec nocobase-nginx nginx -t 2>&1; then
        docker exec nocobase-nginx nginx -s reload
        log_success "Nginx 配置重载成功"
    else
        log_error "Nginx 配置验证失败"
        return 1
    fi
}

# 查看 Nginx 状态
nginx_status() {
    echo "============================================"
    echo "  Nginx 状态"
    echo "============================================"
    echo ""

    docker exec nocobase-nginx nginx -t 2>&1
    echo ""

    log_info "活跃配置:"
    ls -la "$CONF_DIR/"*.conf 2>/dev/null || echo "  无配置文件"
    echo ""

    log_info "当前灰度策略:"
    if [ -f "$CONF_DIR/canary-active.conf" ]; then
        grep -E "weight|canary|upstream" "$CONF_DIR/canary-active.conf" | head -10
    else
        echo "  无灰度配置"
    fi
}

# ============================================================
# 监控与日志
# ============================================================

# 查看灰度流量分布
canary_stats() {
    echo "============================================"
    echo "  灰度流量统计"
    echo "============================================"
    echo ""

    log_info "最近 100 条请求的 upstream 分布:"
    docker logs --tail 100 nocobase-nginx 2>&1 | grep -oP 'upstream=[^,]+' | sort | uniq -c | sort -rn

    echo ""
    log_info "灰度容器状态:"
    docker ps --filter "name=canary" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# 查看灰度日志
canary_logs() {
    local lines="${1:-50}"

    echo "============================================"
    echo "  灰度版本日志 (最近 $lines 行)"
    echo "============================================"
    echo ""

    docker logs --tail "$lines" nocobase-app-canary 2>&1
}

# ============================================================
# 帮助信息
# ============================================================

show_help() {
    echo "============================================"
    echo "  NocoBase 灰度发布管理工具"
    echo "============================================"
    echo ""
    echo "用法: $0 <命令> [参数]"
    echo ""
    echo "灰度策略:"
    echo "  weighted <百分比>   - 基于权重的灰度发布 (0-100)"
    echo "  header              - 基于 Header 的精准灰度"
    echo "  ab-test             - A/B 测试模式"
    echo ""
    echo "版本管理:"
    echo "  start-canary [版本]  - 启动灰度版本容器"
    echo "  stop-canary         - 停止灰度版本容器"
    echo "  rollback            - 回滚到稳定版本"
    echo ""
    echo "流量控制:"
    echo "  adjust <百分比>     - 调整灰度流量比例"
    echo ""
    echo "监控:"
    echo "  status              - 查看灰度状态"
    echo "  stats               - 查看流量统计"
    echo "  logs [行数]         - 查看灰度日志"
    echo "  reload              - 重载 Nginx 配置"
    echo ""
    echo "示例:"
    echo "  $0 weighted 10      # 10% 流量到灰度版本"
    echo "  $0 weighted 50      # 50% 流量到灰度版本"
    echo "  $0 header           # 通过 X-Canary: true 触发灰度"
    echo "  $0 ab-test          # 启用 A/B 测试"
    echo "  $0 start-canary     # 启动灰度容器"
    echo "  $0 adjust 25        # 调整灰度流量到 25%"
    echo "  $0 rollback         # 回滚到稳定版本"
    echo "  $0 stats            # 查看流量统计"
}

# ============================================================
# 主函数
# ============================================================

case "${1:-help}" in
    weighted)
        weighted_canary "$2"
        reload_nginx
        ;;
    header)
        header_canary
        reload_nginx
        ;;
    ab-test)
        ab_test
        reload_nginx
        ;;
    start-canary)
        start_canary "$2"
        ;;
    stop-canary)
        stop_canary
        ;;
    adjust)
        adjust_traffic "$2"
        ;;
    rollback)
        rollback
        ;;
    status)
        nginx_status
        ;;
    stats)
        canary_stats
        ;;
    logs)
        canary_logs "$2"
        ;;
    reload)
        reload_nginx
        ;;
    help|*)
        show_help
        ;;
esac
