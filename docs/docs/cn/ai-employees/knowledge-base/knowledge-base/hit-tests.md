---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "命中测试"
description: "在知识库的 Hit tests 页面输入测试文本，查看 Top K、Score 参数下命中的文档分段。"
keywords: "知识库命中测试,Hit tests,Top K,Score,RAG,NocoBase"
---

# 命中测试

## 进入 Hit tests 页面

进入知识库详情页后，点击左侧「Hit tests」。这个页面用于测试一段用户输入能命中哪些文档分段，不会直接调用 AI 员工，也不会生成最终回答。

![20260617005130](https://static-docs.nocobase.com/20260617005130.png)

## 执行一次测试

在底部输入框中输入测试文本，然后点击「Send」。NocoBase 会用当前知识库执行检索，并按相似度从高到低展示命中的分段。

结果卡片里会显示：

- 命中排序
- 文档标题
- 相似度分数
- 分段内容预览
- 来源文件名

点击结果卡片可以查看更完整的分段内容、相似度分数，以及本次命中的关联问题。

![20260617005408](https://static-docs.nocobase.com/20260617005408.png)

如果当前输入没有命中任何分段，页面会显示「No matching documents found」。

![20260617005636](https://static-docs.nocobase.com/20260617005636.png)

## 调整测试参数

点击右上角「Settings」可以调整本次命中测试的参数。

![20260617005519](https://static-docs.nocobase.com/20260617005519.png)

其中：

- 「Top K」：最多返回多少个匹配分段
- 「Score」：最低相似度阈值，低于该值的结果会被过滤

默认参数是 `Top K = 4`、`Score = 0.6`。如果结果太少，可以降低「Score」或提高「Top K」；如果结果太宽泛，可以提高「Score」。

:::tip

这里调整「Top K」和「Score」，主要是为了给 AI 员工配置知识库检索参数时找到合适的取值。命中测试里的设置只影响当前测试，不会自动写入 AI 员工。确认取值后，可以到 AI 员工的 RAG 设置中填写同样的参数，详细用法见 [RAG 检索](../rag)。

:::

## 根据命中结果调整

命中测试适合用来判断知识库是否已经准备好接入 RAG。

常见调整方式：

- 命中不到目标文档：检查文档是否向量化成功，或者降低「Score」观察是否有弱相关结果
- 命中了无关内容：提高「Score」，或禁用、删除干扰分段
- 命中内容过长或过短：回到「Segments」调整分段参数并重新分段
- 用户常见问法命不中：在分段详情里添加「Related questions」

修改分段后，等待文档重新向量化完成，再回到「Hit tests」重新测试。
