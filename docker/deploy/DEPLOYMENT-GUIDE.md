# NocoBase Docker 本地部署方案

> **版本**: 1.0.0  
> **日期**: 2026-06-08  
> **分支**: feature/docker-deploy  
> **远程仓库**: git@github.com:naturegolden/nocobase.git

---

## 一、部署环境准备

### 1.1 环境要求

| 组件 | 版本要求 | 当前版本 | 状态 |
|------|---------|---------|------|
| Docker | >= 28.0 | 29.1.3 | ✅ |
| Docker Compose | >= 2.24 | 2.24.6 | ✅ |
| 本地镜像 | 4 个 | 已就绪 | ✅ |

### 1.2 本地镜像清单

| 镜像名称 | 标签 | 大小 | 来源路径 |
|---------|------|------|---------|
| postgres | 17 | 166MB | `/home/parallels/docker/docker-images/postgres-17.tar` |
| node | 22-bookworm-slim | 83MB | `/home/parallels/docker/docker-images/node-22-bookworm-slim.tar` |
| redis | 7.4.0-alpine | 18MB | `/home/parallels/docker/docker-images/redis-7.4.0-alpine.tar` |
| minio/minio | RELEASE.2025-09-08T02-42-37Z | 58MB | `/home/parallels/docker/docker-images/minio-RELEASE.2025-09-08T02-42-37Z.tar` |

### 1.3 网络要求

**完全离线部署**：所有镜像均来自本地目录 `/home/parallels/docker/docker-images/`，不依赖任何外部网络资源。

### 1.4 磁盘空间要求

| 用途 | 预估空间 |
|------|---------|
| Docker 镜像 | 500MB |
| PostgreSQL 数据 | 1GB（初始） |
| Redis 数据 | 100MB |
| MinIO 数据 | 1GB（初始） |
| NocoBase 存储 | 500MB |
| 备份文件 | 500MB |
| **总计** | **~4GB** |

---

## 二、源码部署与本地镜像构建

### 2.1 部署目录结构

```
nocobase/docker/deploy/
├── docker-compose.yml          # Docker Compose 编排配置
├── .env.example                # 环境变量模板
├── .env                        # 环境变量（不提交到Git）
├── .gitignore                  # Git 忽略规则
├── README.md                   # 快速参考
├── scripts/
│   ├── load-images.sh          # 加载本地镜像
│   ├── backup.sh               # 数据备份
│   ├── restore.sh              # 数据恢复
│   ├── health-check.sh         # 健康检查
│   └── manage.sh               # 服务管理
├── backups/                    # 备份文件目录
│   ├── postgres/               # PostgreSQL 备份
│   ├── redis/                  # Redis 备份
│   └── config/                 # 配置文件备份
├── logs/                       # 日志文件目录
└── storage/                    # 应用存储
    └── uploads/                # 上传文件
```

### 2.2 NocoBase 应用镜像构建

NocoBase 应用镜像基于 `node:22-bookworm-slim` 构建，构建过程如下：

#### 2.2.1 Dockerfile 构建参数

```dockerfile
# 基础镜像（本地已有）
FROM node:22-bookworm-slim

# 构建参数
ARG NODE_ENV=production

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget gnupg ca-certificates nginx libaio1 \
    && rm -rf /var/lib/apt/lists/*

# 复制 NocoBase 源码
COPY . /app
WORKDIR /app

# 安装依赖
RUN yarn install --production

# 构建应用
RUN yarn build

# 暴露端口
EXPOSE 80

# 启动命令
CMD ["yarn", "start"]
```

#### 2.2.2 构建命令

```bash
cd /home/parallels/nocobase/nocobase/docker/deploy

# 使用 docker compose 自动构建
docker compose build app

# 或手动构建
docker build -t nocobase/nocobase:local \
  --build-arg NODE_ENV=production \
  -f ../Dockerfile \
  ../../
```

#### 2.2.3 构建过程记录

