---
title: "外部数据源 - MariaDB"
description: "了解如何把 MariaDB 作为 NocoBase 外部数据库接入，以及支持版本、插件安装和使用说明。"
keywords: "外部数据源,MariaDB,外部数据库,NocoBase"
---

# MariaDB

## 介绍

MariaDB 可以作为外部数据库接入 NocoBase。NocoBase 会读取外部数据库中的数据表、字段和视图，并把它们作为外部数据源中的数据表使用。

| 配置项 | 说明 |
| --- | --- |
| 支持版本 | >= 10.3。 |
| 商业版本 | 标准版、专业版、企业版支持。 |
| 写入能力 | 支持读取和写入，具体能力取决于账号权限、表结构和主键配置。 |

MariaDB 可以通过 Database、Table prefix 和 Collections 控制接入范围。

## 插件安装

外部 MariaDB 数据源由 $plugin 插件提供。该插件需要商业授权，安装并启用后，可以在「数据源管理」的「Add new」菜单中选择 MariaDB。

## 使用说明

1. 在「数据源管理」中点击「Add new」，选择 MariaDB。
2. 填写数据库连接信息，并通过「Load Collections」读取可用的数据表和视图。
3. 根据业务需要选择接入全部数据表，或只勾选部分数据表。
4. 接入后进入数据表配置页，检查主键、唯一标识、字段映射和关系字段配置。

更多通用配置见[外部数据源介绍](/data-sources-v2/external/)。