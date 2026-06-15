---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "文档管理"
description: "在知识库的 Documents 页面上传文档、查看状态、执行向量化、下载或删除文档。"
keywords: "知识库文档,文档上传,向量化,ZIP 导入,NocoBase"
---

# 文档管理

## 进入 Documents 页面

进入知识库详情页后，点击左侧「Documents」。这里用于管理当前知识库里的文档，也是进入分段管理的入口。

![](https://static-docs.nocobase.com/ai-employees/knowledge-base/knowledge-base/2026-06-12/documents.png)

## 上传文档

点击右上角「Upload」上传文件。上传完成后，文档会自动进入分段生成和向量化流程。列表中的「Status」会先显示「Pending」，处理完成后变为「Success」。如果处理失败，会显示「Error」，文件名旁边也会显示错误提示图标。

目前支持的文档类型包括：`txt`、`md`、`json`、`csv`、`xls`、`xlsx`、`pdf`、`doc`、`docx`、`ppt`、`pptx`。

:::tip PDF 文档

PDF 只支持纯文本内容。如果 PDF 主要是扫描图片，需要先做 OCR，再把可提取文本的文件上传到知识库。

:::

## 批量导入

如果需要一次导入多份文档，可以把文件打包成 ZIP 后上传。NocoBase 会在后台解压 ZIP，并把其中的文档导入到当前知识库。

:::tip 上传大小限制

ZIP 导入也会受到文件存储上传大小的限制。如果上传时提示文件过大，需要到知识库所使用的「File storage」中调整限制，相关配置见 [文件存储引擎](../../../file-manager/storage/)。

:::

## 查看处理结果

文档列表里有几个常用字段：

| 字段 | 含义 |
| --- | --- |
| 「Filename」 | 上传后的文件名 |
| 「Status」 | 当前向量化状态，常见值为「Pending」「Success」「Error」 |
| 「Characters」 | 当前启用分段的字符总数 |
| 「Segments」 | 当前文档生成的分段数量 |
| 「Created at」「Updated at」 | 文档创建和最近更新时间 |

如果文档长时间停留在「Pending」，可以先点击「Refresh」刷新列表；如果仍未完成，再检查后台任务、向量存储和 LLM 服务是否可用。

## 执行向量化

在列表中勾选文档后，点击上方「Vectorization」，会重新向量化已选中的文档。未勾选任何文档时，点击「Vectorization」会处理当前知识库中的全部文档。

每行里的「Vectorization」只处理当前文档。通常在这些场景会用到：

- 修改了向量存储或向量数据库配置
- 文档状态为「Error」，修复配置后需要重试
- 手动编辑、禁用或删除分段后，需要等待新的向量数据生效

:::tip

分段管理中的编辑、禁用、删除操作会自动触发重新向量化任务。列表状态短暂变为「Pending」是正常现象。

:::

## 下载和删除

每行右侧有三个常用操作：

- 「Segments」：打开当前文档的分段管理弹窗
- 「Download」：下载原始文档
- 「Delete」：删除文档，同时清理该文档相关的分段和向量数据

列表上方的「Delete」用于批量删除已勾选文档。删除不可恢复，操作前需要确认文档不再被当前知识库使用。
