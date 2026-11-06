---
title: 应用部署
description: 通过 PM2 或 Docker 部署到自己的服务器，或将应用部署到 NocoBase Studio。选择一种方式，让 Agent 协助或按手动步骤完成部署。
sidebar: false
pageName: deployment
---

# 应用部署

通过 PM2 或 Docker 部署到自己的服务器，或将应用部署到 NocoBase Studio。选择一种方式，让 Agent 协助或按手动步骤完成部署。

- [通过 PM2 部署应用](#pm2)
- [通过 Docker 部署应用](#docker)
- [部署到 NocoBase Studio](#studio)

## PM2 / Docker 示例环境与访问 {#deployment-example}

PM2 和 Docker 共用以下示例。执行命令前，请替换为自己的服务器、部署目录和访问地址。Studio 部署使用管理员已配置的环境，访问地址以目标 App 页面显示的为准。

| 参数         | 示例值                              |
| ------------ | ----------------------------------- |
| 运行环境     | `Linux x64 · SQLite`                |
| 部署目录     | `/srv/apps/purchase`                |
| 公开访问地址 | `https://purchase.example.com/main` |
| 反向代理目标 | `127.0.0.1:13000`                   |

### 配置公开访问 {#deployment-access}

1. 将 purchase.example.com 指向目标服务器，并配置 HTTPS 证书。
2. 在同一台服务器上配置反向代理，转发至 127.0.0.1:13000，并保留 /main 路径。
3. 反向代理需支持 WebSocket，并向应用传递公开 Host 和协议信息。

以下部署命令不会自动配置 DNS、证书或反向代理，请在验证公开访问前完成这些配置。

## 通过 PM2 部署应用 {#pm2}

在本地构建部署包，使用 app-installer 通过 SSH 安装和更新，由 PM2 管理应用进程。

### 让 Agent 协助 PM2 部署 {#pm2-skill}

安装 nocobase-app-installer Skill，重新打开 Agent 会话，在 app 项目目录发送以下提示。外部数据库、回滚和 CI/CD 等进阶场景也可交给此 Skill。

**本地 · app 项目根目录**

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-app-installer -g
```

**发送给 Agent**

```text
使用 nocobase-app-installer Skill，通过 PM2 部署当前应用。
SSH：deploy@server.example.com
目录：/srv/apps/purchase
访问地址：https://purchase.example.com/main
数据库：SQLite
先检查环境和配置，再完成部署并验证。
```

### 1. 准备 PM2 环境 {#pm2-prepare}

本地安装 Node.js 24+、pnpm，并配置 SSH 登录。Linux 服务器安装 Node.js 24、tar，再以部署账号安装 PM2（4.3+）：

**服务器 · 部署账号**

```bash
npm install --global pm2
```

确保非交互 SSH 会话能找到 node 和 pm2。部署账号需对安装目录及父目录有写权限；首次安装使用新的或空目录。

### 2. 构建并安装应用 {#pm2-install}

**本地 · app 项目根目录**

```bash
pnpm install --frozen-lockfile
pnpm build --target linux-x64 --node-version 24 --tar
```

产物为 storage/exports/dist.tar.gz。将首次管理员密码注入本地环境变量 INITIAL_ADMIN_PASSWORD，然后安装：

**本地 · app 项目根目录**

```bash
npx --yes @nocobase/app-installer@beta install \
  --ssh deploy@server.example.com \
  --dir /srv/apps/purchase \
  --archive storage/exports/dist.tar.gz \
  --origin https://purchase.example.com \
  --base-path /main \
  --port 13000 --name nocobase-purchase \
  --set-from-env users.initialAdmin.password=INITIAL_ADMIN_PASSWORD \
  --json
```

安装器会上传部署包、生成配置、执行迁移并启动应用。示例使用 @beta；接入 CI 时建议固定已验证的安装器版本。

### 3. 配置开机启动并检查 {#pm2-verify}

**服务器 · 部署账号**

```bash
pm2 startup
```

先执行输出中提示的系统服务配置命令，再以同一个部署账号保存进程列表：

**服务器 · 部署账号**

```bash
pm2 save
```

完成上面的 HTTPS 和反向代理配置后，检查应用状态和公开访问：

**本地 · app 项目根目录**

```bash
npx --yes @nocobase/app-installer@beta status \
  --ssh deploy@server.example.com \
  --dir /srv/apps/purchase --json

curl --fail --silent --show-error \
  https://purchase.example.com/main/api/healthz
```

确认 status 的 result.health.ok 为 true、result.pending 为 null，健康接口返回 ok: true，再打开应用验证登录。同时检查页面刷新、登录权限和一项主要业务操作；使用文件存储时检查上传与下载，涉及存储变更时验证重启后的持久化。

### 更新 PM2 应用 {#pm2-update}

重新执行构建命令生成新包，先查询 status 确认没有未完成的操作，再运行升级预检：

**本地 · app 项目根目录**

```bash
npx --yes @nocobase/app-installer@beta upgrade \
  --ssh deploy@server.example.com \
  --dir /srv/apps/purchase \
  --archive storage/exports/dist.tar.gz \
  --json
```

检查预检结果并确认停机、备份安排后，在同一条命令中加上 --yes 执行更新，完成后重复状态和访问检查。安装器会备份 SQLite 和配置；上传文件需另行备份，外部数据库需先备份并加上 --backup-done。

## 通过 Docker 部署应用 {#docker}

使用 app 项目自带的 Dockerfile 构建镜像，在服务器挂载配置和数据后启动。构建机器和服务器均需安装 Docker，并登录自己的镜像仓库。

### 让 Agent 协助 Docker 部署 {#docker-skill}

app 项目已同步 nocobase-deployment Skill，可直接在项目目录让 Agent 使用。多架构、离线分发和 CI/CD 等进阶场景也在此 Skill 中。

**发送给 Agent**

```text
使用 nocobase-deployment Skill，通过 Docker 部署当前应用。
SSH：deploy@server.example.com
镜像：registry.example.com/purchase:release-001
目录：/srv/apps/purchase
访问地址：https://purchase.example.com/main
数据库：SQLite
先检查配置和数据挂载，再完成部署并验证。
```

### 1. 构建并分发镜像 {#docker-build}

**本地 · app 项目根目录**

```bash
docker build --platform linux/amd64 \
  -t registry.example.com/purchase:release-001 .
docker push registry.example.com/purchase:release-001
```

Dockerfile 会在镜像内安装依赖并构建，无需提前执行 pnpm build。保留配套的 Dockerfile.dockerignore，避免把配置、密钥和数据打入镜像。示例针对 x64；ARM64 服务器改用 linux/arm64。

**服务器 · 部署账号**

```bash
docker pull registry.example.com/purchase:release-001
```

### 2. 准备配置和数据 {#docker-config}

首次部署创建专用目录，并生成带独立密钥的 SQLite 配置。容器以 UID 1000 运行，需要有权读写这些目录。

**服务器 · 部署账号**

```bash
sudo install -d -o 1000 -g 1000 -m 750 \
  /srv/apps/purchase /srv/apps/purchase/storage

docker run --rm \
  --mount type=bind,src=/srv/apps/purchase,dst=/config \
  registry.example.com/purchase:release-001 \
  node dist/cli/index.js config init \
  --config /config/config.yml --dialect sqlite
```

将首次管理员密码注入服务器环境变量 INITIAL_ADMIN_PASSWORD，再写入配置：

**服务器 · 部署账号**

```bash
docker run --rm -e INITIAL_ADMIN_PASSWORD \
  --mount type=bind,src=/srv/apps/purchase/config.yml,dst=/app/config.yml \
  registry.example.com/purchase:release-001 \
  node dist/cli/index.js config set --from-env \
  users.initialAdmin.password=INITIAL_ADMIN_PASSWORD
```

config.yml 和 storage/ 始终保存在宿主机，更新镜像时继续使用。项目的 .env 不会自动传入容器；如需额外变量，在配置检查和启动命令中使用相同的 -e 或 --env-file 参数。

### 3. 启动容器并检查 {#docker-start}

先检查配置，检查通过后再启动：

**服务器 · 部署账号**

```bash
docker run --rm \
  -v /srv/apps/purchase/config.yml:/app/config.yml:ro \
  -v /srv/apps/purchase/storage:/app/storage \
  registry.example.com/purchase:release-001 \
  node dist/cli/index.js config check
```

**服务器 · 部署账号**

```bash
docker run -d --name purchase \
  --init --restart unless-stopped --stop-timeout 60 \
  -p 127.0.0.1:13000:13000 \
  -e APP_PUBLIC_ORIGIN=https://purchase.example.com \
  -e APP_BASE_PATH=/main \
  -v /srv/apps/purchase/config.yml:/app/config.yml:ro \
  -v /srv/apps/purchase/storage:/app/storage \
  registry.example.com/purchase:release-001
```

完成上面的 HTTPS 和反向代理配置后，检查容器和公开访问：

**服务器 · 部署账号**

```bash
docker inspect --format '{{.State.Health.Status}}' purchase

curl --fail --silent --show-error \
  https://purchase.example.com/main/api/healthz
```

等待容器状态变为 healthy，确认健康接口返回 ok: true，再打开应用验证登录。需要排查时执行 docker logs --tail 100 purchase。同时检查页面刷新、登录权限和一项主要业务操作；涉及持久化配置变更时，确认容器重建后数据库和上传文件仍可用。

### 更新 Docker 应用 {#docker-update}

用新标签（如 release-002）重新构建并推送镜像，保留旧镜像。拉取新镜像后，用新标签重复配置检查，通过后再停止旧容器：

**服务器 · 部署账号**

```bash
docker pull registry.example.com/purchase:release-002
```

**服务器 · 部署账号**

```bash
docker stop --timeout 60 purchase
```

停机后备份 config.yml、storage/ 和外部数据库。确认备份完成后删除旧容器：

**服务器 · 部署账号**

```bash
docker rm purchase
```

重新执行启动命令，将镜像标签改为 release-002，保留相同的配置、数据挂载和环境变量，然后重复检查。仅重启容器不会更新镜像；Docker 不会自动备份数据，回退镜像前需确认数据库兼容性。

## 部署到 NocoBase Studio {#studio}

按以下步骤将本地应用打包、上传并部署到已有的 NocoBase Studio。所有命令均在本地电脑执行。目标环境需支持部署包；本流程要求 Studio 能根据目标应用确定源码仓库并校验提交。

### 让 Agent 协助部署到 Studio {#studio-skill}

在应用项目目录中打开 Coding Agent，替换下面的地址和 ID 后发送。首次连接 Studio 时，先把头像菜单「在 agent 中使用 Studio」中的配置指令交给 Agent，并在浏览器中批准登录。

**发送给本地 Coding Agent**

```text
使用 nocobase-deployment Skill，将当前项目部署到 NocoBase Studio。

Studio 地址：https://studio.example.com/studio
应用 ID：purchase
环境 ID：preview

复用已有的 CLI 连接，完成打包、上传和部署。
更新时保留现有配置和数据；缺少必要信息时向我确认。
部署后检查状态、错误日志和应用访问，返回应用地址和验证结果。
需要审批时提交申请，并告知当前状态。
```

### 1. 安装 CLI {#studio-cli}

在 Studio 头像菜单打开「在 agent 中使用 Studio」，复制 CLI 安装命令，在本地 Bash 终端执行。下面仅为格式示例，请使用页面生成的完整命令；已安装可跳过。

**本地 · Bash 终端**

```bash
curl -fsSL https://studio.example.com/studio/api/agents/dist/installScript \
  | sh -s -- --token '<download-token>'
```

安装后检查命令是否可用：

**本地 · Bash 终端**

```bash
export PATH="$HOME/.local/bin:$PATH"
nb-studio --version
```

### 2. 登录 Studio {#studio-login}

将地址替换为自己的 Studio 地址，保留 /studio 等实际部署路径。以下用 studio 作为本地连接名称。已有目标 Studio 的有效登录时，直接用 whoami 检查即可。

**本地 · Bash 终端**

```bash
nb-studio --profile studio login \
  --server https://studio.example.com/studio
```

在浏览器中核对验证码并批准登录，然后检查登录身份：

**本地 · Bash 终端**

```bash
nb-studio --profile studio whoami --json
```

### 3. 选择应用 {#studio-app}

列出应用，找到要部署的应用 ID：

**本地 · Bash 终端**

```bash
nb-studio --profile studio app list --json
```

后续命令以 purchase 为例，请替换为选中的应用 ID。若还没有应用，先在 Studio 的「发布管理 → 应用」中新建，选择支持部署包的环境，并完成上传所需的源码关联。

### 4. 本地打包 {#studio-build}

在本地应用项目根目录执行。以下以 Linux x64、Node.js 24 为例，按目标环境调整构建参数：

**本地 · app 项目根目录 · Bash**

```bash
pnpm install --frozen-lockfile
pnpm build --target linux-x64 --node-version 24 --tar
```

生成的部署包为 storage/exports/dist.tar.gz。

### 5. 上传部署包 {#studio-upload}

使用第 2 步登录的连接上传部署包。将 <commit-sha> 替换为本次构建对应、Studio 可校验的完整提交 SHA：

**本地 · app 项目根目录 · Bash**

```bash
nb-studio --profile studio release upload \
  --app purchase \
  --sha '<commit-sha>' \
  --file storage/exports/dist.tar.gz \
  --json
```

确认 result.data.superseded 为 false 且 result.data.release 有值，再复制 result.data.release.id，作为下一步的 Release ID。上传不会自动部署应用。

### 6. 部署 {#studio-deploy}

将 <release-id> 替换为上一步返回的 ID，先检查必填配置：

**本地 · Bash 终端**

```bash
nb-studio --profile studio app env list purchase \
  --release '<release-id>' --json
```

若有 missing: true，在 Studio 应用的「变量」页补齐。非受保护环境执行下面的部署命令：

**本地 · Bash 终端**

```bash
nb-studio --profile studio app deploy purchase \
  --release '<release-id>' --wait true --json
```

若环境要求审批，改为提交部署申请，批准后再检查结果：

**本地 · Bash 终端**

```bash
nb-studio --profile studio deploy request purchase \
  --release '<release-id>' --json
```

--wait true 最多等待约 100 秒；仍在排队、部署中或等待审批时，按第 7 步继续检查。

### 7. 检查状态和错误日志 {#studio-verify}

查看本次部署记录、应用状态和错误日志：

**本地 · Bash 终端**

```bash
nb-studio --profile studio deploy list purchase --limit 5 --json
nb-studio --profile studio app get purchase --json
nb-studio --profile studio app logs purchase --level error --json
```

按 releaseId 找到本次部署，确认 status 为 succeeded，并核对 app get 返回的 app.currentDeploymentId 与其 id 一致。打开 result.data.url 验证登录和主要功能；按需启动或休眠的应用先访问唤醒，再确认 runtime.state 为 running。

首次由 Studio 生成的管理员凭据，如仍在保留期且未被清除，可在应用「概览」中查看。

### 更新 Studio 中的应用 {#studio-update}

更新时沿用原应用 ID、配置和存储，先备份数据库与上传文件。

重新打包并上传，将 <commit-sha> 替换为新代码对应的完整提交 SHA。同一应用、同一 SHA 再次上传会复用已有 Release，不能用旧 SHA 发布新的构建内容：

**本地 · app 项目根目录 · Bash**

```bash
pnpm install --frozen-lockfile
pnpm build --target linux-x64 --node-version 24 --tar

nb-studio --profile studio release upload \
  --app purchase \
  --sha '<commit-sha>' \
  --file storage/exports/dist.tar.gz \
  --json
```

确认本次上传返回有效 Release 后，将 result.data.release.id 填入 <release-id>。按第 6 步补齐必填配置；非受保护环境执行以下命令，需要审批时改为提交部署申请。

**本地 · app 项目根目录 · Bash**

```bash
nb-studio --profile studio app deploy purchase \
  --release '<release-id>' --wait true --json
```

部署后按第 7 步确认本次部署成功，并检查错误日志、登录和主要功能。
