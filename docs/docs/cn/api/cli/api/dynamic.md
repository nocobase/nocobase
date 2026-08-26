---
title: "nb api 动态命令"
description: "nb api 动态命令参考：根据 NocoBase OpenAPI Schema 生成的 CLI API 命令。"
keywords: "nb api 动态命令,NocoBase CLI,OpenAPI,swagger"
---

# nb api 动态命令

除了 [`nb api resource`](./resource/index.md) 之外，`nb api` 下还有一组根据 NocoBase 应用 OpenAPI Schema 动态生成的命令。这些命令在首次运行 [`nb env add`](../env/add.md) 或 [`nb env update`](../env/update.md) 时生成并缓存。

## 常见分组

| 命令分组 | 说明 |
| --- | --- |
| `nb api acl` | 权限管理：角色、资源权限和操作权限 |
| `nb api api-keys` | API Key 管理 |
| `nb api app` | 应用管理 |
| `nb api authenticators` | 认证管理：密码、短信、SSO 等 |
| `nb api data-modeling` | 数据建模：数据源、数据表和字段 |
| `nb api file-manager` | 文件管理：存储服务和附件 |
| `nb api flow-surfaces` | 页面编排：页面、区块、字段和操作 |
| `nb api system-settings` | 系统设置：标题、Logo、语言等 |
| `nb api theme-editor` | 主题管理：颜色、尺寸和主题切换 |
| `nb api workflow` | 工作流：自动化流程管理 |

实际可用分组和命令取决于连接的 NocoBase 应用版本和已启用插件。运行以下命令查看当前应用支持的命令：

```bash
nb api --help
nb api <topic> --help
```

## 请求体参数

带请求体的动态命令支持：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--body` | string | JSON 字符串形式的请求体 |
| `--body-file` | string | JSON 文件路径 |

`--body` 和 `--body-file` 互斥。

## 环境选择

动态 API 命令支持 `--env` 和 `--yes`：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 要请求的 CLI env 名称；省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |

只有在你显式传入 `--env` 时，CLI 才会检查它是否与当前 env 一致。如果显式指定了不同的 env，交互终端会先确认；在非交互终端或 AI agent 场景下，需要由你自己显式追加 `--yes`，或者先执行 `nb env use <name>` 再重试。

## 相关命令

- [`nb env update`](../env/update.md)
- [`nb api resource`](./resource/index.md)
