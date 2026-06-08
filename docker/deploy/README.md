# NocoBase Docker 本地部署配置

## 环境要求

- Docker >= 28.0
- Docker Compose >= 2.24
- 本地已有镜像（无需从远程拉取）

## 快速开始

```bash
# 1. 进入部署目录
cd docker/deploy

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，修改敏感信息

# 3. 加载本地镜像
./scripts/load-images.sh

# 4. 启动服务
docker compose up -d

# 5. 验证部署
./scripts/health-check.sh
```

## 目录结构

```
docker/deploy/
├── docker-compose.yml          # Docker Compose 配置
├── .env.example                # 环境变量模板
├── .env                        # 环境变量（不提交到Git）
├── scripts/
│   ├── load-images.sh          # 加载本地镜像脚本
│   ├── backup.sh               # 备份脚本
│   ├── restore.sh              # 恢复脚本
│   ├── health-check.sh         # 健康检查脚本
│   └── manage.sh               # 服务管理脚本
├── backups/                    # 备份文件目录
│   ├── postgres/               # PostgreSQL 备份
│   ├── redis/                  # Redis 备份
│   └── config/                 # 配置文件备份
└── storage/                    # 应用存储
    └── uploads/                # 上传文件
```

## 服务说明

| 服务 | 镜像 | 端口 | 说明 |
|------|------|------|------|
| postgres | postgres:17 | 5432 | PostgreSQL 数据库 |
| redis | redis:7.4.0-alpine | 6379 | Redis 缓存 |
| minio | minio/minio | 9000/9001 | MinIO 对象存储 |
| app | nocobase/nocobase:local | 13000 | NocoBase 应用 |
| nginx | node:22-bookworm-slim | 80 | Nginx 反向代理 |

## 数据持久化

| 数据卷 | 挂载路径 | 说明 |
|--------|---------|------|
| postgres_data | /var/lib/postgresql/data | PostgreSQL 数据 |
| redis_data | /data | Redis 数据 |
| minio_data | /data | MinIO 数据 |
| nocobase_storage | /app/nocobase/storage | NocoBase 存储 |

## 备份与恢复

```bash
# 备份
./scripts/backup.sh

# 恢复
./scripts/restore.sh <备份文件名>

# 查看备份列表
./scripts/backup.sh list
```

## 服务管理

```bash
# 启动
./scripts/manage.sh start

# 停止
./scripts/manage.sh stop

# 重启
./scripts/manage.sh restart

# 查看状态
./scripts/manage.sh status

# 查看日志
./scripts/manage.sh logs [服务名]
```
