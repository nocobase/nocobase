# RAG 检索

## 介绍

配置好知识库后，就可以在 AI 员工设置中启用 RAG 功能了。

启用了 RAG 后，用户与 AI 员工对话时，AI 员工会使用 RAG 检索，用用户消息从知识库获取文档并基于检索到的文档回复。

## 启用 RAG

进入 AI 员工插件配置页面，点击 `AI employees` 标签页，进入 AI 员工管理页。

![20251023010811](https://static-docs.nocobase.com/20251023010811.png)

选择要启用 RAG 的 AI 员工，点击 `Edit` 按钮，进入 AI 员工编辑页面。

在`Knowledge base` 标签页中，打开`Enable`开关。

- 在 `Knowledge Base Prompt` 输入引用知识库的提示语，`{knowledgeBaseData}` 是固定的占位符，不要修改；
- 在 `Knowledge Base` 选择配置好的知识库，参考：[知识库](/ai-employees/knowledge-base/knowledge-base)；
- 在 `Top K` 输入框中输入要检索的文档数量，默认为 3 个；
- 在 `Score` 输入框检索时文档相关系阈值；

点击 `Submit` 按钮保存 AI 员工设置。

![20251023010844](https://static-docs.nocobase.com/20251023010844.png)
