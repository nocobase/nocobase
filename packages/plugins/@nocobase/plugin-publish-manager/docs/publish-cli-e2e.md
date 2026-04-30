# Publish CLI E2E 场景测试

本文档用于在真实环境中联调 `nb publish`。这类测试会访问已配置的 NocoBase 环境，其中 `execute` 可能执行备份还原或迁移，不能放进普通单元测试。

## 测试分层

| 层级 | 目标 | 是否破坏性 | 入口 |
| --- | --- | --- | --- |
| 单元测试 | CLI 参数、路径、manifest、checksum、API client | 否 | `vitest` |
| 服务端契约测试 | artifact 状态、adapter 注册、capabilities | 否 | `vitest` |
| 场景 E2E | 真实执行 `generate -> copy -> execute`，以及辅助发现命令 | 视场景而定 | `yarn --cwd packages/plugins/@nocobase/plugin-publish-manager e2e:publish` |

## Runner

脚本位置：

```bash
packages/plugins/@nocobase/plugin-publish-manager/scripts/publish-e2e.mjs
```

查看帮助：

```bash
yarn --cwd packages/plugins/@nocobase/plugin-publish-manager e2e:publish --help
```

所有运行日志和摘要默认写入全局 CLI 工作区：

```text
<global-root>/.nocobase/publish-e2e/runs/<scenario>-<timestamp>/
```

在 Windows 上，如果没有设置 `NB_CLI_ROOT`，当前用户默认是：

```text
C:\Users\Enzo\.nocobase\publish-e2e\runs\<scenario>-<timestamp>\
```

摘要文件：

```text
summary.json
```

发布文件默认下载到全局 CLI 工作区，而不是执行命令时所在目录：

```text
<global-root>/.nocobase/publish/<type>/<env>/<fileName>.nbdata
```

在 Windows 上，如果没有设置 `NB_CLI_ROOT`，当前用户默认是：

```text
C:\Users\Enzo\.nocobase\publish\<type>\<env>\<fileName>.nbdata
```

如果设置了 `NB_CLI_ROOT`，则使用：

```text
%NB_CLI_ROOT%\.nocobase\publish\<type>\<env>\<fileName>.nbdata
```

## 环境变量

先在 PowerShell 里统一设置源环境和目标环境。当前先做单环境测试，所以两个变量都设为 `dev`：

```powershell
$env:PUBLISH_E2E_SOURCE_ENV = 'dev'
$env:PUBLISH_E2E_TARGET_ENV = 'dev'
$PUBLISH_BIN = 'nb'
```

Runner 默认会读取这两个变量：

- `PUBLISH_E2E_SOURCE_ENV`：生成发布文件的源环境。
- `PUBLISH_E2E_TARGET_ENV`：上传和执行发布文件的目标环境。

后面要测跨环境时，只需要把目标环境改成别的环境名，例如：

```powershell
$env:PUBLISH_E2E_SOURCE_ENV = 'dev'
$env:PUBLISH_E2E_TARGET_ENV = 'test'
```

## 场景 1：Smoke

验证 `publish` 命令是否能被当前 `nb` 识别，不访问业务 API。

```powershell
yarn --cwd packages/plugins/@nocobase/plugin-publish-manager e2e:publish --scenario smoke --bin $PUBLISH_BIN
```

预期：

- `nb publish --help` 正常输出。
- `publish file`、`publish migration-rule`、`generate`、`copy`、`execute` 相关 help 正常输出。

## 场景 2：辅助发现命令

验证新增的辅助命令，不执行生成、上传、还原或迁移。

```powershell
yarn --cwd packages/plugins/@nocobase/plugin-publish-manager e2e:publish --scenario discovery --bin $PUBLISH_BIN
```

预期：

- `publish file list --scope local --type backup` 正常输出。
- `publish file list --scope remote --type backup` 正常输出。
- `publish file list --scope remote --type migration` 正常输出。
- `publish migration-rule list` 正常输出。
- 如果存在迁移规则，会继续执行 `publish migration-rule get`。

## 场景 3：备份生成并上传

验证非破坏性链路：在源环境生成备份包，下载到本地，再上传到目标环境暂存区。

```powershell
yarn --cwd packages/plugins/@nocobase/plugin-publish-manager e2e:publish --scenario backup-generate-copy --bin $PUBLISH_BIN
```

预期：

- 生成本地文件：`C:\Users\Enzo\.nocobase\publish\backup\dev\<fileName>.nbdata`
- `summary.json` 记录：
  - `localFile`
  - `fileName`
  - `generatedArtifactId`
  - `uploadedArtifactId`

如果要复用已有文件：

```powershell
yarn --cwd packages/plugins/@nocobase/plugin-publish-manager e2e:publish --scenario backup-generate-copy --bin $PUBLISH_BIN --file <fileName>.nbdata
```

也可以显式传完整路径：

