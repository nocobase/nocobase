---
pkg: "@nocobase/plugin-data-source-manager"
title: "主数据源 - PostgreSQL"
description: "了解 PostgreSQL 作为 NocoBase 主数据库时的支持版本、插件安装方式和使用说明。"
keywords: "主数据源,PostgreSQL,主数据库,NocoBase"
---

# PostgreSQL

## 介绍

PostgreSQL 可以作为 NocoBase 的主数据库使用，用于存储 NocoBase 系统表数据和主数据源中的业务数据。主数据库在部署 NocoBase 时配置，应用运行后不可删除。

| 配置项 | 说明 |
| --- | --- |
| 支持版本 | >= 10。 |
| 商业版本 | 社区版、标准版、专业版、企业版均支持。 |
| 数据库类型 | PostgreSQL。 |

PostgreSQL 支持继承表能力，适合需要数据模型继承的场景。

## 插件安装

PostgreSQL 为内置能力，无需单独安装插件。

## 使用说明

1. 部署 NocoBase 时，在数据库连接配置中选择或填写 PostgreSQL 对应的连接参数。
2. 启动 NocoBase 后，在「数据源管理」中进入「Main」数据源，可以管理主数据库中的数据表和字段。
3. 如需接入数据库中已经存在的表，可以在主数据库管理页使用「从数据库同步」。
4. 配置数据表字段时，可以参考[数据表字段](../field/index.md)目录选择字段类型和字段组件。

更多通用配置见[主数据源介绍](./index.md)。
