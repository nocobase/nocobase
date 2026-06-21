# 备份还原

如果你已经把一个 NocoBase 应用保存成 CLI env，日常备份和恢复基本都在 `nb backup` 这一组命令里完成。`nb backup create` 用来在目标 env 创建备份并下载到本地，`nb backup restore` 用来把本地备份文件恢复到目标 env。

大多数时候，先记住一个默认建议就够了：升级、迁移、批量改数据前先备份；只有当你明确知道自己要覆盖当前数据时，再执行恢复。

## 快速索引

| 我想要…… | 用哪个命令 |
| --- | --- |
| 先把当前 env 备份到本地 | [`nb backup create`](../../api/cli/backup/create.md) |
| 把备份保存到指定目录 | [`nb backup create --output ./backups`](../../api/cli/backup/create.md) |
| 让脚本继续消费备份结果 | [`nb backup create --json-output`](../../api/cli/backup/create.md) |
| 把本地备份恢复到当前 env | [`nb backup restore --file ./backups/xxx.nbdata --force`](../../api/cli/backup/restore.md) |
| 把本地备份恢复到另一个 env | [`nb backup restore --env app1 --file ./backups/xxx.nbdata --yes --force`](../../api/cli/backup/restore.md) |

:::tip 先确认当前 env

`nb backup` 命令默认作用在当前 env 上。如果你同时维护多个环境，默认推荐先看一眼当前 env，再执行备份或恢复。

```bash
nb env current
nb env use app1
```

如果你显式传入了不同的 `--env`，CLI 通常会要求确认。脚本或非交互场景里，可以加 `--yes` 跳过这一步。

:::

## 创建备份

最简单的用法就是直接创建一个备份：

```bash
nb backup create
```

命令成功返回后，备份文件已经下载到本地。省略 `--output` 时，CLI 会把文件保存到当前工作目录，并沿用远端返回的文件名——通常是 `backup_*.nbdata`。

如果你想把备份统一放到一个目录里，可以这样用：

```bash
nb backup create --output ./backups
```

如果 `./backups` 已经存在，而且它是一个目录，CLI 会自动把远端备份文件名拼到这个目录后面。只有当路径不存在时，CLI 才会把它当成目标文件路径。

如果你要在脚本、CI 或 agent 链路里继续消费备份结果，可以加 `--json-output`：

```bash
nb backup create --env app1 --yes --json-output
```

这个模式下，CLI 不再输出进度文本，而是直接返回最终 JSON，里面通常会包含 `env`、`name` 和 `output` 三个字段。

## 恢复备份

恢复命令会把本地备份文件上传到目标 env，并覆盖当前应用数据：

```bash
nb backup restore --file ./backups/backup_20260520_190408_8397.nbdata --force
```

如果你要恢复到的不是当前 env，通常来说这样写更稳妥：

```bash
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

:::warning 注意

恢复是全量覆盖操作。默认推荐在恢复前，先对当前目标 env 再做一份备份。

```bash
nb backup create --env app1 --yes --output ./backups
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

:::

`nb backup restore` 会先检查 `--file` 指向的路径是否存在，并确认它是一个普通文件。上传成功后，CLI 还会继续等待应用重新通过健康检查，所以命令成功返回时，应用通常已经恢复到可访问状态。

如果没有传入 `--force`，交互终端会再要求你确认一次。在非交互终端、脚本和 AI agent 会话里，`--force` 是必需的。

## 常见情况

如果你更习惯在界面里操作，或者需要定时备份、云存储同步这类能力，可以直接看 [备份管理](../../ops-management/backup-manager/index.mdx)。这类场景下，Web UI 往往更合适。

## 相关链接

- [`nb backup` 命令参考](../../api/cli/backup/index.md)
- [`nb env` 命令参考](../../api/cli/env/index.md)
- [多环境管理](./multi-environment.md)
- [备份管理](../../ops-management/backup-manager/index.mdx)