| 步骤 | 说明 | 耗时 |
|------|------|------|
| 1. 加载基础镜像 | node:22-bookworm-slim（本地已有） | <1s |
| 2. 安装系统依赖 | nginx, libaio1 等 | ~30s |
| 3. 复制源码 | /app 目录 | ~10s |
| 4. 安装依赖 | yarn install --production | ~5min |
| 5. 构建应用 | yarn build | ~3min |
| 6. 创建镜像 | 打包为 nocobase/nocobase:local | ~30s |

#### 2.2.4 构建注意事项

1. **无需网络**：基础镜像来自本地，但 `yarn install` 需要 npm 仓库访问
2. **离线构建方案**：如有离线 yarn 缓存，可完全离线构建
3. **替代方案**：使用已有的 `node:22-bookworm-slim` 容器直接运行源码

---

## 三、数据库持久化方案

### 3.1 数据卷配置

| 数据卷 | 驱动 | 挂载路径 | 说明 |
|--------|------|---------|------|
| `postgres_data` | local | `/var/lib/postgresql/data` | PostgreSQL 数据库文件 |
| `redis_data` | local | `/data` | Redis 持久化文件 |
| `minio_data` | local | `/data` | MinIO 对象存储文件 |
| `nocobase_storage` | local | `/app/nocobase/storage` | NocoBase 应用存储 |

### 3.2 绑定挂载（Bind Mount）

| 宿主机路径 | 容器路径 | 说明 |
|-----------|---------|------|
| `./backups/postgres` | `/backups` | PostgreSQL 备份目录 |
| `./storage/uploads` | `/app/nocobase/storage/uploads` | 用户上传文件 |

### 3.3 数据卷管理命令

```bash
# 查看数据卷
docker volume ls | grep nocobase

# 查看数据卷详情
docker volume inspect nocobase_postgres_data

# 查看数据卷大小
docker system df -v | grep nocobase

# 清理数据卷（⚠️ 会删除所有数据）
docker compose down -v
```

### 3.4 权限管理策略

| 目录 | 所有者 | 权限 | 说明 |
|------|--------|------|------|
| PostgreSQL 数据 | postgres:postgres | 700 | 仅数据库用户可访问 |
| Redis 数据 | redis:redis | 700 | 仅 Redis 用户可访问 |
| MinIO 数据 | root:root | 755 | MinIO 进程管理 |
| NocoBase 存储 | node:node | 755 | 应用进程可读写 |
| 备份目录 | parallels:parallels | 755 | 备份脚本可读写 |

```bash
# 设置备份目录权限
chmod 755 /home/parallels/nocobase/nocobase/docker/deploy/backups/
chown -R parallels:parallels /home/parallels/nocobase/nocobase/docker/deploy/backups/
```

---

## 四、数据备份方案

### 4.1 备份策略

| 备份类型 | 频率 | 保留时间 | 存储位置 |
|---------|------|---------|---------|
| PostgreSQL | 每日 02:00 | 30 天 | `backups/postgres/` |
| Redis | 每日 02:30 | 30 天 | `backups/redis/` |
| 配置文件 | 每次变更 | 30 天 | `backups/config/` |
| 上传文件 | 每周 | 90 天 | 外部备份 |

### 4.2 备份文件命名规范

```
格式: nocobase_{组件}_{时间戳}_{版本}.{扩展名}

示例:
  nocobase_postgres_20260608_020000_v1.0.0.sql.gz
  nocobase_redis_20260608_023000_v1.0.0.rdb
  nocobase_config_20260608_120000_v1.0.0.tar.gz
```

| 字段 | 说明 | 示例 |
|------|------|------|
| 组件 | postgres/redis/config | postgres |
| 时间戳 | YYYYMMDD_HHMMSS | 20260608_020000 |
| 版本 | vX.Y.Z | v1.0.0 |
| 扩展名 | sql.gz/rdb/tar.gz | sql.gz |

### 4.3 备份操作

```bash
cd /home/parallels/nocobase/nocobase/docker/deploy

# 完整备份
./scripts/backup.sh full

# 仅备份 PostgreSQL
./scripts/backup.sh postgres

# 仅备份 Redis
./scripts/backup.sh redis

# 仅备份配置文件
./scripts/backup.sh config

# 查看备份列表
./scripts/backup.sh list

# 清理过期备份
./scripts/backup.sh cleanup
```

