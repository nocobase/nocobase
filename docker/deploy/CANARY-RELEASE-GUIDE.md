# Nginx 灰度发布完整方案

## 目录

1. [灰度发布概述](#1-灰度发布概述)
2. [当前架构灰度能力评估](#2-当前架构灰度能力评估)
3. [Nginx 灰度发布配置方法](#3-nginx-灰度发布配置方法)
4. [流量分配规则](#4-流量分配规则)
5. [版本控制机制](#5-版本控制机制)
6. [监控方案](#6-监控方案)
7. [灰度发布操作流程](#7-灰度发布操作流程)
8. [回滚机制](#8-回滚机制)
9. [现有方案局限性及优化方向](#9-现有方案局限性及优化方向)
10. [最佳实践](#10-最佳实践)

---

## 1. 灰度发布概述

### 1.1 什么是灰度发布

灰度发布（Canary Release）是一种渐进式发布策略，通过在生产环境中逐步将新版本推送给部分用户，验证新版本的稳定性和功能正确性，最终实现全量发布。

### 1.2 灰度发布的核心价值

| 价值 | 说明 |
|------|------|
| **降低风险** | 新版本只影响部分用户，问题影响范围可控 |
| **快速回滚** | 发现问题时可立即回滚到稳定版本 |
| **数据验证** | 在生产环境中收集真实用户数据验证新版本 |
| **平滑过渡** | 渐进式流量切换，避免突然的全量变更 |

### 1.3 灰度发布策略类型

| 策略 | 适用场景 | 流量控制方式 |
|------|---------|-------------|
| **权重灰度** | 渐进式发布 | 按百分比分配流量 |
| **Header 灰度** | 内部测试 | 通过请求头指定版本 |
| **Cookie 灰度** | 用户定向测试 | 通过 Cookie 指定版本 |
| **IP 灰度** | 内部网络测试 | 根据 IP 地址路由 |
| **A/B 测试** | 功能对比 | 基于用户 ID 哈希分流 |

---

## 2. 当前架构灰度能力评估

### 2.1 现有架构分析

当前 NocoBase 部署架构：

```
客户端 → Nginx:80 → App:80 → PostgreSQL/Redis/MinIO
```

### 2.2 现有方案已支持的灰度能力

| 能力 | 支持状态 | 说明 |
|------|---------|------|
| **反向代理** | ✅ 已支持 | Nginx 已配置为反向代理 |
| **上游服务器组** | ✅ 可扩展 | Nginx upstream 支持多服务器 |
| **权重分配** | ✅ 已实现 | `canary-weighted.conf` 配置 |
| **Header 路由** | ✅ 已实现 | `canary-precise.conf` 配置 |
| **Cookie 路由** | ✅ 已实现 | `canary-precise.conf` 配置 |
| **IP 路由** | ✅ 已实现 | `canary-precise.conf` 配置 |
| **A/B 测试** | ✅ 已实现 | `canary-ab-test.conf` 配置 |
| **健康检查** | ✅ 已支持 | Nginx 和 Docker 健康检查 |
| **动态重载** | ✅ 已支持 | `nginx -s reload` 无中断重载 |
| **版本标识** | ✅ 已实现 | 响应头标识路由目标 |

### 2.3 现有方案的局限性

| 局限性 | 影响 | 优化方向 |
|--------|------|---------|
| **单点 Nginx** | Nginx 故障导致全量不可用 | 引入 Keepalived 实现高可用 |
| **无自动扩缩容** | 流量突增时无法自动扩展 | 集成 Docker Swarm/K8s |
| **无指标收集** | 缺乏灰度效果量化数据 | 集成 Prometheus + Grafana |
| **手动配置** | 灰度策略需手动修改配置 | 开发自动化灰度管理界面 |
| **无会话保持** | 用户可能在请求间切换版本 | 添加 sticky session 支持 |
| **无金丝雀分析** | 无法自动分析灰度效果 | 集成日志分析工具 |
| **数据库共享** | 新旧版本共享同一数据库 | 考虑数据库版本隔离 |

---

## 3. Nginx 灰度发布配置方法

### 3.1 配置文件结构

```
docker/deploy/nginx/
├── nginx.conf                    # Nginx 主配置
├── conf.d/
│   ├── nocobase.conf             # 标准生产配置
│   ├── canary-weighted.conf      # 权重灰度配置（模板）
│   ├── canary-precise.conf       # 精准路由配置（模板）
│   ├── canary-ab-test.conf       # A/B 测试配置（模板）
│   └── canary-active.conf        # 当前激活的灰度配置
└── canary/
    └── (灰度配置备份)
```

### 3.2 权重灰度配置

**文件**: `nginx/conf.d/canary-weighted.conf`

```nginx
upstream nocobase_backend {
    server app:80 weight=9;       # 稳定版本 90%
    server app-canary:80 weight=1;  # 灰度版本 10%
    keepalive 32;
}
```

**流量分配**：
- `weight=9` → 90% 流量到稳定版本
- `weight=1` → 10% 流量到灰度版本

### 3.3 精准路由配置

**文件**: `nginx/conf.d/canary-precise.conf`

支持的路由规则（按优先级）：

| 优先级 | 规则 | 触发条件 | 示例 |
|--------|------|---------|------|
| 1 | Header | `X-Canary: true` | 开发团队测试 |
| 2 | Cookie | `canary=true` | 测试用户定向 |
| 3 | IP | 内网 IP 段 | 内部员工访问 |
| 4 | User-Agent | `canary-test` | 自动化测试工具 |

### 3.4 A/B 测试配置

**文件**: `nginx/conf.d/canary-ab-test.conf`

```nginx
# 基于用户 ID 哈希分流
map "$cookie_user_id$arg_user_id" $ab_group {
    default "A";
    ~^[0-4] "B";  # 50% 用户到 B 组
    ~^[5-9] "A";  # 50% 用户到 A 组
}
```

**分流一致性**：同一用户 ID 始终分配到同一组

---

## 4. 流量分配规则

### 4.1 权重分配规则

| 阶段 | 稳定版本 | 灰度版本 | 持续时间 | 目的 |
|------|---------|---------|---------|------|
| **初始** | 99% | 1% | 1-2 小时 | 验证基本功能 |
| **观察** | 95% | 5% | 2-4 小时 | 收集错误数据 |
| **扩展** | 90% | 10% | 4-8 小时 | 验证负载能力 |
| **加速** | 75% | 25% | 8-12 小时 | 扩大测试范围 |
| **半量** | 50% | 50% | 12-24 小时 | 全面验证 |
| **主导** | 25% | 75% | 24-48 小时 | 新版本为主 |
| **全量** | 0% | 100% | - | 完成发布 |

### 4.2 流量分配算法

#### 轮询加权（Round-Robin Weighted）

```
请求 1 → app:80 (weight=9)
请求 2 → app:80 (weight=9)
...
请求 9 → app:80 (weight=9)
请求 10 → app-canary:80 (weight=1)
```

#### 一致性哈希（用于 A/B 测试）

```
user_id = "user123"
hash = md5(user_id) % 10
if hash < 5:
    route to version B
else:
    route to version A
```

### 4.3 会话保持

为确保用户在会话期间始终访问同一版本，可添加：

```nginx
upstream nocobase_backend {
    server app:80 weight=9;
    server app-canary:80 weight=1;

    # 基于 Cookie 的会话保持
    sticky cookie srv_id expires=1h domain=.example.com path=/;
}
```

---

## 5. 版本控制机制

### 5.1 版本标识

每个版本通过以下方式标识：

| 标识方式 | 位置 | 示例 |
|---------|------|------|
| **容器名** | Docker | `nocobase-app` (稳定), `nocobase-app-canary` (灰度) |
| **镜像标签** | Docker | `nocobase/nocobase:local` |
| **响应头** | HTTP | `X-Canary-Target: stable/canary` |
| **健康端点** | HTTP | `/version` 返回版本信息 |

### 5.2 版本管理流程

```
1. 构建新版本镜像
   docker build -t nocobase/nocobase:canary-v1.0 .

2. 启动灰度容器
   docker run -d --name nocobase-app-canary nocobase/nocobase:canary-v1.0

3. 激活灰度配置
   ./scripts/canary.sh weighted 10

4. 监控灰度效果
   ./scripts/canary.sh stats

5. 逐步增加流量
   ./scripts/canary.sh adjust 25
   ./scripts/canary.sh adjust 50
   ./scripts/canary.sh adjust 100

6. 完成发布（替换稳定版本）
   docker stop nocobase-app
   docker rename nocobase-app-canary nocobase-app
```

### 5.3 版本回滚

```bash
# 一键回滚
./scripts/canary.sh rollback

# 手动回滚
docker stop nocobase-app-canary
docker rm nocobase-app-canary
rm nginx/conf.d/canary-active.conf
docker exec nocobase-nginx nginx -s reload
```

---

## 6. 监控方案

### 6.1 监控指标

| 指标类别 | 具体指标 | 告警阈值 |
|---------|---------|---------|
| **可用性** | HTTP 状态码分布 | 5xx > 1% |
| **性能** | 响应时间 P95 | > 2s |
| **性能** | 响应时间 P99 | > 5s |
| **流量** | QPS 分布 | 突增/突降 > 50% |
| **错误** | 错误率 | > 0.5% |
| **资源** | CPU 使用率 | > 80% |
| **资源** | 内存使用率 | > 85% |
| **资源** | 磁盘使用率 | > 90% |

### 6.2 日志分析

#### Nginx 访问日志格式

```nginx
log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                '$status $body_bytes_sent "$http_referer" '
                '"$http_user_agent" "$http_x_forwarded_for" '
                'rt=$request_time upstream=$upstream_addr';
```

#### 灰度流量统计命令

```bash
# 查看最近 1000 条请求的 upstream 分布
docker logs --tail 1000 nocobase-nginx 2>&1 | \
  grep -oP 'upstream=[^,]+' | sort | uniq -c | sort -rn

# 查看灰度版本错误率
docker logs --tail 1000 nocobase-nginx 2>&1 | \
  grep "app-canary" | grep -c " 5[0-9][0-9] "

# 查看稳定版本错误率
docker logs --tail 1000 nocobase-nginx 2>&1 | \
  grep "app:80" | grep -c " 5[0-9][0-9] "
```

### 6.3 健康检查

```bash
# 检查所有容器状态
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 检查 Nginx 配置
docker exec nocobase-nginx nginx -t

# 检查灰度容器健康
docker inspect -f '{{.State.Health.Status}}' nocobase-app-canary

# 测试灰度路由
curl -H "X-Canary: true" http://localhost/version
```

### 6.4 监控脚本

使用 `canary.sh` 脚本进行监控：

```bash
# 查看灰度状态
./scripts/canary.sh status

# 查看流量统计
./scripts/canary.sh stats

# 查看灰度日志
./scripts/canary.sh logs 100
```

---

## 7. 灰度发布操作流程

### 7.1 完整灰度发布流程

```bash
# 步骤 1: 构建新版本镜像
cd /home/parallels/nocobase/nocobase
docker build -f docker/deploy/Dockerfile -t nocobase/nocobase:canary-v1.0 .

# 步骤 2: 启动灰度容器
./docker/deploy/scripts/canary.sh start-canary v1.0

# 步骤 3: 验证灰度容器健康
docker inspect -f '{{.State.Health.Status}}' nocobase-app-canary

# 步骤 4: 激活 1% 灰度流量
./docker/deploy/scripts/canary.sh weighted 1

# 步骤 5: 观察 1-2 小时，检查错误率
./docker/deploy/scripts/canary.sh stats

# 步骤 6: 如果正常，逐步增加流量
./docker/deploy/scripts/canary.sh adjust 5
./docker/deploy/scripts/canary.sh adjust 10
./docker/deploy/scripts/canary.sh adjust 25
./docker/deploy/scripts/canary.sh adjust 50

# 步骤 7: 全量发布
./docker/deploy/scripts/canary.sh adjust 100

# 步骤 8: 替换稳定版本
docker stop nocobase-app
docker rename nocobase-app-canary nocobase-app

# 步骤 9: 清理灰度配置
./docker/deploy/scripts/canary.sh rollback
```

### 7.2 快速灰度（Header 模式）

```bash
# 适用于开发团队内部测试

# 启动灰度容器
./scripts/canary.sh start-canary

# 激活 Header 灰度
./scripts/canary.sh header

# 测试灰度版本
curl -H "X-Canary: true" http://localhost/

# 测试稳定版本（无 Header）
curl http://localhost/
```

### 7.3 A/B 测试流程

```bash
# 启动灰度容器
./scripts/canary.sh start-canary

# 激活 A/B 测试
./scripts/canary.sh ab-test

# 用户 A 组访问（user_id 哈希值 5-9 开头）
curl -b "user_id=user123" http://localhost/

# 用户 B 组访问（user_id 哈希值 0-4 开头）
curl -b "user_id=user456" http://localhost/

# 查看分流结果
curl http://localhost/ab-status
```

---

## 8. 回滚机制

### 8.1 自动回滚条件

| 条件 | 阈值 | 动作 |
|------|------|------|
| **5xx 错误率** | > 5% | 立即回滚 |
| **响应时间 P99** | > 10s | 告警 + 评估 |
| **CPU 使用率** | > 95% | 告警 + 评估 |
| **内存使用率** | > 95% | 告警 + 评估 |

### 8.2 回滚操作步骤

```bash
# 一键回滚（推荐）
./scripts/canary.sh rollback

# 手动回滚
# 1. 停止灰度流量
rm nginx/conf.d/canary-active.conf

# 2. 重载 Nginx
docker exec nocobase-nginx nginx -s reload

# 3. 停止灰度容器
docker stop nocobase-app-canary
docker rm nocobase-app-canary

# 4. 验证回滚成功
curl http://localhost/nginx-health
```

### 8.3 回滚验证

```bash
# 验证所有流量回到稳定版本
docker logs --tail 100 nocobase-nginx 2>&1 | \
  grep -oP 'upstream=[^,]+' | sort | uniq -c

# 预期输出：全部为 app:80
```

---

## 9. 现有方案局限性及优化方向

### 9.1 当前局限性

| 局限性 | 详细说明 | 影响程度 |
|--------|---------|---------|
| **单点 Nginx** | 无高可用，Nginx 故障导致全量不可用 | 高 |
| **手动配置** | 灰度策略需手动修改配置文件 | 中 |
| **无自动扩缩容** | 流量突增时无法自动扩展 | 中 |
| **无指标收集** | 缺乏灰度效果量化数据 | 中 |
| **数据库共享** | 新旧版本共享同一数据库，可能冲突 | 高 |
| **无会话保持** | 用户可能在请求间切换版本 | 低 |
| **无金丝雀分析** | 无法自动分析灰度效果 | 中 |

### 9.2 优化方向

#### 短期优化（1-2 周）

| 优化项 | 实现方式 | 收益 |
|--------|---------|------|
| **会话保持** | 添加 sticky cookie | 用户体验一致性 |
| **日志增强** | JSON 格式日志 + ELK | 便于分析 |
| **自动化脚本** | 完善 canary.sh | 降低操作成本 |
| **健康检查增强** | 应用级健康检查 | 提高可靠性 |

#### 中期优化（1-2 月）

| 优化项 | 实现方式 | 收益 |
|--------|---------|------|
| **Prometheus + Grafana** | 集成监控栈 | 可视化灰度效果 |
| **Nginx 高可用** | Keepalived + VIP | 消除单点故障 |
| **自动化灰度** | CI/CD 集成 | 减少人工干预 |
| **数据库隔离** | 灰度版本独立数据库 | 避免数据冲突 |

#### 长期优化（3-6 月）

| 优化项 | 实现方式 | 收益 |
|--------|---------|------|
| **Kubernetes 迁移** | K8s + Ingress | 原生灰度支持 |
| **服务网格** | Istio | 细粒度流量控制 |
| **自动化分析** | ML 异常检测 | 智能灰度决策 |
| **多环境管理** | 开发/测试/预发/生产 | 完整发布流程 |

### 9.3 推荐优化路径

```
当前方案 → 会话保持 → 监控集成 → Nginx HA → K8s 迁移
   ↓          ↓          ↓          ↓          ↓
基础灰度   用户体验   数据驱动   高可用     云原生
```

---

## 10. 最佳实践

### 10.1 灰度发布 checklist

- [ ] 新版本代码已通过所有测试
- [ ] 数据库迁移脚本已验证
- [ ] 灰度容器已启动并通过健康检查
- [ ] 监控告警已配置
- [ ] 回滚方案已准备
- [ ] 团队成员已通知
- [ ] 发布窗口已确认

### 10.2 灰度发布注意事项

| 注意事项 | 说明 |
|---------|------|
| **渐进式** | 从小流量开始，逐步增加 |
| **监控优先** | 发布前确保监控就绪 |
| **快速回滚** | 发现问题立即回滚 |
| **数据兼容** | 确保新旧版本数据兼容 |
| **会话处理** | 避免用户在版本间切换 |
| **文档记录** | 记录每次灰度过程和结果 |

### 10.3 常见问题及解决方案

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| **灰度容器启动失败** | 端口冲突/资源不足 | 检查端口和 Docker 资源 |
| **Nginx 配置重载失败** | 配置语法错误 | `nginx -t` 验证配置 |
| **流量分配不均** | 权重配置错误 | 检查 upstream weight |
| **用户会话丢失** | 无会话保持 | 添加 sticky cookie |
| **数据库冲突** | 新旧版本 schema 不兼容 | 确保向后兼容的迁移 |
| **监控数据缺失** | 日志格式不匹配 | 检查 log_format 配置 |

---

## 附录

### A. 配置文件快速参考

| 文件 | 用途 | 激活方式 |
|------|------|---------|
| `nocobase.conf` | 标准生产配置 | 默认 |
| `canary-weighted.conf` | 权重灰度模板 | `./canary.sh weighted 10` |
| `canary-precise.conf` | 精准路由模板 | `./canary.sh header` |
| `canary-ab-test.conf` | A/B 测试模板 | `./canary.sh ab-test` |
| `canary-active.conf` | 当前激活配置 | 自动生成 |

### B. 命令速查表

```bash
# 灰度策略
./scripts/canary.sh weighted 10    # 10% 权重灰度
./scripts/canary.sh header         # Header 灰度
./scripts/canary.sh ab-test        # A/B 测试

# 版本管理
./scripts/canary.sh start-canary   # 启动灰度容器
./scripts/canary.sh stop-canary    # 停止灰度容器
./scripts/canary.sh rollback       # 回滚

# 流量控制
./scripts/canary.sh adjust 25      # 调整到 25%

# 监控
./scripts/canary.sh status         # 查看状态
./scripts/canary.sh stats          # 流量统计
./scripts/canary.sh logs 100       # 查看日志
```

### C. 响应头标识

| 响应头 | 说明 | 示例值 |
|--------|------|--------|
| `X-Canary-Strategy` | 灰度策略 | `weighted`, `header`, `ab-test` |
| `X-Canary-Target` | 路由目标 | `stable`, `canary` |
| `X-Canary-Weight` | 灰度权重 | `10%` |
| `X-Upstream-Server` | 实际服务器 | `app:80`, `app-canary:80` |
| `X-AB-Group` | A/B 测试组 | `A`, `B` |
