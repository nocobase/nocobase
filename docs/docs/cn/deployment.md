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

将本地应用部署到已有的 NocoBase Studio，由 Studio 管理应用的配置、运行和发布。下面的手动步骤采用支持部署包的进程内环境，且 Studio 能确定应用关联的源码仓库。Studio 管理地址与部署后应用的访问地址不同。

### 让 Agent 协助部署到 Studio {#studio-skill}

在本地应用项目目录中打开 Coding Agent，使用项目中的 nocobase-deployment Skill。该 Skill 已包含部署到已有 Studio 的流程；Agent 会读取项目的构建说明，并查询目标 Studio 的 CLI 命令说明。

首次连接时，在目标 Studio 的头像菜单中打开「在 agent 中使用 Studio」，把完整配置指令交给 Agent，并由你在浏览器中核对验证码、批准登录。已有 CLI 和登录连接时直接复用，确认连接的是目标 Studio。

替换下面的 Studio 地址、应用 ID 和环境 ID 后发送。首次部署的数据来源、更新时需要保留的数据，以及外部数据库等特殊要求，可一并说明。

**发送给本地 Coding Agent**

```text
使用 nocobase-deployment Skill，将当前项目部署到已有的 NocoBase Studio。

Studio 地址：https://studio.example.com/studio
应用 ID：purchase
环境 ID：preview

复用对应 Studio 的 CLI 连接，核对当前项目、目标应用和环境。
按目标环境构建部署包，使用 nb-studio 上传并部署本次构建的版本。
更新已有应用时保留现有配置、数据库和上传文件，先确认备份与恢复安排。
先从项目和 Studio 查询所需信息；数据来源、必填配置或 CLI 上传条件仍不明确时，列出需要我补充的内容。
需要审批时，提交部署申请并返回审批链接和当前状态。
实际部署成功后，验证应用访问、登录和主要功能，返回应用地址、部署版本和验证结果，注明尚未完成的检查。
```

### 1. 安装 CLI {#studio-cli}

以下命令在本地电脑的 Bash 终端执行，适用于 macOS、Linux 或 Windows WSL。已能运行 nb-studio 时可直接进入登录步骤。首次安装时，登录目标 Studio，在头像菜单中打开「在 agent 中使用 Studio」，复制其中的 CLI 安装命令。下载令牌有效期为 30 分钟；下面仅展示格式，请使用自己 Studio 生成的完整命令。

**本地 · Bash 终端**

```bash
curl -fsSL https://studio.example.com/studio/api/agents/dist/installScript \
  | sh -s -- --token '<download-token>'
```

nb-studio 由 Studio 提供，不通过 npm install -g @nocobase/studio-cli 安装。CLI 安装一次即可连接多个 Studio 实例。默认命令位于 ~/.local/bin，将它加入当前终端的 PATH 并检查：

**本地 · Bash 终端**

```bash
export PATH="$HOME/.local/bin:$PATH"
nb-studio --version
```

如果新开的终端找不到 nb-studio，将上面的 PATH 配置加入所用 shell 的启动文件。

### 2. 登录 Studio {#studio-login}

以下使用 profile studio 保存这个实例的连接；连接多个 Studio 时，为每个实例使用不同的 profile。替换示例地址，并保留实际部署路径（如 /studio）。已有有效连接时，直接用 whoami 核对地址、身份和权限；仅在首次连接或登录失效时执行 login。

**本地 · Bash 终端**

```bash
nb-studio --profile studio login \
  --server https://studio.example.com/studio
nb-studio --profile studio whoami --json
```

login 会显示登录地址和验证码，由你在浏览器中核对并批准。CLI 的业务命令由目标 Studio 提供；遇到命令或参数差异时，先通过 nb-studio --profile studio docs 查看该实例的说明。

### 3. 选择应用 {#studio-app}

以下以应用 purchase、环境 preview 为例，替换为自己的 ID。先查询环境和应用，确认现有应用所属的环境与部署目标一致：

**本地 · Bash 终端**

```bash
nb-studio --profile studio env list --json
nb-studio --profile studio env get preview --json
nb-studio --profile studio app get purchase --json
```

确认环境接受部署包，并了解目标系统、CPU 架构、Node.js 版本及审批要求。接收镜像的环境需要使用镜像发布流程。Studio 或 App Host 本身运行在 Docker 中，并不代表环境只能接收镜像。

首次部署时，仅在确认应用不存在、环境正确且账号有创建权限后创建应用：

**本地 · Bash 终端**

```bash
nb-studio --profile studio app create purchase \
  --name "Purchase" --env preview --json
```

检查应用已关联的源码仓库：

**本地 · Bash 终端**

```bash
nb-studio --profile studio build repo list --app-id purchase --json
```

后续 CLI 上传要求 Studio 能确定仓库并校验提交。新建应用不会自动建立仓库关联；列表为空时也可能是当前身份看不到关联项目，需先核实。未接入仓库的部署包需使用 Skill 中的网页或应用上传 API 流程，不适用下面的 CLI 上传示例。

### 4. 本地打包 {#studio-build}

