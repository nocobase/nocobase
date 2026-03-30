---
title: "数据表概述"
description: "Collection 数据表概念：定义数据模型、字段、索引、关联，通过数据源管理创建或同步已有表。"
keywords: "数据表,Collection,数据模型,字段定义,关联,NocoBase"
---

# 数据表概述

NocoBase 提供了一种特有的 DSL 来描述数据的结构，称之为 Collection，将各种来源的数据结构统一起来，为后续数据管理、分析和应用提供了可靠的基础。

![20240512161522](https://static-docs.nocobase.com/20240512161522.png)

为了便捷的使用各种数据模型，支持创建各种数据表：

- [普通表](/data-sources/data-source-main/general-collection)：内置了常用的系统字段；
- [继承表](/data-sources/data-source-main/inheritance-collection)：可以创建一个父表，然后从该父表派生出子表，子表会继承父表的结构，同时还可以定义自己的列。
- [树表](/data-sources/collection-tree)：树结构表，目前只支持邻接表设计；
- [日历表](/data-sources/calendar/calendar-collection)：用于创建日历相关的事件表；
- [文件表](/data-sources/file-manager/file-collection)：用于文件存储的管理；
- ：用于工作流的动态表达式场景；
- [SQL 表](/data-sources/collection-sql)：并不是实际的数据库表，而是快速的将 SQL 查询，结构化的展示出来；
- [视图表](/data-sources/collection-view)：连接已有的数据库视图；
- [外部表](/data-sources/collection-fdw)：允许数据库系统直接访问和查询外部数据源中的数据，基于 FDW 技术；
