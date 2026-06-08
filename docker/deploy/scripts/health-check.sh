#!/bin/bash
# ============================================================
# NocoBase 健康检查脚本
# 验证所有服务是否正常运行
# ============================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 环境变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$DEPLOY_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
fi

DB_USER="${DB_USER:-nocobase}"
DB_DATABASE="${DB_DATABASE:-nocobase}"
DB_PASSWORD="${DB_PASSWORD:-nocobase}"
REDIS_PASSWORD="${REDIS_PASSWORD:-nocobase}"
APP_PORT="${APP_PORT:-13000}"

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# 日志函数
log_pass() { echo -e "  ${GREEN}✓${NC} $1"; ((PASS_COUNT++)); }
log_fail() { echo -e "  ${RED}✗${NC} $1"; ((FAIL_COUNT++)); }
log_warn() { echo -e "  ${YELLOW}⚠${NC} $1"; ((WARN_COUNT++)); }
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }

echo "============================================"
echo "  NocoBase 健康检查"
echo "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo ""

# 1. 检查 Docker 服务
echo "1. Docker 服务状态"
echo "--------------------------------------------"

for service in postgres redis minio app; do
    if docker inspect -f '{{.State.Running}}' "nocobase-$service" 2>/dev/null | grep -q "true"; then
        log_pass "nocobase-$service 运行中"
    else
        log_fail "nocobase-$service 未运行"
    fi
done
echo ""

# 2. 检查 PostgreSQL
echo "2. PostgreSQL 数据库"
echo "--------------------------------------------"

if docker exec nocobase-postgres pg_isready -U "$DB_USER" -d "$DB_DATABASE" > /dev/null 2>&1; then
    log_pass "PostgreSQL 连接正常"

    # 检查数据库大小
    DB_SIZE=$(docker exec nocobase-postgres psql -U "$DB_USER" -d "$DB_DATABASE" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_DATABASE'));" 2>/dev/null | tr -d ' ')
    log_info "数据库大小: $DB_SIZE"

    # 检查连接数
    CONN_COUNT=$(docker exec nocobase-postgres psql -U "$DB_USER" -d "$DB_DATABASE" -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | tr -d ' ')
    log_info "活跃连接数: $CONN_COUNT"
else
    log_fail "PostgreSQL 连接失败"
fi
echo ""

# 3. 检查 Redis
echo "3. Redis 缓存"
echo "--------------------------------------------"

if docker exec nocobase-redis redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG"; then
    log_pass "Redis 连接正常"

    # 检查内存使用
    MEMORY=$(docker exec nocobase-redis redis-cli -a "$REDIS_PASSWORD" info memory 2>/dev/null | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')
    log_info "内存使用: $MEMORY"

    # 检查键数量
    KEYS=$(docker exec nocobase-redis redis-cli -a "$REDIS_PASSWORD" dbsize 2>/dev/null | cut -d: -f2 | tr -d '\r')
    log_info "键数量: $KEYS"
else
    log_fail "Redis 连接失败"
fi
echo ""

# 4. 检查 MinIO
echo "4. MinIO 对象存储"
echo "--------------------------------------------"

if docker exec nocobase-minio curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/minio/health/live 2>/dev/null | grep -q "200"; then
    log_pass "MinIO API 正常"
else
    log_warn "MinIO API 检查跳过（容器内无 curl）"
    if docker inspect -f '{{.State.Running}}' nocobase-minio 2>/dev/null | grep -q "true"; then
        log_pass "MinIO 容器运行中"
    else
        log_fail "MinIO 容器未运行"
    fi
fi
echo ""

# 5. 检查 NocoBase 应用
echo "5. NocoBase 应用"
echo "--------------------------------------------"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$APP_PORT/" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "404" ]; then
    log_pass "NocoBase HTTP 响应正常 (状态码: $HTTP_CODE)"
elif [ "$HTTP_CODE" = "000" ]; then
    log_warn "无法连接到 NocoBase (端口: $APP_PORT)"
    log_info "应用可能正在启动中，请稍后重试"
else
    log_fail "NocoBase HTTP 响应异常 (状态码: $HTTP_CODE)"
fi

# 检查应用日志中的错误
ERROR_COUNT=$(docker logs --since 5m nocobase-app 2>/dev/null | grep -ci "error\|fatal\|exception" || echo "0")
if [ "$ERROR_COUNT" -gt 0 ]; then
    log_warn "最近 5 分钟日志中发现 $ERROR_COUNT 条错误/异常"
else
    log_pass "最近 5 分钟无错误日志"
fi
echo ""

# 6. 检查磁盘空间
echo "6. 磁盘空间"
echo "--------------------------------------------"

DISK_USAGE=$(df -h "$DEPLOY_DIR" | tail -1 | awk '{print $5}')
DISK_AVAIL=$(df -h "$DEPLOY_DIR" | tail -1 | awk '{print $4}')
log_info "磁盘使用: $DISK_USAGE, 可用: $DISK_AVAIL"

if [ "${DISK_USAGE%\%}" -gt 90 ]; then
    log_fail "磁盘空间不足 ($DISK_USAGE)"
elif [ "${DISK_USAGE%\%}" -gt 80 ]; then
    log_warn "磁盘使用率较高 ($DISK_USAGE)"
else
    log_pass "磁盘空间充足 ($DISK_USAGE)"
fi
echo ""

# 7. 检查 Docker 资源
echo "7. Docker 资源"
echo "--------------------------------------------"

CONTAINER_COUNT=$(docker ps --format '{{.Names}}' | grep -c "nocobase" || echo "0")
log_info "运行中的 NocoBase 容器: $CONTAINER_COUNT"

TOTAL_MEMORY=$(docker stats --no-stream --format "{{.MemUsage}}" $(docker ps --filter "name=nocobase" -q) 2>/dev/null | paste -sd+ | bc 2>/dev/null || echo "N/A")
log_info "总内存使用: $TOTAL_MEMORY"
echo ""

# 总结
echo "============================================"
echo "  检查结果汇总"
echo "============================================"
echo -e "  ${GREEN}通过: $PASS_COUNT${NC}"
echo -e "  ${RED}失败: $FAIL_COUNT${NC}"
echo -e "  ${YELLOW}警告: $WARN_COUNT${NC}"
echo "============================================"

if [ $FAIL_COUNT -gt 0 ]; then
    echo -e "${RED}健康检查未通过，请检查失败项${NC}"
    exit 1
elif [ $WARN_COUNT -gt 0 ]; then
    echo -e "${YELLOW}健康检查通过，但有警告项${NC}"
    exit 0
else
    echo -e "${GREEN}健康检查全部通过${NC}"
    exit 0
fi
