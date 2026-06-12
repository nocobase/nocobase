---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "设置"
description: "在知识库 Settings 页面修改基本信息、向量存储和默认分段参数，并理解知识库级设置与文档级分段设置的关系。"
keywords: "知识库设置,分段参数,Chunk size,Chunk overlap,向量存储,NocoBase"
---

# 设置

## 进入 Settings 页面

进入知识库详情页后，点击左侧「Settings」。这里用于修改当前知识库的基本信息、文件存储、向量存储和默认分段参数。

![](https://static-docs.nocobase.com/ai-employees/knowledge-base/knowledge-base/2026-06-12/kb-settings.png)

## 基本信息

Local 知识库的设置项包括：

| 设置项 | 说明 |
| --- | --- |
| 「Key」 | 知识库唯一标识，创建后不可修改 |
| 「Name」 | 知识库名称 |
| 「File storage」 | 文档和分段文件保存到哪个文件存储，创建后不可修改 |
| 「Vector store」 | 当前知识库使用的向量存储 |
| 「Description」 | 知识库说明 |
| 「Enabled」 | 是否启用当前知识库 |

如果修改「Vector store」，NocoBase 会提示确认。因为向量存储发生变化后，已有文档需要重新向量化才能写入新的向量存储。你可以选择「Save and vectorize」保存并立即重新向量化，也可以选择「Save only」只保存设置，之后再到「Documents」页面手动执行「Vectorization」。

## 默认分段参数

Settings 页面新增了三个分段参数：

| 设置项 | 默认值 | 说明 |
| --- | --- | --- |
| 「Split document」 | 开启 | 上传文档后是否自动拆成多个分段 |
| 「Chunk size」 | `6000` | 每个分段的最大字符数 |
| 「Chunk overlap」 | `1200` | 相邻分段之间重叠的字符数 |

「Chunk overlap」不能大于等于「Chunk size」。如果输入值不合法，后端会按规则归一化，保证重叠字符数小于单个分段长度。

## 和文档分段设置的关系

这里的设置是知识库级默认值。它主要影响之后上传或重新生成的文档分段。

文档进入知识库后，会保存一份自己的分段参数。进入「Documents」页面，点击某篇文档的「Segments」，再打开「Segment settings」，可以为这篇文档单独设置「Split document」「Chunk size」「Chunk overlap」并执行「Resegment」。

两处设置的关系可以这样理解：

- 「Settings」里的分段参数：给知识库设定默认策略，适合统一控制新文档
- 「Segments」弹窗里的分段参数：只作用于当前文档，适合处理某一篇文档过长、过短或结构特殊的情况
- 已经生成的分段不会因为修改知识库级默认值而自动重建
- 如果要让某篇已有文档按新参数生效，需要进入该文档的「Segment settings」执行「Resegment」

:::warning 注意

「Resegment」会丢弃该文档中已经手工编辑过的分段内容和关联问题。修改知识库级默认值前，不需要担心它立即覆盖已有分段；真正会重建分段的是文档级的「Resegment」操作。

:::

## 什么时候调整参数

默认参数可以覆盖大多数纯文本、Markdown、Word、PDF 文档。只有遇到下面这些情况时，才需要调整：

- 分段太长，命中结果包含过多无关内容：适当减小「Chunk size」
- 分段太短，上下文不完整：适当增大「Chunk size」
- 相邻分段之间断句明显：适当增大「Chunk overlap」
- 只希望整篇文档作为一个检索单元：关闭「Split document」

保存设置后，后续上传文档会按新的默认参数生成分段。
