---
title: "外部数据源 - ClickHouse"
description: "了解如何把 ClickHouse 作为 NocoBase 外部数据库接入，以及支持版本、插件安装和使用说明。"
keywords: "外部数据源,ClickHouse,外部数据库,NocoBase"
---

# ClickHouse

## 介绍

ClickHouse 可以作为外部数据库接入 NocoBase。NocoBase 会读取外部数据库中的数据表、字段和视图，并把它们作为外部数据源中的数据表使用。

| 配置项 | 说明 |
| --- | --- |
| 支持版本 | 以对应插件说明为准。 |
| 商业版本 | 企业版支持。 |
| 写入能力 | 通常用于只读查询和报表展示，不建议作为业务写入数据源。 |

:::warning 注意

ClickHouse 只支持 MySQL 兼容模式。由于 ClickHouse 更偏向分析查询场景，在 NocoBase 中通常用于查看、筛选、统计和报表展示。

:::

## 插件安装

外部 ClickHouse 数据源由 $plugin 插件提供。该插件需要商业授权，安装并启用后，可以在「数据源管理」的「Add new」菜单中选择 ClickHouse。

## 使用说明

1. 在「数据源管理」中点击「Add new」，选择 ClickHouse。
2. 填写数据库连接信息，并通过「Load Collections」读取可用的数据表和视图。
3. 根据业务需要选择接入全部数据表，或只勾选部分数据表。
4. 接入后进入数据表配置页，检查主键、唯一标识、字段映射和关系字段配置。

更多通用配置见[外部数据源介绍](/data-sources-v2/external/)。