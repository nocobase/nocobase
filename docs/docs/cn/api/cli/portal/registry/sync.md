---
title: "nb portal registry sync"
description: "nb portal registry sync 命令参考：在 AI Portal 中安装、比较或更新插件提供的 Registry 项。"
keywords: "nb portal registry sync,NocoBase CLI,Portal Registry,shadcn,AI Portal"
---

# nb portal registry sync

把 NocoBase Portal Registry 项安装到已有的 AI Portal 工作区。命令会从所选 NocoBase 服务读取 Registry 索引，因此启用新插件后，其 Registry 项可以直接被发现，不需要在 Portal 模板中硬编码。

## 用法

```bash
nb portal registry sync <portal> [items...] [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `<portal>` | string | 必填，AI Portal 名称或 slug |
| `[items...]` | string[] | 可选，Registry 项名称；省略时安装所有已启用插件提供的项。支持 `ai` 和 `@nocobase/ai` 两种写法 |
| `--env`, `-e` | string | CLI env 名称；省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式指定的 `--env` 与当前 env 不一致时跳过确认 |
| `--overwrite` | boolean | 覆盖已安装的 Registry 文件，但保留现有 `src/components/ui` 文件 |
| `--overwrite-ui` | boolean | 允许 `--overwrite` 同时覆盖现有 `src/components/ui` 文件；必须与 `--overwrite` 一起使用 |
| `--diff` | boolean | 只显示 Registry 文件差异，不修改 Portal |
| `--build` | boolean | 安装后执行 `pnpm build` 和 `pnpm build:html` |

## 示例

安装所有尚未安装的可用项：

```bash
nb portal registry sync customer
```

安装指定项：

```bash
nb portal registry sync customer ai acl auth-sms
```

只比较已安装项与服务端版本的差异：

```bash
nb portal registry sync customer ai --diff
```

覆盖指定 Registry 项，同时保留基础 UI 组件：

```bash
nb portal registry sync customer ai --overwrite
```

同时覆盖 Registry 文件和基础 UI 组件：

```bash
nb portal registry sync customer --overwrite --overwrite-ui
```

安装后构建 Portal：

```bash
nb portal registry sync customer --build
```

在非交互流程中使用其他 env：

```bash
nb portal registry sync customer --env dev --yes
```

## 工作方式

命令首先从所选 NocoBase 服务请求 Registry 索引，服务端只返回已启用插件提供的项。随后，命令会在 Portal 的 `components.json` 中配置 `@nocobase` Registry，并通过 Portal 本地的 shadcn CLI 安装相应内容。

默认情况下，如果某个 Registry 项声明的目标文件已经存在，该项会被跳过。安装缺失项及其依赖时，现有的 `src/extensions` 和 `src/components/ui` 文件会受到保护。

只有在需要主动刷新已安装文件时才使用 `--overwrite`。即使使用该参数，基础 UI 组件仍会被保护；只有同时传入 `--overwrite-ui` 才会覆盖它们。使用覆盖参数前，应先确认并保留项目中的自定义修改。

`--diff` 是只读操作，不能与 `--overwrite`、`--overwrite-ui` 或 `--build` 组合使用。

如果 Portal 中不存在 `node_modules`，命令会先执行 `pnpm install --frozen-lockfile`，再调用 shadcn。

## 相关命令

- [`nb portal registry`](./index.md)
- [`nb portal create`](../create.md)
- [`nb portal dev`](../dev.md)
- [`nb portal deploy`](../deploy.md)
