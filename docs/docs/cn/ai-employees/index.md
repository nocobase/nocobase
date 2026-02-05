---
pkg: "@nocobase/plugin-ai"
---

# 概述

![clipboard-image-1766653060](https://static-docs.nocobase.com/clipboard-image-1766653060.png)

AI 员工 (`AI Employees`) 是 NocoBase 提供的一套深度集成于业务系统的智能体。

不同于普通的聊天机器人 (Chatbot)，AI 员工是企业的“拟人化同事”。它们不仅能进行自然语言对话，更拥有以下核心特质：

*   **业务感知 (Context Awareness)**：能够理解当前所在的页面、当前选中的数据行、以及系统的表结构定义。
*   **行动能力 (Actionable)**：能够执行实际的业务操作，如查询数据库、分析邮件、填写表单、配置图表、编写 JS 模块、触发工作流等。
*   **角色化 (Persona)**：每个 AI 员工都有特定的职业定位（如“数据分析师”、“翻译助理”、“前端工程师”等），并配备相应的技能包。


## 核心概念

在使用 AI 员工之前，了解以下核心概念有助于您更好地配置和管理它们：

*   **AI 员工 (AI Employee)**：一个独立的智能同事。它由**人设 (Role Setting)**、**模型 (LLM)** 和**技能 (Tools)** 等部分组成。
*   **大语言模型 (LLM)**：AI 员工的“大脑”。支持接入 OpenAI (GPT-4)、Anthropic (Claude 3) 等主流模型，决定了 AI 的理解和推理能力。
*   **技能 (Tool)**：提供给 AI 可以执行的功能单元，相当于 AI 干活的手脚。例如 `webSearch` (网络搜索), `queryDatabase` (查库)。
*   **上下文 (Context)**：AI 员工感知环境的能力。包括当前所在的页面结构、选中的数据行、表单字段定义等，无需用户手动复制粘贴。
*   **知识库 (Knowledge Base / RAG)**：AI 员工的“长期记忆”或“参考书”。通过 RAG (检索增强生成) 技术，您可以上传 PDF、Word 等企业内部文档，让 AI 在回答问题时优先参考这些资料。
*   **向量存储 (Vector Store)**：用于支撑知识库的技术设施。它将文档切片并转化为向量 (Vector)，以便进行语义搜索。
*   **会话 (Chat)**：用户与 AI 员工的一次完整交互过程。系统会保存会话历史，以便 AI 理解上下文语境。


## 入口

你也可以从右下角的快捷入口员工列表中唤醒它们。

![20251102121159-2025-11-02-12-12-01](https://static-docs.nocobase.com/20251102121159-2025-11-02-12-12-01.png)


也可以在区块旁边随手唤醒它，例如表格、表单、图表、代码块 等等。

![20251102121036-2025-11-02-12-10-38](https://static-docs.nocobase.com/20251102121036-2025-11-02-12-10-38.png)


它们会自动获取数据作为上下文，比如表格区块上的 Viz 自动获取表格里的数据，并调用合适的技能对数据进行处理，这意味着你不需要复制这些数据发给聊天机器人。 

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.13.35-2025-11-02-12-13-46.mp4" type="video/mp4"></video>

它们也能自动获取页面结构作为上下文，比如表单区块上的 Dex 自动获取表单的字段结构，并调用合适的技能对页面进行操作，这意味着你不需要从聊天机器人把数据复制回来。

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.16.07-2025-11-02-12-16-21.mp4" type="video/mp4"></video>

你也可以直接选取页面中的区块发给它，它们将会从中获取到对应的数据和页面结构。 

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.17.25-2025-11-02-12-17-44.mp4" type="video/mp4"></video>


## 快捷任务 

你可以为每个 AI 员工在当前位置上预设常用任务，这样就一键点击即可开始工作，又快又方便。

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.19.33-2025-11-02-12-19-49.mp4" type="video/mp4"></video>


## 安装
AI 员工是 NocoBase 的内置插件，开箱即用，无需单独安装。