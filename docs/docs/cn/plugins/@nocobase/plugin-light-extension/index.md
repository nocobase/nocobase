---
title: "轻插件"
keywords: "轻插件,GitHub 同步,RunJS,NocoBase"
displayName: "轻插件"
packageName: '@nocobase/plugin-light-extension'
description: |
  创建 RunJS 轻插件、上传可信的自定义前端应用，并管理 GitHub 源码同步。
isFree: true
builtIn: true
defaultEnabled: false
editionLevel: 0
---

# 轻插件

轻插件把多文件 RunJS 源码整理成可以复用的区块、字段、操作和其他 Entry。你可以从内置模板或 ZIP 文件创建轻插件，也可以直接从 GitHub.com 创建，并在之后继续 Pull 或 Push 源码。

同步以源码快照为单位。NocoBase 会保留本地版本和同步基线，不过不会把 GitHub 的完整提交历史镜像到本地。

## 开始之前

先在插件管理器中启用「轻插件」。如果需要访问私有仓库或向 GitHub Push，还要启用[变量和密钥](../plugin-environment-variables/index.md)。

GitHub Token 必须保存在「变量和密钥」插件中，并且变量类型必须是 `secret`。普通变量不能作为同步凭据。

建议使用 GitHub fine-grained personal access token，并只授权目标仓库：

- 只 Pull：Repository permissions 中的 Contents 设为 Read-only
- 需要 Push：Repository permissions 中的 Contents 设为 Read and write

Token 的值不会写入轻插件配置，也不会通过同步接口回显。轻插件只保存类似 `{{ $env.GITHUB_SYNC }}` 的 `authRef`，界面再次显示时还会遮盖变量名的一部分。

:::tip 公开仓库可以匿名 Pull

如果没有配置 Token，公开仓库仍可以匿名测试连接和 Pull。私有仓库 Pull 以及所有需要身份的 Push 会返回 credential unavailable。

如果「变量和密钥」没有启用，匿名访问仍可尝试；不过不能选择 Token secret，也不能完成需要凭据的操作。

:::

## 创建轻插件

进入「插件设置 / 轻插件」，点击「添加新项」。填写名称、标题和说明后，在「源码」中选择一种来源。

<!-- 需要一张「创建轻插件」对话框中 Template、ZIP file 和 GitHub source 三种来源的截图 -->

### 从模板创建

选择「模板」，再点击「创建」。NocoBase 会创建默认源码、校验 Entry，并生成可以运行的编译产物。

### 从 ZIP 文件创建

选择「ZIP 文件」，上传源码压缩包，再点击「创建」。压缩包会先经过路径、文件数量、文件大小、UTF-8 和重复路径等安全校验，然后才会创建和编译轻插件。

ZIP 导入不会连接远程仓库。后续需要 GitHub 同步时，可以在列表中点击「同步代码」再配置来源。

### 从 GitHub 创建

选择「GitHub 来源」，然后填写：

- 「GitHub 仓库」——支持 `owner/repository` 或 `https://github.com/owner/repository`
- 「分支」——留空时使用远程默认分支
- 「子目录」——留空时同步仓库根目录
- 「Token secret」——公开仓库可留空；私有仓库从已有的 `secret` 变量中选择

点击「创建」后，NocoBase 会检查仓库、分支、子目录和凭据，Pull 远程快照，校验并编译源码，再建立首次同步基线。

当 GitHub 已经是代码来源时，优先使用「从 GitHub 创建」。这样不会遇到首次绑定时双方内容不同且无法判断以哪一边为准的问题。

## 配置已有轻插件的同步来源

在轻插件列表中找到目标记录，点击「同步代码」。第一次打开时填写 GitHub 仓库、分支、子目录和可选的「Token secret」。

<!-- 需要一张「同步代码」抽屉中 GitHub 配置、Test connection 和 Configure 操作的截图 -->

建议先点击「测试连接」，确认后再点击「配置」。配置成功后，再次打开「同步代码」会自动生成最新 Plan，并显示本地 Head、远程 revision 和当前同步状态。

Plan 会固定这一次操作看到的本地 Head、远程 revision 和配置版本。执行 Pull 或 Push 前如果任一侧又发生变化，操作会停止。重新打开或刷新「同步代码」，获取新 Plan 后再试即可。

## Pull、Push 与断开连接

「同步代码」会根据 Plan 启用当前安全的操作：

- 「从 Git 拉取」把远程快照交给轻插件校验、编译，并在一个本地事务中更新 Head 和运行时产物
- 「推送到 Git」把当前本地快照发布到 GitHub，并要求远程 revision 跟 Plan 一致
- 「断开连接」停用同步来源并清除凭据引用，不删除本地轻插件源码、GitHub 仓库内容或内部同步基线；重新连接同一目标时可以继续使用原有基线

Push 前会出现确认对话框。首版同步不会 force push；如果远程分支已经变化，NocoBase 会停止并要求重新生成 Plan。

## 看懂同步状态

