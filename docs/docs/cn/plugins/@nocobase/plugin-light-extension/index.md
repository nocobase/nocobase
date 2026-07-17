---
title: "轻插件"
keywords: "轻插件,GitHub 同步,RunJS,NocoBase"
displayName: "轻插件"
packageName: '@nocobase/plugin-light-extension'
description: |
  创建和管理多文件轻插件，并通过 GitHub.com 拉取或推送源码快照。
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