### 4.4 定时备份（Cron）

```bash
# 编辑 crontab
crontab -e

# 添加每日备份任务（每天凌晨 2 点）
0 2 * * * cd /home/parallels/nocobase/nocobase/docker/deploy && ./scripts/backup.sh full >> /var/log/nocobase-backup.log 2>&1

# 添加每周清理任务（每周日凌晨 3 点）
0 3 * * 0 cd /home/parallels/nocobase/nocobase/docker/deploy && ./scripts/backup.sh cleanup >> /var/log/nocobase-cleanup.log 2>&1
```

### 4.5 备份安全

1. **与运行环境分离**：备份文件存储在 `backups/` 目录，与运行数据卷独立
2. **定期验证**：每周验证备份文件完整性
3. **异地备份**：定期将备份复制到外部存储

```bash
# 验证备份完整性
gunzip -t backups/postgres/nocobase_postgres_*.sql.gz && echo "备份完整" || echo "备份损坏"

# 复制到外部存储
rsync -avz backups/ /mnt/external-backup/nocobase/
```

---

## 五、环境恢复机制

### 5.1 恢复步骤

#### 5.1.1 从最新备份恢复

```bash
cd /home/parallels/nocobase/nocobase/docker/deploy

# 完整恢复（使用最新备份）
./scripts/restore.sh full

# 仅恢复 PostgreSQL
./scripts/restore.sh postgres

# 仅恢复 Redis
./scripts/restore.sh redis

# 仅恢复配置文件
./scripts/restore.sh config
```

#### 5.1.2 从指定备份恢复

```bash
# 查看可用备份
./scripts/restore.sh list

# 从指定时间戳的备份恢复
./scripts/restore.sh full 20260608_020000

# 从指定文件恢复
./scripts/restore.sh postgres /path/to/backup.sql.gz
```

### 5.2 恢复验证

恢复完成后，运行健康检查验证：

```bash
./scripts/health-check.sh
```

### 5.3 回滚机制

恢复脚本会在恢复配置文件前自动创建当前配置的备份：

```
backups/config/nocobase_config_before_restore_20260608_120000.tar.gz
```

如需回滚恢复操作：

```bash
# 恢复恢复前的配置
tar -xzf backups/config/nocobase_config_before_restore_*.tar.gz -C .
docker compose restart
```

### 5.4 完整恢复流程

```
1. 停止应用服务
   ↓
2. 选择备份版本
   ↓
3. 恢复 PostgreSQL 数据库
   ↓
4. 恢复 Redis 数据
   ↓
5. 恢复配置文件
   ↓
6. 重启所有服务
   ↓
7. 运行健康检查
   ↓
8. 验证应用功能
```

---

## 六、运行环境管理

### 6.1 服务管理标准化流程

```bash
cd /home/parallels/nocobase/nocobase/docker/deploy

# 启动所有服务
./scripts/manage.sh start

# 停止所有服务
./scripts/manage.sh stop

# 重启所有服务
./scripts/manage.sh restart

# 查看服务状态
./scripts/manage.sh status

# 查看特定服务日志
./scripts/manage.sh logs app 200

# 跟随服务日志
./scripts/manage.sh follow app

# 进入容器
./scripts/manage.sh exec postgres
```

### 6.2 日志收集与管理

#### 6.2.1 日志查看

```bash
# 查看最近 100 行日志
docker logs --tail 100 nocobase-app

# 查看最近 1 小时日志
docker logs --since 1h nocobase-app

# 查看特定时间后日志
docker logs --since "2026-06-08T10:00:00" nocobase-app

# 导出日志到文件
docker logs nocobase-app > logs/app_$(date +%Y%m%d).log 2>&1
```

#### 6.2.2 日志级别

| 级别 | 说明 | 使用场景 |
|------|------|---------|
| error | 错误信息 | 系统错误、异常 |
| warn | 警告信息 | 潜在问题 |
| info | 一般信息 | 正常运行信息 |
| debug | 调试信息 | 开发调试 |