```powershell
yarn --cwd packages/plugins/@nocobase/plugin-publish-manager e2e:publish --scenario backup-generate-copy --bin $PUBLISH_BIN --file C:\Users\Enzo\.nocobase\publish\backup\dev\<fileName>.nbdata
```

## 场景 4：备份自还原

验证完整链路：`generate -> copy -> execute`。该场景会执行 restore，属于破坏性测试。

默认不会真正执行还原：

```powershell
yarn --cwd packages/plugins/@nocobase/plugin-publish-manager e2e:publish --scenario backup-self-restore --bin $PUBLISH_BIN
```

真正执行需要显式确认：

```powershell
yarn --cwd packages/plugins/@nocobase/plugin-publish-manager e2e:publish --scenario backup-self-restore --bin $PUBLISH_BIN --allow-destructive
```

预期：

- 执行前目标环境默认创建一个当前状态备份。
- `publish execute` 返回 `State: executed`。
- 如果失败，`summary.json` 会记录失败步骤和命令输出日志路径。

## 场景 5：迁移生成并上传

验证迁移非破坏性链路：先在源环境通过 `publish migration-rule create` 创建全局迁移规则，拿到 `ruleId`，再通过 `publish generate --migration-rule` 生成迁移包、下载到本地、上传到目标环境暂存区。

默认规则是不创建独立规则：

- 用户自建表：`schema-only`
- 系统表：`overwrite-first`

```powershell
yarn --cwd packages/plugins/@nocobase/plugin-publish-manager e2e:publish --scenario migration-generate-copy --bin $PUBLISH_BIN
```

预期：

- 创建迁移规则：`publish migration-rule create`
- 查询迁移规则：`publish migration-rule get`
- 生成本地文件：`C:\Users\Enzo\.nocobase\publish\migration\dev\<fileName>.nbdata`
- `summary.json` 记录：
  - `ruleId`
  - `ruleValues`
  - `rule`
  - `localFile`
  - `fileName`
  - `generatedArtifactId`
  - `uploadedArtifactId`

如果要指定全局规则：

```powershell
yarn --cwd packages/plugins/@nocobase/plugin-publish-manager e2e:publish --scenario migration-generate-copy --bin $PUBLISH_BIN --migration-user-rule overwrite --migration-system-rule schema-only
```

如果已经有迁移规则，可以跳过创建规则：

```powershell
yarn --cwd packages/plugins/@nocobase/plugin-publish-manager e2e:publish --scenario migration-generate-copy --bin $PUBLISH_BIN --rule-id <ruleId>
```

如果要复用已有迁移文件：

```powershell
yarn --cwd packages/plugins/@nocobase/plugin-publish-manager e2e:publish --scenario migration-generate-copy --bin $PUBLISH_BIN --rule-id <ruleId> --file <fileName>.nbdata
```

## 场景 6：迁移自执行

验证完整迁移链路：`create rule -> generate -> copy -> execute`。该场景会执行迁移，属于破坏性测试。

默认不会真正执行迁移：

```powershell
yarn --cwd packages/plugins/@nocobase/plugin-publish-manager e2e:publish --scenario migration-self-run --bin $PUBLISH_BIN
```

真正执行需要显式确认：

```powershell
yarn --cwd packages/plugins/@nocobase/plugin-publish-manager e2e:publish --scenario migration-self-run --bin $PUBLISH_BIN --allow-destructive
```

预期：

- `publish execute --type migration` 返回 `State: executed`。
- 如果失败，`summary.json` 会记录失败步骤和命令输出日志路径。

## 建议执行顺序

1. 跑 `smoke`，确认 `nb publish` 可用。
2. 跑 `discovery`，确认本地/远程文件列表和迁移规则列表可用。
3. 跑 `backup-generate-copy`，确认 API、文件下载、上传暂存、manifest 都正常。
4. 跑 `migration-generate-copy`，确认规则创建、迁移包生成、上传校验都正常。
5. 确认当前 `dev` 是可还原的测试环境后，再跑 `backup-self-restore --allow-destructive` 或 `migration-self-run --allow-destructive`。

## 常见问题

| 现象 | 可能原因 | 处理 |
| --- | --- | --- |
| `Publish generate failed` | 目标环境未启用 `publishCommands` 或 backups 插件不可用 | 检查插件启用状态和服务端日志 |
| `No uploaded artifact found` | 没跑 copy 或 manifest 不匹配 | 重新跑 copy，或用 `--artifact <artifactId>` 手工执行 |
| 上传后 artifact 不可执行 | adapter 校验失败 | 查看 `summary.json` 和命令输出里的 error/checkResult |
| restore 后应用状态异常 | 备份文件不适配当前环境或还原失败 | 使用执行前自动创建的目标环境备份回滚 |
| 迁移生成失败 | 缺少 `ruleId`、迁移管理插件不可用，或规则结构不合法 | 查看 `migration-rule-create`、`migration-rule-get` 和 `migration-generate` 的 stdout/stderr 日志 |
