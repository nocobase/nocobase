---
title: 升级 NocoBase 应用
description: 使用 NocoBase CLI 升级已保存为 env 的 NocoBase 应用，覆盖确认环境、执行升级、指定版本和升级后的验证。
---

# 升级 NocoBase 应用

:::tip 适用范围

这篇文档适用于通过 `nb init` 安装的应用。如果你的应用是通过旧方式安装的，先看 [NocoBase 如何从 2.0 升级到 2.1](./upgrade-from-2-0-to-2-1.md)。

:::

## 第一步：确认当前环境

先确认当前生效的 CLI env：

```bash
nb env current
```

如果不确定有哪些 env，可以先看列表：

```bash
nb env list
```

如果当前 env 不是要升级的应用，先切换到目标 env：

```bash
nb env use <env-name>
```

## 第二步：执行升级

:::warning 注意

默认升级会重新下载应用源码或 Docker 镜像。

如果是 npm / Git env，`source/` 目录会被删除后重新下载。不要把需要保留的文件放在 `source/` 里。

如果你已经手动准备好了源码或 Docker 镜像，不希望 CLI 重新下载，可以在命令后面加 `--skip-download`。

:::

默认升级命令是：

```bash
nb app upgrade
```

这个命令通常会依次完成：

1. 停止当前应用
2. 下载并替换已保存的源码或镜像
3. 同步商业插件
4. 升级并启动应用
5. 刷新 env runtime 信息

如果你在脚本、CI 或 AI Agent 会话里执行，需要显式跳过确认：

```bash
nb app upgrade --force
```

如果要升级的不是当前 env，可以指定 env：

```bash
nb app upgrade --env app1 --yes --force
```

### 指定版本升级

如果你要升级到指定版本，可以使用 `--version`：

```bash
nb app upgrade --version beta
```

也可以指定具体版本号：

```bash
nb app upgrade --version 2.1.0-beta.24
```

升级成功后，CLI 会把新的目标版本写回 env 配置，后续升级或恢复会继续使用这个版本信息。

### 跳过下载

如果你已经提前更新好了源码或 Docker 镜像，只想基于当前内容执行升级和启动，可以加 `--skip-download`：

```bash
nb app upgrade --skip-download
```

这个参数会跳过源码或镜像下载，也会跳过商业插件同步。通常只在你已经手动准备好目标版本时使用。

## 第三步：确认升级结果

升级完成后，先看 env runtime 和应用日志：

```bash
nb env info
nb app logs
```

然后打开应用页面，确认管理员账号可以正常登录。如果你要让 AI Agent 继续操作这个应用，建议新开或重启一次 AI Agent 会话，让它读取最新 env 信息。

## 相关链接

- [管理应用](../nocobase-cli/operations/manage-app.md) — 启动、停止、重启、查看日志和升级应用
- [`nb app upgrade` 命令参考](../api/cli/app/upgrade.md) — 查看升级命令的完整参数
- [多环境管理](../nocobase-cli/operations/multi-environment.md) — 确认、切换和维护多个 CLI env
