# 向量存储

## 介绍

在知识库中，保存文档时对文档进行向量化，检索文档时对检索词向量化，都需要使用 `Embedding model` 对原始文本进行向量化处理。

在 AI 知识库插件中，向量存储就是 `Embedding model` 和向量数据库的绑定。

## 向量存储管理

进入 AI 员工插件配置页面，点击 `Vector store` 标签页，选择 `Vector store` 进入向量存储管理页。

![20251023003023](https://static-docs.nocobase.com/20251023003023.png)

点击右上角 `Add new` 按钮新增向量存储：

- 在 `Name` 输入框输入向量存储名称；
- 在 `Vector store` 选择已经配置好的向量数据库，参考：[向量数据库](/ai-employees/knowledge-base/vector-database)；
- 在 `LLM service` 选择已经配置好的 LLM 服务，参考：[LLM 服务管理](/ai-employees/features/llm-service)；
- 在 `Embedding model` 输入框输入要使用的 `Embedding` 模型名称；
  
点击 `Submit` 按钮保存向量存储信息。

![20251023003121](https://static-docs.nocobase.com/20251023003121.png)