#### 6.2.3 日志轮转

```bash
# 清理 7 天前的日志
./scripts/manage.sh clean-logs

# 手动日志轮转
find ./logs -name "*.log" -mtime +7 -delete
```

### 6.3 系统状态监控

#### 6.3.1 监控指标

| 指标 | 命令 | 阈值 |
|------|------|------|
| 容器状态 | `docker compose ps` | 全部 running |
| CPU 使用 | `docker stats` | < 80% |
| 内存使用 | `docker stats` | < 80% |
| 磁盘使用 | `df -h` | < 90% |
| 数据库连接 | `pg_stat_activity` | < 100 |
| Redis 内存 | `redis-cli info memory` | < 256MB |
| 应用响应 | `curl -s -o /dev/null -w "%{http_code}" http://localhost:13000/` | 200/302 |

#### 6.3.2 健康检查

```bash
# 完整健康检查
./scripts/health-check.sh

# 快速检查
docker compose ps
```

#### 6.3.3 监控脚本（可选定时执行）

```bash
#!/bin/bash
# 简易监控检查
echo "$(date): $(docker compose ps --format '{{.Service}}: {{.Status}}' | tr '\n' ', ')" >> /var/log/nocobase-monitor.log
```

---

## 七、部署步骤

### 7.1 完整部署流程

#### 步骤 1：切换到部署分支

```bash
cd /home/parallels/nocobase/nocobase
git checkout feature/docker-deploy
git pull origin feature/docker-deploy
```

#### 步骤 2：进入部署目录

```bash
cd docker/deploy
```

#### 步骤 3：配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，修改以下关键配置：
# - APP_KEY: 生成随机密钥
# - DB_PASSWORD: 设置数据库密码
# - REDIS_PASSWORD: 设置 Redis 密码
# - MINIO_ROOT_PASSWORD: 设置 MinIO 密码

# 生成随机 APP_KEY
openssl rand -hex 32
```

#### 步骤 4：加载本地镜像

```bash
./scripts/load-images.sh
```

预期输出：
```
============================================
  NocoBase Docker 本地镜像加载工具
============================================

[SUCCESS] Docker 运行正常
[SUCCESS] 本地镜像目录存在: /home/parallels/docker/docker-images

[INFO] 开始加载本地镜像...

[INFO] 正在加载镜像: postgres-17.tar
[SUCCESS] 镜像加载成功: postgres-17.tar
...

============================================
[INFO] 镜像加载完成
[SUCCESS] 成功: 4 个
============================================
```

#### 步骤 5：构建 NocoBase 应用镜像

```bash
# 使用 docker compose 构建
docker compose build app

# 或使用项目根目录的 Dockerfile
cd ../..
docker build -t nocobase/nocobase:local -f Dockerfile .
cd docker/deploy
```

#### 步骤 6：启动服务

```bash
./scripts/manage.sh start
```

或使用 docker compose 直接启动：
```bash
docker compose up -d
```

#### 步骤 7：等待服务就绪

```bash
# 等待 30-60 秒让所有服务启动
sleep 60

# 检查服务状态
docker compose ps
```

#### 步骤 8：运行健康检查

```bash
./scripts/health-check.sh
```

#### 步骤 9：验证应用访问

```bash
# 检查 HTTP 响应
curl -I http://localhost:13000/

# 浏览器访问
# http://localhost:13000
```

### 7.2 部署注意事项

| 注意事项 | 说明 |
|---------|------|
| **端口冲突** | 确保 5432、6379、9000、9001、13000、80 端口未被占用 |
| **磁盘空间** | 确保至少 4GB 可用空间 |
| **内存要求** | 建议至少 4GB 可用内存 |
| **权限问题** | 确保当前用户有 Docker 操作权限 |
| **防火墙** | 确保防火墙允许访问所需端口 |
| **.env 安全** | 不要将 .env 文件提交到 Git |

### 7.3 常见问题解决

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 端口被占用 | 其他服务使用了相同端口 | 修改 .env 中的端口配置 |
| 镜像加载失败 | 镜像文件损坏 | 重新获取镜像文件 |
| 数据库连接失败 | PostgreSQL 未就绪 | 检查 PostgreSQL 健康状态 |
| 应用启动失败 | 依赖未安装 | 检查构建日志 |
| 权限不足 | 用户不在 docker 组 | `sudo usermod -aG docker $USER` |

### 7.4 部署验证

```bash
# 1. 检查所有容器运行中
docker compose ps