在应用项目根目录，按项目声明的 pnpm 版本和构建说明操作。检查工作区改动，确保本次构建的源码对应已推送且 Studio 可校验的提交，并记录完整 SHA。更新已有应用前，先检查迁移与配置变化，完成数据库和文件备份并确认恢复方式。

**本地 · app 项目根目录 · Bash**

```bash
git status --short
git rev-parse HEAD
pnpm install --frozen-lockfile
```

先运行项目定义的类型检查、测试和 lint，再按目标平台构建。下面以 Linux x64、Node.js 24 为例，实际参数以目标环境为准：

**本地 · app 项目根目录 · Bash**

```bash
pnpm build --target linux-x64 --node-version 24 --tar
tar -tzf storage/exports/dist.tar.gz | head -30
```

部署包位于 storage/exports/dist.tar.gz，包含 dist/ 和 config.example.yml。核对应用名称、版本、目标平台和包的 SHA256。包不包含本地数据库、密钥或上传文件；首次使用新数据库和迁移已有业务数据应分别处理。

### 5. 上传部署包 {#studio-upload}

使用已登录的 profile 上传，仓库由 Studio 根据目标应用的关联确定。将 --sha 后的占位内容替换为本次构建所用的完整提交 SHA。可以先读取目标 Studio 提供的上传命令说明：

**本地 · app 项目根目录 · Bash**

```bash
nb-studio --profile studio docs release upload
```

**本地 · app 项目根目录 · Bash**

```bash
nb-studio --profile studio release upload \
  --app purchase \
  --sha '<commit-sha>' \
  --file storage/exports/dist.tar.gz \
  --json
```

CLI 会申请上传凭证并传输文件。确认命令成功且 result.data.release 有值，记录 result.data.release.id，后续配置检查和部署均使用这个 Release ID。上传完成不会自动启动应用；若 superseded 为 true，应基于最新目标提交重新构建。

上传响应不确定时，先查询版本列表，核对记录的源码提交与部署包校验和，再决定是否重试：

**本地 · app 项目根目录 · Bash**

```bash
nb-studio --profile studio release list purchase --json
```

### 6. 部署 {#studio-deploy}

将命令中的 Release ID 替换为本次上传的版本。先查看该版本的必填配置，沿用已有的应用或环境配置；存在 missing: true 时，通过 Studio 的「变量」页补齐能确定的值，无法确定的配置需由应用负责人提供。

**本地 · app 项目根目录 · Bash**

```bash
nb-studio --profile studio app env list purchase \
  --release '<release-id>' --json
```

保留已有数据库、文件存储和密钥。首次管理员配置只用于初始化账号，不会重置已有账号密码；示例数据是否启用按应用的实际用途设置。非受保护环境部署本次上传的版本：

**本地 · app 项目根目录 · Bash**

```bash
nb-studio --profile studio app deploy purchase \
  --release '<release-id>' \
  --wait true --json
```

--wait true 最多等待约 100 秒。返回时仍在排队或部署中，继续查询本次部署状态；响应不确定时先查部署记录。受保护环境使用下面的申请命令，等待审批人批准：

**本地 · app 项目根目录 · Bash**

```bash
nb-studio --profile studio deploy request purchase \
  --release '<release-id>' --json
```

记录申请 ID、审批链接和当前状态。待审批表示部署尚未完成，批准并实际部署成功后再验证新版本。

### 7. 检查状态和错误日志 {#studio-verify}

核对本次 Release 对应的部署记录，确认状态为 succeeded，再检查应用状态和运行日志：

**本地 · app 项目根目录 · Bash**

```bash
nb-studio --profile studio deploy list purchase --limit 5 --json
nb-studio --profile studio app get purchase --json
nb-studio --profile studio app logs purchase --level error --json
```

将列表中本次部署的 ID 填入下面的命令，可以查看准确状态和部署日志。deploy logs 是发布过程的日志，app logs 是应用运行日志：

**本地 · app 项目根目录 · Bash**

```bash
nb-studio --profile studio deploy get purchase '<deployment-id>' --json
nb-studio --profile studio deploy logs purchase '<deployment-id>' --json
```

确认应用的 currentVersion 对应本次 Release 的版本，runtime.state 为 running。使用 app get 返回的 result.data.url 作为应用访问地址，在其路径下检查 /api/healthz 返回的 ok 和应用身份，再验证页面刷新、静态资源、登录权限及一项主要业务操作。需要文件存储时，还应检查上传和下载。

首次生成的管理员账号由你在 Studio 应用「概览」的「初始管理员」中查看。记录访问地址、源码提交、Release ID、Deployment ID 和检查结果。涉及存储变更时，重启该应用验证数据与文件仍可用；未完成的验证需明确标注。

### 更新 Studio 中的应用 {#studio-update}

更新前检查迁移与配置差异，备份该应用的数据库和上传文件，并确认恢复方式。保留原有配置、密钥和存储，重新构建、上传，再部署新的 Release ID。只修改变量时可重新部署当前 Release。切换回旧版本不会自动恢复数据库或业务数据，回退前需确认兼容性。

部署到多个 Studio 实例时，为每个实例设置各自的地址和 profile，分别上传、部署、验证。Release ID 属于上传目标实例，不能把一个实例返回的 ID 用在另一个实例。Studio 地址改变后，需要使用新地址重新登录。
