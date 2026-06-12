---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "分段管理"
description: "在 Documents 页面打开 Segments 弹窗，查看、编辑、禁用、删除分段，并按文档重新生成分段。"
keywords: "知识库分段,Segments,Chunk size,Chunk overlap,关联问题,NocoBase"
---

# 分段管理

## 打开分段管理

进入知识库的「Documents」页面，在某篇文档右侧点击「Segments」，会打开「Segment management」弹窗。这里展示当前文档生成的所有分段。

![](https://static-docs.nocobase.com/ai-employees/knowledge-base/knowledge-base/2026-06-12/segments-list.png)

## 查看分段列表

分段列表包含这些信息：

| 字段 | 含义 |
| --- | --- |
| 「No.」 | 分段序号，从 1 开始显示 |
| 「Preview」 | 分段内容预览 |
| 「Characters」 | 当前分段字符数 |
| 「Related questions」 | 当前分段配置的关联问题数量 |
| 「Enabled」 | 是否参与向量化和检索 |
| 「Updated at」 | 分段最近更新时间 |

打开「Enabled only」后，列表只显示启用中的分段。这个开关只影响列表显示，不会修改分段数据。

## 编辑分段

点击某个分段右侧的「Edit」可以打开分段详情。

![](https://static-docs.nocobase.com/ai-employees/knowledge-base/knowledge-base/2026-06-12/segment-edit.png)

在详情里可以修改：

- 「Content」：分段正文
- 「Related questions」：额外的可检索问法

关联问题会和分段一起进入向量检索。比如正文是一个制度条款，你可以补充几种员工可能会问的自然语言问题，让命中更稳定。

保存后，NocoBase 会更新分段文件，并触发当前文档重新向量化。回到「Documents」列表时，状态可能会短暂显示为「Pending」。

## 启用、禁用和删除分段

「Enabled」开关用于控制单个分段是否参与检索：

- 启用：分段会被写入向量存储，可以被 RAG 和命中测试检索到
- 禁用：分段保留在列表中，但不会参与后续向量化和检索

点击「Delete」会删除当前分段及其向量数据。删除后文档的分段数、字符数会重新统计。

:::warning 注意

禁用或删除分段都会触发重新向量化。处理完成前，文档状态可能显示为「Pending」。

:::

## 重新分段

点击右上角「Segment settings」，可以为当前文档重新设置分段参数。

![](https://static-docs.nocobase.com/ai-employees/knowledge-base/knowledge-base/2026-06-12/segments-settings-popover.png)

其中：

- 「Split document」：是否把文档拆成多个分段
- 「Chunk size」：每个分段的最大字符数，默认 `6000`
- 「Chunk overlap」：相邻分段之间重叠的字符数，默认 `1200`

点击「Resegment」会按当前参数重新生成分段。

:::warning 注意

重新分段会丢弃已经手工编辑过的分段内容和关联问题。只有确认需要按新参数重建分段时，再执行这个操作。

:::