# 2. 检查健康状态
./scripts/health-check.sh

# 3. 检查应用响应
curl -s -o /dev/null -w "HTTP 状态码: %{http_code}\n" http://localhost:13000/

# 4. 检查数据库连接
docker exec nocobase-postgres pg_isready -U nocobase -d nocobase

# 5. 检查 Redis 连接
docker exec nocobase-redis redis-cli -a nocobase ping

# 6. 检查 MinIO
curl -s -o /dev/null -w "MinIO 状态码: %{http_code}\n" http://localhost:9000/minio/health/live
```

---

## 八、服务端口说明

| 服务 | 容器端口 | 宿主机端口 | 说明 |
|------|---------|-----------|------|
| Nginx | 80 | 80 | 反向代理入口 |
| NocoBase | 80 | 13000 | 应用直接访问 |
| PostgreSQL | 5432 | 5432 | 数据库 |
| Redis | 6379 | 6379 | 缓存 |
| MinIO API | 9000 | 9000 | 对象存储 API |
| MinIO Console | 9001 | 9001 | 对象存储控制台 |

---

## 九、Git 分支管理

### 9.1 分支策略

| 分支 | 说明 | 保护 |
|------|------|------|
| main | 生产分支 | 受保护 |
| feature/docker-deploy | 部署功能分支 | 开发中 |

### 9.2 提交规范

```bash
# 提交部署配置
git add docker/deploy/
git commit -m "feat(docker): 添加本地 Docker 部署配置

- 添加 docker-compose.yml 编排配置
- 添加环境变量模板
- 添加备份/恢复/健康检查脚本
- 添加服务管理脚本
- 完全基于本地镜像，无需网络拉取"

# 推送到远程
git push origin feature/docker-deploy
```

### 9.3 合并到主分支

```bash
# 创建 Pull Request
# 在 GitHub 上创建 PR: feature/docker-deploy -> main

# 或本地合并（不推荐直接合并到 main）
git checkout main
git merge feature/docker-deploy
git push origin main
```

---

## 十、附录

### 10.1 环境变量完整列表

| 变量 | 默认值 | 说明 |
|------|--------|------|
| APP_ENV | production | 应用环境 |
| APP_PORT | 13000 | 应用端口 |
| APP_KEY | - | 应用密钥（必须修改） |
| DB_USER | nocobase | 数据库用户 |
| DB_PASSWORD | - | 数据库密码（必须修改） |
| DB_DATABASE | nocobase | 数据库名称 |
| REDIS_PASSWORD | - | Redis 密码（必须修改） |
| MINIO_ROOT_USER | minioadmin | MinIO 用户 |
| MINIO_ROOT_PASSWORD | - | MinIO 密码（必须修改） |

### 10.2 Docker Compose 常用命令

```bash
# 启动
docker compose up -d

# 停止
docker compose down

# 重启
docker compose restart

# 查看日志
docker compose logs -f [服务名]

# 查看状态
docker compose ps

# 构建
docker compose build

# 拉取镜像（本方案不需要）
docker compose pull

# 清理
docker compose down -v --remove-orphans
```

### 10.3 故障排查清单

- [ ] Docker 服务是否运行？`systemctl status docker`
- [ ] 镜像是否加载？`docker images | grep -E "postgres|node|redis|minio"`
- [ ] 端口是否冲突？`netstat -tlnp | grep -E "5432|6379|9000|13000"`
- [ ] 磁盘空间是否充足？`df -h`
- [ ] 内存是否充足？`free -h`
- [ ] 容器日志是否有错误？`docker compose logs`
- [ ] 健康检查是否通过？`./scripts/health-check.sh`
