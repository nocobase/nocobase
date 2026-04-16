---
title: "插件管理"
description: "插件管理 skill 用于查看、安装、启用和停用 NocoBase 插件。"
keywords: "AI 搭建,插件管理,插件安装,插件启用,pm list"
---

# 插件管理

## 简介

插件管理 skill 用于查看、安装、启用和停用 NocoBase 插件——它会自动识别本地或远程环境，选择合适的执行后端，并通过读回校验确保操作成功。

## 安装

```bash
npx skills add nocobase/skills --skill nocobase-plugin-manage -y
```

## 能力范围

可以做：

- 查看插件目录和启用状态（`inspect`）
- 安装插件包，支持自定义 registry 和版本（`install`）
- 启用插件（`enable`）
- 停用插件（`disable`）
- 自动识别本地 Docker 环境或远程 API 环境
- 每次写操作后自动读回校验，确认状态一致

不能做：

- 不能开发或修改插件代码（用插件开发 skill）
- 不能做插件移除（`pm remove`），需要手动操作
- 不能同时操作多个不同环境

## 提示词示例

### 场景 A：查看插件状态

```
查看当前安装了哪些插件
```

会列出所有插件及其启用状态、版本信息。

### 场景 B：启用插件

```
启用 MCP 插件和 API Keys 插件
```

skill 会按顺序启用，每次启用后读回校验确认 `enabled=true`。

### 场景 C：安装第三方插件

```
安装 @nocobase/plugin-api-doc 插件
```

安装完成后会校验插件是否在列表中可见。注意安装不等于启用，需要单独执行启用操作。

## 常见问题

**插件启用后没生效怎么办？**

部分插件启用后需要重启应用才能生效。skill 会在结果中提示是否需要重启。

**本地 Docker 环境的插件操作走什么路径？**

默认走 `docker compose exec` 方式调用 `yarn nocobase pm` 命令。如果 Docker 不可用，会给出手动操作的补救建议。
