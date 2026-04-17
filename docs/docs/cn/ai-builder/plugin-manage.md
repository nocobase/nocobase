---
title: "插件管理"
description: "插件管理 Skill 用于查看、安装、启用和停用 NocoBase 插件。"
keywords: "AI 搭建,插件管理,插件安装,插件启用,pm list"
---

# 插件管理

## 简介

插件管理 Skill 用于查看、安装、启用和停用 NocoBase 插件——它会自动识别本地或远程环境，选择合适的执行后端，并通过读回校验确保操作成功。

## 安装

```bash
npx skills add nocobase/skills --skill nocobase-plugin-manage -y
```

## 能力范围

- 查看插件目录和启用状态（`inspect`）
- 安装插件包，支持自定义 registry 和版本（`install`）
- 启用插件（`enable`）
- 停用插件（`disable`）
- 自动识别本地 Docker 环境或远程 API 环境
- 每次写操作后自动读回校验，确认状态一致

## 提示词示例

### 场景 A：查看插件状态

```
查看当前安装了哪些插件
```

会列出所有插件及其启用状态、版本信息。

![查看插件状态](https://static-docs.nocobase.com/20260417150510.png)

### 场景 B：启用插件

```
启用 plugin-localization 插件
```

Skill 会按顺序启用，每次启用后读回校验确认 `enabled=true`。

![启用插件](https://static-docs.nocobase.com/20260417153023.png)

### 场景 C：安装第三方插件

```
帮我安装 @nocobase/plugin-sample-hello 插件
```

![安装第三方插件](https://static-docs.nocobase.com/20260417155520.png)

## 常见问题

**插件启用后没生效怎么办？**

部分插件启用后需要重启应用才能生效。Skill 会在结果中提示是否需要重启。

## 相关链接

- [AI 搭建概述](./index.md) — 所有 AI 搭建 Skill 的总览和安装方式
- [NocoBase CLI](../get-started/nocobase-cli.md) — 安装和管理 NocoBase 的命令行工具
