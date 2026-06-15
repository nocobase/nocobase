
# NocoBase Docker 部署指南

---

## 1. 项目配置概述

### 1.1 文件结构

| 文件 | 路径 | 说明 |
|------|------|------|
| Dockerfile.prod | `/Dockerfile.prod` | 生产环境专用Dockerfile |
| .dockerignore | `/.dockerignore` | Docker构建忽略规则 |
| docker-deploy.yml | `/.github/workflows/docker-deploy.yml` | GitHub Actions CI/CD工作流 |

### 1.2 分支策略

| 分支 | 用途 | 触发动作 |
|------|------|----------|
| `deploy/docker` | 部署分支 | 代码推送时自动构建并推送Docker镜像 |
| `main` | 主分支 | 稳定版本 |
| `develop` | 开发分支 | 开发集成 |

---

## 2. Dockerfile 设计说明

### 2.1 多阶段构建

```
┌─────────────────────────────────────────────┐
│  Stage 1: Builder (node:20-bookworm)       │
│  - 安装构建依赖                             │
│  - 安装npm依赖                              │
│  - 执行 yarn build                          │
└─────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│  Stage 2: Runtime (node:20-bookworm-slim)  │
│  - 仅包含运行时依赖                         │
│  - 非root用户运行                           │
│  - 最小化镜像体积                           │
└─────────────────────────────────────────────┘
```

### 2.2 安全特性

| 特性 | 说明 |
|------|------|
| 非root用户 | 使用 `nocobase` 用户运行容器 |
| 最小基础镜像 | 使用 `-slim` 版本减少攻击面 |
| 健康检查 | 自动检测服务状态 |
| 依赖最小化 | 仅安装必需的运行时依赖 |

### 2.3 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `NODE_ENV` | Node.js环境 | production |

### 2.4 架构支持

| 架构 | 支持状态 | 说明 |
|------|----------|------|
| linux/amd64 | ✅ 支持 | Intel/AMD 处理器 |
| linux/arm64 | ✅ 支持 | Apple Silicon (M1/M2/M3/M4 PRO) |

---

## 2.5 Apple Silicon (M4 PRO) 专用说明

### 2.5.1 本地构建

在mac M4 PRO上构建和运行Docker镜像：

```bash
# 构建arm64架构镜像
docker build -f Dockerfile.prod \
  --platform linux/arm64 \
  -t nocobase:arm64 .

# 运行arm64镜像
docker run -d \
  --platform linux/arm64 \
  -p 80:80 \
  -p 3000:3000 \
  nocobase:arm64
```

### 2.5.2 拉取预构建镜像

```bash
# 从GitHub Packages拉取多平台镜像
docker pull ghcr.io/naturegolden/nocobase:deploy/docker

# Docker会自动选择适合当前架构的镜像
docker run -d -p 80:80 -p 3000:3000 ghcr.io/naturegolden/nocobase:deploy/docker
```

### 2.5.3 Ubuntu虚拟机环境配置

如果在mac M4 PRO的Ubuntu虚拟机中部署：

```bash
# 确保Docker已正确配置
docker run --rm arm64v8/ubuntu uname -m
# 应输出: aarch64

# 验证QEMU支持（如需要）
docker run --rm --platform linux/amd64 alpine uname -m
# 如果输出x86_64则说明QEMU配置正确
```

### 2.5.4 性能优化建议

| 优化项 | 说明 | 配置方式 |
|--------|------|----------|
| 内存分配 | 建议至少4GB | Docker Desktop设置 |
| CPU核心 | 建议分配4核以上 | Docker Desktop设置 |
| 磁盘IO | 使用SSD加速 | 使用本地磁盘 |
| 缓存 | 启用Docker Buildx缓存 | 构建时自动启用 |
| `APP_DIR` | 应用目录 | /app/nocobase |
| `STORAGE_DIR` | 存储目录 | /app/nocobase/storage |
| `LOG_DIR` | 日志目录 | /app/nocobase/logs |

---

## 3. 构建命令

### 3.1 本地构建

```bash
# 构建生产镜像
docker build -f Dockerfile.prod -t nocobase:latest .

# 构建并指定标签
docker build -f Dockerfile.prod -t nocobase:v2.0.0 .

# 构建时传递参数
docker build -f Dockerfile.prod \
  --build-arg COMMIT_HASH=$(git rev-parse HEAD) \
  -t nocobase:latest .
```

### 3.2 运行容器