| 状态 | 含义 | 下一步 |
| --- | --- | --- |
| In sync | 本地和远程快照一致 | 不需要操作 |
| Local changes | 本地有新版本，远程仍是上次同步的版本 | 使用「推送到 Git」 |
| Remote changes | 远程有新版本，本地仍是上次同步的版本 | 使用「从 Git 拉取」 |
| Diverged | 本地和远程都从上次同步基线发生了变化 | 在 NocoBase 外手工整理出唯一结果，再让一侧回到可安全同步的状态 |
| Initial sync needs a clear source | 首次绑定时双方都是非空内容，而且内容不同 | 从 GitHub 重新创建轻插件，或者改用空分支 / 空子目录完成首次同步 |

`Diverged` 时不会自动合并，也不会选择任意一侧覆盖另一侧。你可以先导出或复制两边源码，在本地编辑器中手工合并，再通过「编辑代码」和 GitHub 分别把确认后的同一份快照保存到两边。重新打开「同步代码」检查 Plan；如果不能让双方内容一致，可以断开连接后使用「从 GitHub 创建」或空目标重新建立明确基线。

## 托管自定义前端应用

**自定义前端应用（Custom frontend application）** 是上传到轻插件中的已构建浏览器应用。多工作区可以把它发布到一个工作区 URL，同时继续使用 NocoBase 现有的登录、角色和 API 权限检查。

:::warning 注意

只允许管理员上传自定义前端包。包里的 HTML 和 JavaScript 会作为可信的同源代码运行，并且可以使用当前用户的 NocoBase 会话。这个能力不提供不可信代码沙箱。

:::

### 准备 ZIP 包

ZIP 根目录必须包含 `entry.json`。一个最小的包类似于：

```text
entry.json
index.html
assets/
  app.js
  app.css
  logo.png
```

`schemaVersion` 固定为 `1`。`key` 使用稳定的小写 slug，格式为 `^[a-z0-9][a-z0-9-]{0,62}$`。`entry` 可以省略，默认值是 `index.html`。

```json
{
  "schemaVersion": 1,
  "key": "customer-console",
  "title": "客户工作台",
  "entry": "dist/application.html"
}
```

`dirname(entry)` 是静态根。如果 `entry` 是 `dist/application.html`，那么只有 `dist/` 下的文件会被托管，`application.html` 是应用入口文档。

资源地址要使用 `./assets/app.js` 或 `assets/app.css` 这样的相对路径。首版不支持 `/assets/app.js` 这样的根绝对路径——它会指向 NocoBase 的部署根，而不是当前工作区。

### 使用 Vite 构建最小包

下面以 Vite 的 vanilla TypeScript 模板为例。React、Vue 等模板的打包要求相同。

先创建项目并安装依赖：

```bash
npm create vite@latest customer-console -- --template vanilla-ts
cd customer-console
npm install
```

