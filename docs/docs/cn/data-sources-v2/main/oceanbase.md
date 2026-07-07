---
pkg: "@nocobase/plugin-data-source-oceanbase"
title: "主数据源 - OceanBase"
description: "了解 OceanBase 作为 NocoBase 主数据库时的支持版本、插件安装方式和使用说明。"
keywords: "主数据源,OceanBase,主数据库,NocoBase"
---

# OceanBase

## 介绍

OceanBase 可以作为 NocoBase 的主数据库使用，用于存储 NocoBase 系统表数据和主数据源中的业务数据。主数据库在部署 NocoBase 时配置，应用运行后不可删除。

| 配置项 | 说明 |
| --- | --- |
| 支持版本 | >= 4.3。 |
| 商业版本 | 企业版支持。 |
| 数据库类型 | MySQL 兼容模式。 |

:::warning 注意

OceanBase 作为主数据库时只支持 MySQL 兼容模式。

:::

## 插件安装

OceanBase 由 `@nocobase/plugin-data-source-oceanbase` 提供，需要商业授权。

## 使用说明

1. 部署 NocoBase 时，在数据库连接配置中选择或填写 OceanBase 对应的连接参数。
2. 启动 NocoBase 后，在「数据源管理」中进入「Main」数据源，可以管理主数据库中的数据表和字段。
3. 如需接入数据库中已经存在的表，可以在主数据库管理页使用「从数据库同步」。

更多通用配置见[主数据源介绍](/data-sources-v2/main/)。