```bash
# 简单运行
docker run -d -p 80:80 -p 3000:3000 nocobase:latest

# 带数据持久化
docker run -d \
  -p 80:80 \
  -p 3000:3000 \
  -v /host/path/storage:/app/nocobase/storage \
  -v /host/path/logs:/app/nocobase/logs \
  nocobase:latest

# 自定义环境变量
docker run -d \
  -p 80:80 \
  -p 3000:3000 \
  -e DATABASE_HOST=db \
  -e DATABASE_PORT=5432 \
  -e DATABASE_NAME=nocobase \
  -e DATABASE_USER=nocobase \
  -e DATABASE_PASSWORD=password \
  nocobase:latest
```

---

## 4. GitHub Actions CI/CD 配置

### 4.1 工作流触发条件

| 事件 | 分支/标签 | 动作 |
|------|----------|------|
| `push` | `deploy/docker` | 构建并推送镜像 |
| `push` | `v*` (标签) | 构建并推送版本镜像 |
| `pull_request` | `deploy/docker` | 仅构建（不推送） |

### 4.2 镜像标签策略

| 标签类型 | 格式 | 说明 |
|----------|------|------|
| 分支名 | `deploy/docker` | 分支构建 |
| PR号 | `pr-123` | 拉取请求构建 |
| 版本号 | `v2.0.0` | 语义化版本标签 |
| 主版本 | `v2` | 主版本标签 |
| commit SHA | `abc123` | 短commit哈希 |

### 4.3 安全扫描

工作流包含自动安全扫描：
- **Trivy** - 容器镜像漏洞扫描
- **SARIF报告** - 上传至GitHub Security

### 4.4 通知机制

| 事件 | 通知方式 | 内容 |
|------|----------|------|
| 构建成功 | GitHub Issue | 部署成功通知 |
| 构建失败 | GitHub Issue | 失败原因和日志链接 |

---

## 5. 环境变量配置

### 5.1 数据库配置

```bash
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=nocobase
DATABASE_USER=nocobase
DATABASE_PASSWORD=your_password
DATABASE_DIALECT=postgres
```

### 5.2 应用配置

```bash
# 应用端口
PORT=3000

# 管理后台路径
ADMIN_PATH=/admin

# JWT密钥
JWT_SECRET=your-secret-key

# 文件上传大小限制
MAX_FILE_SIZE=52428800

# 日志级别
LOG_LEVEL=info
```

---

## 6. 部署到生产环境

### 6.1 使用 Docker Compose

创建 `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  nocobase:
    image: ghcr.io/naturegolden/nocobase:latest
    ports:
      - "80:80"
      - "3000:3000"
    environment:
      - DATABASE_HOST=postgres
      - DATABASE_NAME=nocobase
      - DATABASE_USER=nocobase
      - DATABASE_PASSWORD=${DB_PASSWORD}
    volumes:
      - nocobase-storage:/app/nocobase/storage
      - nocobase-logs:/app/nocobase/logs
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:16
    environment:
      - POSTGRES_DB=nocobase
      - POSTGRES_USER=nocobase
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  nocobase-storage:
  nocobase-logs:
  postgres-data:
```

### 6.2 Kubernetes 部署示例

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nocobase
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nocobase
  template:
    metadata:
      labels:
        app: nocobase
    spec:
      containers:
      - name: nocobase
        image: ghcr.io/naturegolden/nocobase:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_HOST
          value: "postgres-service"
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

---

## 7. 最佳实践

### 7.1 安全建议

1. **使用非root用户** - Dockerfile已配置，不要以root运行
2. **定期更新基础镜像** - 关注官方Node.js安全更新
3. **扫描镜像漏洞** - 使用Trivy等工具定期扫描
4. **敏感信息管理** - 使用Secrets管理数据库密码等敏感信息
5. **限制网络访问** - 只暴露必要的端口

### 7.2 性能优化

1. **使用缓存** - GitHub Actions已配置缓存
2. **多平台构建** - 支持amd64和arm64架构
3. **镜像瘦身** - 多阶段构建减少最终镜像体积
4. **资源限制** - 在容器编排中设置合理的资源限制

### 7.3 监控和日志

1. **健康检查** - Dockerfile已配置健康检查
2. **日志收集** - 配置日志收集到集中式日志系统
3. **指标监控** - 集成Prometheus等监控工具

---

## 附录：常用命令

```bash
# 查看镜像列表
docker images

# 查看运行中的容器
docker ps

# 查看容器日志
docker logs <container-id>

# 进入容器
docker exec -it <container-id> bash

# 删除镜像
docker rmi <image-id>

# 清理无用镜像
docker image prune
```

---

*文档版本：v1.0*
*最后更新：2026年6月*