把 `vite.config.ts` 设置为相对资源模式：

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
});
```

如果没有设置 `base: './'`，Vite 默认会生成 `/assets/*` 根绝对地址，上传后无法从工作区路径加载。

在项目中创建 `public/entry.json`：

```json
{
  "schemaVersion": 1,
  "key": "customer-console",
  "title": "客户工作台",
  "entry": "index.html"
}
```

Vite 会把 `public/` 中的文件复制到 `dist/` 根目录。构建并打包：

```bash
npm run build
cd dist
zip -r ../customer-console.zip .
unzip -t ../customer-console.zip
```

最终 ZIP 的根目录至少包含：

```text
entry.json
index.html
assets/
```

`public/` 中的 favicon 等文件也会一起进入 ZIP，这是正常的。上传前先解压检查一次。不要把 `dist/` 目录本身再包进 ZIP，也不要上传整个 Vite 源码目录。

### 上传和替换当前应用

进入「插件设置 / 轻插件」，找到目标轻插件，点击「自定义前端」。选择 ZIP 包，确认应用信息后保存。

再次上传相同 `key` 的包会替换当前内容，不过 Entry ID 不会变化，所以已有的多工作区绑定会继续生效。如果校验或存储失败，旧内容仍然可用。

对外只提供当前内容。这里没有 release list、publish、版本历史、回滚或在线构建流程。

上传的机械限制如下：

| 项目 | 限制 |
|---|---|
| ZIP 压缩包 | 50 MiB |
| 文件数量 | 2,000 |
| 单个解压文件 | 25 MiB |
| 解压后总大小 | 200 MiB |
| 压缩比 | 100:1 |
| `entry.json` | 128 KiB |

上传还会拒绝路径穿越、绝对路径、反斜杠、链接、特殊设备文件、重复路径和不区分大小写的路径冲突。

### 绑定到多工作区

启用[多工作区](../plugin-multi-portal/index.md)，新建或编辑一个工作区，把「前端类型」设为「自定义前端」，再选择已经上传的应用。

工作区 URL 会成为应用的资源基址。NocoBase 会在响应入口 HTML 时插入正确的 `<base>`，所以根路径和 history router 深层路径都可以加载同一组相对资源。

### 调用 NocoBase API

应用可以使用原生 `fetch` 或 `@nocobase/sdk/client`。请求保持同源后，浏览器会携带现有登录 Cookie。

原生 `fetch` 的 GET 请求可以这样写：

```js
const apiBase = window.__nocobase_api_base_url__ || '/api/';

const response = await fetch(`${apiBase.replace(/\/$/, '')}/orders:list`, {
  credentials: 'same-origin',
});
```

除 GET、HEAD 和 OPTIONS 外，其他 HTTP method 都要把可读的 CSRF Cookie 复制到 `X-CSRF-Token` header。Cookie 名是 `nb_csrf_token_<appName>`；主应用使用 `main`，子应用名称可以从注入的 API base URL 中读取。

```js
const apiBase = window.__nocobase_api_base_url__ || '/api/';
const appNameMatch = apiBase.match(/\/__app\/([^/]+)/);
const appName = appNameMatch ? decodeURIComponent(appNameMatch[1]) : 'main';
const csrfToken = document.cookie
  .split(';')
  .map((item) => item.trim())
  .find((item) => item.startsWith(`nb_csrf_token_${appName}=`))
  ?.split('=')
  .slice(1)
  .join('=');

await fetch(`${apiBase.replace(/\/$/, '')}/orders:create`, {
  method: 'POST',
  credentials: 'same-origin',
  headers: {
    'Content-Type': 'application/json',
    ...(csrfToken ? { 'X-CSRF-Token': decodeURIComponent(csrfToken) } : {}),
  },
  body: JSON.stringify({ title: '新订单' }),
});
```

SDK 版本应与 NocoBase 版本匹配。把下面示例中的版本号替换为当前 NocoBase 版本，再把 SDK 构建进浏览器 bundle：

```bash
NOCOBASE_VERSION=2.2.0-beta.15
npm install "@nocobase/sdk@${NOCOBASE_VERSION}"
```

如果你正在 NocoBase 源码仓库中开发，并且对应版本尚未发布，可以直接安装当前源码包：

```bash
npm install /path/to/nocobase/packages/core/sdk
```

SDK 会读取页面中注入的 API base URL，并沿用现有 Cookie 和 CSRF 行为：

```ts
import { createClient } from '@nocobase/sdk/client';

const client = createClient();

const response = await client.request({
  url: 'orders:list',
  method: 'get',
});
```

工作区权限和数据 API 权限是两套检查。能打开工作区，只表示当前角色可以加载这个前端应用。每一次 API 请求仍然要经过 NocoBase 中配置的 collection、resource、field 和 role 权限。

### 排查托管问题

| 状态 | 检查内容 |
|---|---|
| `404` | 检查请求的相对路径、`entry.json.entry`，以及缺失请求是文档导航还是 JS/CSS/图片请求 |
| `403` | 检查用户的工作区角色权限，以及目标 API 自己的数据权限 |
| `503` | 检查轻插件是否启用、仓库是否启用、Entry 是否存在、当前资源是否完整 |

未登录的文档请求会跳转到 NocoBase v2 登录页，登录后再回到原工作区 URL。未登录的静态资源请求返回 `401`，不会返回 HTML。

## 常见错误

### Credential unavailable

检查「变量和密钥」是否已启用、变量是否存在、类型是否为 `secret`，以及当前值是否为空。普通变量和不完整的表达式都不会被接受。

### Authentication failed 或权限不足

检查 Token 是否过期、是否授权了正确仓库，以及 Contents 权限是否满足操作。Pull 至少需要 Read-only，Push 需要 Read and write。

### Branch protection

GitHub branch protection 或 ruleset 可能禁止 Token 直接更新目标分支。给该身份配置允许的规则，或者改用允许写入的分支。NocoBase 不会绕过保护规则，也不会 force push。

### Rate limit reached

等待 GitHub rate limit 重置后再点击「测试连接」、Pull 或 Push。频繁重试不会跳过限制。

### Remote source changed

这表示 GitHub 在 Plan 生成后又有新提交，或者远程配置版本已经变化。重新打开「同步代码」获取新 Plan，再决定 Pull 或 Push。

### Another sync operation is in progress

同步任务处于 `pending`、`running` 或 `finalize-pending` 时，配置、断开连接、归档和删除都会返回 busy。等待任务完成或恢复流程结束，然后重新执行原操作。不要通过修改内部同步表来跳过保护。

## 首版限制

首版只支持 GitHub.com HTTPS 仓库、一个分支和可选的一个子目录。当前不支持：

- GitHub Enterprise、GitLab 和其他 Provider
- SSH、Git LFS 和 submodule
- Webhook、schedule 和自动同步
- auto-merge、自动冲突解决和 force push
- 完整 Git 历史镜像

## 相关链接

- [变量和密钥](../plugin-environment-variables/index.md) — 创建同步使用的 `secret` 类型 Token
- [多工作区](../plugin-multi-portal/index.md) — 把自定义前端应用绑定到工作区 URL
