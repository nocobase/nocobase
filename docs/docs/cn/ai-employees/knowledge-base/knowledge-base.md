# 知识库

## 介绍

知识库是 RAG 检索的基础，知识库分门别类的组织文档并构建索引。AI 员工回答问题的时候，会优先从知识库中搜索答案。

## 知识库管理

进入 AI 员工插件配置页面，点击 `Knowledge base` 标签页，进入知识库管理页。

![20251023095649](https://static-docs.nocobase.com/20251023095649.png)

点击右上角 `Add new` 按钮新增 `Local` 知识库

![20251023095826](https://static-docs.nocobase.com/20251023095826.png)

输入新建数据库必要信息：

- 在 `Name` 输入框输入知识库名称；
- 在 `File storage` 选择文件存储位置；
- 在 `Vector store` 选择向量存储，参考 [向量存储](/ai-employees/knowledge-base/vector-store)；
- 在 `Description` 输入框输入知识库描述；

点击 `Submit` 按钮创建向量存储信息。

![20251023095909](https://static-docs.nocobase.com/20251023095909.png)

## 知识库文档管理

创建知识库后，在知识库列表页面，点击刚刚创建的知识库，进入知识库文档管理页。

![20251023100458](https://static-docs.nocobase.com/20251023100458.png)

![20251023100527](https://static-docs.nocobase.com/20251023100527.png)

点击 `Upload` 按钮上传文档，文档上传后，会自动开始向量化，等待 `Status` 从 `Pending` 状态变为 `Success` 状态。

目前知识库支持的文档类型：txt, pdf, doc, docx, ppt, pptx；pdf只支持纯文本。

![20251023100901](https://static-docs.nocobase.com/20251023100901.png)

## 知识库类型

### Local 知识库

Local 知识库是 NocoBase 本地存储知识库，文档，文档的向量数据都由 NocoBase 本地存储。

![20251023101620](https://static-docs.nocobase.com/20251023101620.png)

### Readonly 知识库

Readonly 知识库是只读知识库，文档和向量数据都在外部维护，只在 NocoBase 创建了向量数据库连接（目前只支持PGVector）

![20251023101743](https://static-docs.nocobase.com/20251023101743.png)

### External 知识库

External 知识库是外部知识库，文档和向量数据都在外部维护。向量数据库检索需要开发者扩展，可以使用现在 NocoBase 不支持的向量数据库

![20251023101949](https://static-docs.nocobase.com/20251023101949.png)
