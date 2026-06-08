#!/bin/bash
# ============================================================
# NocoBase 数据备份脚本
# 支持 PostgreSQL、Redis、MinIO 和配置文件备份
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
BACKUP_DIR="$DEPLOY_DIR/backups"
POSTGRES_BACKUP_DIR="$BACKUP_DIR/postgres"
REDIS_BACKUP_DIR="$BACKUP_DIR/redis"
CONFIG_BACKUP_DIR="$BACKUP_DIR/config"

# 环境变量
ENV_FILE="$DEPLOY_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
fi

DB_USER="${DB_USER:-nocobase}"
DB_DATABASE="${DB_DATABASE:-nocobase}"
DB_PASSWORD="${DB_PASSWORD:-nocobase}"
REDIS_PASSWORD="${REDIS_PASSWORD:-nocobase}"

# 备份保留天数
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# 时间戳
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
VERSION="v1.0.0"

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 确保备份目录存在
ensure_dirs() {
    mkdir -p "$POSTGRES_BACKUP_DIR" "$REDIS_BACKUP_DIR" "$CONFIG_BACKUP_DIR"
}

# 备份 PostgreSQL 数据库
backup_postgres() {
    local backup_file="$POSTGRES_BACKUP_DIR/nocobase_postgres_${TIMESTAMP}_${VERSION}.sql.gz"

    log_info "开始备份 PostgreSQL 数据库..."

    if docker exec nocobase-postgres pg_dump -U "$DB_USER" -d "$DB_DATABASE" -F c | gzip > "$backup_file"; then
        log_success "PostgreSQL 备份成功: $backup_file"
        echo "$backup_file"
    else
        log_error "PostgreSQL 备份失败"
        return 1
    fi
}

# 备份 Redis 数据
backup_redis() {
    local backup_file="$REDIS_BACKUP_DIR/nocobase_redis_${TIMESTAMP}_${VERSION}.rdb"

    log_info "开始备份 Redis 数据..."

    # 触发 Redis BGSAVE
    docker exec nocobase-redis redis-cli -a "$REDIS_PASSWORD" BGSAVE 2>/dev/null || true
    sleep 5

    # 复制 RDB 文件
    local container_id=$(docker inspect -f '{{.Id}}' nocobase-redis 2>/dev/null || echo "")
    if [ -n "$container_id" ]; then
        docker cp "nocobase-redis:/data/dump.rdb" "$backup_file" 2>/dev/null || {
            log_warn "Redis dump.rdb 不存在，跳过 Redis 备份"
            return 0
        }
        log_success "Redis 备份成功: $backup_file"
        echo "$backup_file"
    else
        log_warn "Redis 容器未运行，跳过 Redis 备份"
    fi
}

# 备份配置文件
backup_config() {
    local backup_file="$CONFIG_BACKUP_DIR/nocobase_config_${TIMESTAMP}_${VERSION}.tar.gz"

    log_info "开始备份配置文件..."

    tar -czf "$backup_file" \
        -C "$DEPLOY_DIR" \
        --exclude='backups' \
        --exclude='storage' \
        --exclude='node_modules' \
        docker-compose.yml \
        .env \
        2>/dev/null || {
            # 如果 .env 不存在，只备份 docker-compose.yml
            tar -czf "$backup_file" \
                -C "$DEPLOY_DIR" \
                --exclude='backups' \
                --exclude='storage' \
                --exclude='node_modules' \
                docker-compose.yml \
                2>/dev/null || true
        }

    log_success "配置文件备份成功: $backup_file"
    echo "$backup_file"
}

# 清理过期备份
cleanup_old_backups() {
    log_info "清理 ${BACKUP_RETENTION_DAYS} 天前的备份文件..."

    find "$POSTGRES_BACKUP_DIR" -name "*.sql.gz" -mtime +"$BACKUP_RETENTION_DAYS" -delete 2>/dev/null || true
    find "$REDIS_BACKUP_DIR" -name "*.rdb" -mtime +"$BACKUP_RETENTION_DAYS" -delete 2>/dev/null || true
    find "$CONFIG_BACKUP_DIR" -name "*.tar.gz" -mtime +"$BACKUP_RETENTION_DAYS" -delete 2>/dev/null || true

    log_success "过期备份清理完成"
}

# 列出所有备份
list_backups() {
    echo "============================================"
    echo "  备份文件列表"
    echo "============================================"
    echo ""

    echo "PostgreSQL 备份:"
    ls -lh "$POSTGRES_BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "  无备份"
    echo ""

    echo "Redis 备份:"
    ls -lh "$REDIS_BACKUP_DIR"/*.rdb 2>/dev/null || echo "  无备份"
    echo ""

    echo "配置文件备份:"
    ls -lh "$CONFIG_BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "  无备份"
    echo ""

    echo "备份目录大小:"
    du -sh "$BACKUP_DIR" 2>/dev/null || echo "  无法计算"
}

# 完整备份
full_backup() {
    echo "============================================"
    echo "  NocoBase 完整备份"
    echo "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "  版本: $VERSION"
    echo "============================================"
    echo ""

    ensure_dirs

    backup_postgres
    backup_redis
    backup_config
    cleanup_old_backups

    echo ""
    echo "============================================"
    log_success "完整备份完成"
    echo "============================================"
}

# 主函数
case "${1:-full}" in
    full)
        full_backup
        ;;
    postgres)
        ensure_dirs
        backup_postgres
        ;;
    redis)
        ensure_dirs
        backup_redis
        ;;
    config)
        ensure_dirs
        backup_config
        ;;
    list)
        list_backups
        ;;
    cleanup)
        cleanup_old_backups
        ;;
    *)
        echo "用法: $0 {full|postgres|redis|config|list|cleanup}"
        echo ""
        echo "命令说明:"
        echo "  full      - 完整备份（默认）"
        echo "  postgres  - 仅备份 PostgreSQL"
        echo "  redis     - 仅备份 Redis"
        echo "  config    - 仅备份配置文件"
        echo "  list      - 列出所有备份"
        echo "  cleanup   - 清理过期备份"
        exit 1
        ;;
esac
