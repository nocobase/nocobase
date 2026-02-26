---
pkg: "@nocobase/plugin-ai"
---

# 概述

![clipboard-image-1771905619](https://static-docs.nocobase.com/clipboard-image-1771905619.png)

AI 员工（`AI Employees`）是 NocoBase 深度集成在业务系统里的智能体能力。

它不是“只会聊天”的机器人，而是可直接在业务界面中理解上下文并执行操作的“数字同事”：

- **懂业务上下文**：感知当前页面、区块、数据结构与选中内容。
- **能直接执行动作**：可调用技能完成查询、分析、填写、配置、生成等任务。
- **可角色化协作**：按岗位配置不同员工，并在会话中切换模型协作。

## 5 分钟上手路径

先看 [快速开始](/ai-employees/quick-start)，按下面顺序完成最小可用配置：

1. 配置至少一个 [LLM 服务](/ai-employees/features/llm-service)。
2. 启用至少一个 [AI 员工](/ai-employees/features/enable-ai-employee)。
3. 打开会话并开始 [与 AI 员工协作](/ai-employees/features/collaborate)。
4. 按需开启 [联网搜索](/ai-employees/features/web-search) 与 [快捷任务](/ai-employees/features/task)。

## 功能地图

### A. 基础配置（管理员）

- [配置 LLM 服务](/ai-employees/features/llm-service)：接入 Provider，配置并管理可用模型。
- [启用 AI 员工](/ai-employees/features/enable-ai-employee)：启停内置员工，控制可用范围。
- [新建 AI 员工](/ai-employees/features/new-ai-employees)：定义角色、人设、欢迎语与能力边界。
- [使用技能](/ai-employees/features/tool)：配置技能权限（`Ask` / `Allow`），控制执行风险。

### B. 日常协作（业务用户）

- [与 AI 员工协作](/ai-employees/features/collaborate)：会话内切换员工与模型，持续协作。
- [添加上下文 - 区块](/ai-employees/features/pick-block)：把页面区块作为上下文发送给 AI。
- [快捷任务](/ai-employees/features/task)：在页面/区块预设常用任务，一键执行。
- [联网搜索](/ai-employees/features/web-search)：在需要最新信息时启用检索增强回答。

### C. 进阶能力（扩展）

- [内置 AI 员工](/ai-employees/features/built-in-employee)：了解预置员工定位与适用场景。
- [权限控制](/ai-employees/permission)：按组织权限模型控制员工、技能与数据访问。
- [AI 知识库](/ai-employees/knowledge-base/index)：引入企业知识，提升回答稳定性与可追溯性。
- [工作流 LLM 节点](/ai-employees/workflow/nodes/llm/chat)：将 AI 能力编排进自动化流程。

## 核心概念（建议先统一）

以下术语与术语表保持一致，建议在团队内统一使用：

- **AI 员工（AI Employee）**：由人设（Role setting）和技能（Tool / Skill）组成的可执行智能体。
- **LLM 服务（LLM Service）**：模型接入与能力配置单元，用于管理 Provider 与模型清单。
- **提供商（Provider）**：LLM 服务背后的模型供应方。
- **启用模型（Enabled Models）**：当前 LLM 服务允许在会话中选择的模型集合。
- **员工切换器（AI Employee Switcher）**：会话内切换当前协作员工。
- **模型切换器（Model Switcher）**：会话内切换模型，并按员工维度记忆偏好。
- **技能（Tool / Skill）**：AI 可调用的执行能力单元。
- **技能权限（Permission: Ask / Allow）**：技能调用前是否需要人工确认。
- **上下文（Context）**：页面、区块、数据结构等业务环境信息。
- **会话（Chat）**：用户与 AI 员工的一次连续交互过程。
- **联网搜索（Web Search）**：基于外部检索补充实时信息的能力。
- **知识库（Knowledge Base / RAG）**：通过检索增强生成引入企业知识。
- **向量存储（Vector Store）**：为知识库提供语义检索能力的向量化存储。

## 安装说明

AI 员工是 NocoBase 内置插件（`@nocobase/plugin-ai`），开箱即用，无需单独安装。
