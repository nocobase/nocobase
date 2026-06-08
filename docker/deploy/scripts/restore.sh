#!/bin/bash
# ============================================================
# NocoBase 数据恢复脚本
# 从备份文件恢复 PostgreSQL、Redis 和配置文件
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

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 查找最新备份文件
find_latest_backup() {
    local dir="$1"
    local pattern="$2"

    ls -t "$dir"/$pattern 2>/dev/null | head -1
}

# 恢复 PostgreSQL 数据库
restore_postgres() {
    local backup_file="$1"

    if [ -z "$backup_file" ]; then
        backup_file=$(find_latest_backup "$POSTGRES_BACKUP_DIR" "*.sql.gz")
    fi

    if [ -z "$backup_file" ] || [ ! -f "$backup_file" ]; then
        log_error "未找到 PostgreSQL 备份文件"
        return 1
    fi

    log_info "正在恢复 PostgreSQL 数据库: $backup_file"

    # 确认恢复操作
    read -p "⚠️  这将覆盖当前数据库数据，是否继续？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warn "恢复操作已取消"
        return 0
    fi

    # 停止应用容器
    log_info "停止应用容器..."
    cd "$DEPLOY_DIR"
    docker compose stop app 2>/dev/null || true

    # 删除并重建数据库
    log_info "重建数据库..."
    docker exec nocobase-postgres dropdb -U "$DB_USER" --if-exists "$DB_DATABASE" 2>/dev/null || true
    docker exec nocobase-postgres createdb -U "$DB_USER" "$DB_DATABASE" 2>/dev/null || true

    # 恢复数据
    log_info "正在导入数据..."
    if gunzip -c "$backup_file" | docker exec -i nocobase-postgres pg_restore -U "$DB_USER" -d "$DB_DATABASE" --clean --if-exists 2>/dev/null; then
        log_success "PostgreSQL 恢复成功"
    else
        # 如果 pg_restore 失败，尝试直接 SQL 导入
        log_warn "pg_restore 失败，尝试 SQL 导入..."
        gunzip -c "$backup_file" | docker exec -i nocobase-postgres psql -U "$DB_USER" -d "$DB_DATABASE" 2>/dev/null || {
            log_error "PostgreSQL 恢复失败"
            return 1
        }
    fi

    # 重启应用容器
    log_info "重启应用容器..."
    docker compose start app 2>/dev/null || true

    log_success "PostgreSQL 恢复完成"
}

# 恢复 Redis 数据
restore_redis() {
    local backup_file="$1"

    if [ -z "$backup_file" ]; then
        backup_file=$(find_latest_backup "$REDIS_BACKUP_DIR" "*.rdb")
    fi

    if [ -z "$backup_file" ] || [ ! -f "$backup_file" ]; then
        log_error "未找到 Redis 备份文件"
        return 1
    fi

    log_info "正在恢复 Redis 数据: $backup_file"

    # 确认恢复操作
    read -p "⚠️  这将覆盖当前 Redis 数据，是否继续？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warn "恢复操作已取消"
        return 0
    fi

    # 停止 Redis
    log_info "停止 Redis..."
    docker stop nocobase-redis 2>/dev/null || true

    # 复制 RDB 文件
    log_info "复制 RDB 文件..."
    docker cp "$backup_file" "nocobase-redis:/data/dump.rdb" 2>/dev/null || {
        # 如果容器不存在，需要先启动
        cd "$DEPLOY_DIR"
        docker compose up -d redis
        sleep 5
        docker cp "$backup_file" "nocobase-redis:/data/dump.rdb"
    }

    # 重启 Redis
    log_info "重启 Redis..."
    docker restart nocobase-redis 2>/dev/null || {
        cd "$DEPLOY_DIR"
        docker compose restart redis
    }

    log_success "Redis 恢复完成"
}

# 恢复配置文件
restore_config() {
    local backup_file="$1"

    if [ -z "$backup_file" ]; then
        backup_file=$(find_latest_backup "$CONFIG_BACKUP_DIR" "*.tar.gz")
    fi

    if [ -z "$backup_file" ] || [ ! -f "$backup_file" ]; then
        log_error "未找到配置文件备份"
        return 1
    fi

    log_info "正在恢复配置文件: $backup_file"

    # 确认恢复操作
    read -p "⚠️  这将覆盖当前配置文件，是否继续？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warn "恢复操作已取消"
        return 0
    fi

    # 备份当前配置
    log_info "备份当前配置..."
    local current_backup="$CONFIG_BACKUP_DIR/nocobase_config_before_restore_$(date +%Y%m%d_%H%M%S).tar.gz"
    tar -czf "$current_backup" \
        -C "$DEPLOY_DIR" \
        docker-compose.yml \
        .env 2>/dev/null || true

    # 恢复配置
    log_info "恢复配置文件..."
    tar -xzf "$backup_file" -C "$DEPLOY_DIR"

    log_success "配置文件恢复完成"
    log_warn "请重启服务使配置生效: docker compose restart"
}

# 完整恢复
full_restore() {
    local timestamp="$1"

    echo "============================================"
    echo "  NocoBase 完整恢复"
    echo "============================================"
    echo ""

    # 查找指定时间戳的备份
    if [ -n "$timestamp" ]; then
        local postgres_file=$(ls "$POSTGRES_BACKUP_DIR"/*"${timestamp}"*.sql.gz 2>/dev/null | head -1)
        local redis_file=$(ls "$REDIS_BACKUP_DIR"/*"${timestamp}"*.rdb 2>/dev/null | head -1)
        local config_file=$(ls "$CONFIG_BACKUP_DIR"/*"${timestamp}"*.tar.gz 2>/dev/null | head -1)
    fi

    restore_postgres "$postgres_file"
    echo ""
    restore_redis "$redis_file"
    echo ""
    restore_config "$config_file"

    echo ""
    echo "============================================"
    log_success "完整恢复完成"
    echo "============================================"
    echo ""
    log_info "请运行健康检查验证恢复结果:"
    echo "  ./scripts/health-check.sh"
}

# 列出可用备份
list_backups() {
    echo "============================================"
    echo "  可用备份列表"
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
}

# 主函数
case "${1:-full}" in
    full)
        full_restore "$2"
        ;;
    postgres)
        restore_postgres "$2"
        ;;
    redis)
        restore_redis "$2"
        ;;
    config)
        restore_config "$2"
        ;;
    list)
        list_backups
        ;;
    *)
        echo "用法: $0 {full|postgres|redis|config|list} [时间戳|备份文件路径]"
        echo ""
        echo "命令说明:"
        echo "  full      - 完整恢复（默认）"
        echo "  postgres  - 仅恢复 PostgreSQL"
        echo "  redis     - 仅恢复 Redis"
        echo "  config    - 仅恢复配置文件"
        echo "  list      - 列出可用备份"
        echo ""
        echo "示例:"
        echo "  $0 full                        # 使用最新备份完整恢复"
        echo "  $0 full 20260608_120000        # 使用指定时间戳的备份恢复"
        echo "  $0 postgres /path/to/backup    # 从指定文件恢复 PostgreSQL"
        exit 1
        ;;
esac
