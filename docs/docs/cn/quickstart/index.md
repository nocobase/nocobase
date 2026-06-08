# 快速开始

NocoBase 的快速开始主要解决三件事：先把应用装起来，再把插件装起来，最后把应用稳定地跑起来。你不需要一次把所有文档都看完，按你当前所在的阶段往下走就够了。

如果你还没决定用哪种方式安装，默认先看 [使用 CLI 安装（推荐）](./installation/cli.md)。如果你更习惯直接在服务器上用容器跑起来，继续看 [通过 Docker Compose 安装](./installation/docker-compose.md)。

## 快速索引

| 我想要…… | 去哪里看 |
| --- | --- |
| 直接安装一个新的 NocoBase 应用 | [使用 CLI 安装（推荐）](./installation/cli.md) |
| 把旧的安装方式逐步迁移到 CLI | [从旧方式迁移到 CLI](./installation/migration.md) |
| 用 Docker Compose 在服务器上部署 | [通过 Docker Compose 安装](./installation/docker-compose.md) |
| 在无法访问公网的环境里安装 | [内网安装](./installation/airgap.md) |
| 先确认应用运行需要的关键环境变量 | [应用环境变量](./installation/env.md) |
| 安装第三方插件 | [第三方插件安装与升级](./plugins/third-party.md) |
| 给生产环境加上反向代理 | [Nginx](./production/reverse-proxy/nginx.md) / [Caddy](./production/reverse-proxy/caddy.md) |
| 查看应用、切换环境、备份还原 | [管理应用](./operations/manage-app.md) / [多环境管理](./operations/multi-environment.md) / [备份还原](./operations/backup-restore.md) |

## 默认路径

如果你不确定该怎么选，通常来说按下面这条路径走最省心：

1. 先看 [使用 CLI 安装（推荐）](./installation/cli.md)。
2. 应用跑起来后，再确认 [应用环境变量](./installation/env.md)。
3. 如果要正式上线，再补上 [Nginx](./production/reverse-proxy/nginx.md) 或 [Caddy](./production/reverse-proxy/caddy.md)。
4. 后续日常维护时，再看 [管理应用](./operations/manage-app.md) 和 [备份还原](./operations/backup-restore.md)。
