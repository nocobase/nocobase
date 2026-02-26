# 快速开始

让我们用 5 分钟完成 AI 员工的最小可用配置。

## 安装插件

AI 员工是 NocoBase 内置插件（`@nocobase/plugin-ai`），无需单独安装。

## 配置模型

你可以通过以下任一入口配置 LLM 服务：

1. 后台入口：`系统设置 -> AI 员工 -> LLM service`。
2. 前台快捷入口：在 AI 对话面板中使用 `Model Switcher` 选择模型时，点击“添加 LLM 服务”的快捷入口直接跳转。

![quick-start-model-switcher-add-llm-service.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/quick-start-model-switcher-add-llm-service.png)

一般你需要确认：
1. 选择 Provider。
2. 填写 API Key。
3. 配置 `Enabled Models`，默认使用 Recommend 即可。

## 启用内置员工

内置的 AI 员工默认已全部启用，通常无需手动逐个开启。

如果你需要调整可用范围（启用/禁用某个员工），可在 `系统设置 -> AI 员工` 列表页修改 `Enabled` 开关。

![ai-employee-list-enable-switch.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-list-enable-switch.png)

## 开始协作

在应用页面，右下角快捷入口 鼠标悬浮，选择 AI 员工
![ai-employees-entry-bottom-right.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employees-entry-bottom-right.png)


点击打开 AI 对话框：

![chat-footer-employee-switcher-and-model-switcher.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/chat-footer-employee-switcher-and-model-switcher.png)

你还可以：  
* 添加区块
* 添加附件
* 开启网络搜索
* 切换 AI 员工
* 选择模型

它们也能自动获取页面结构作为上下文，比如表单区块上的 Dex 自动获取表单的字段结构，并调用合适的技能对页面进行操作。

## 快捷任务 

你可以为每个 AI 员工在当前位置上预设常用任务，这样就一键点击即可开始工作，又快又方便。

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.19.33-2025-11-02-12-19-49.mp4" type="video/mp4"></video>



## 内置员工一览

NocoBase 预置了多个针对场景的 AI 员工。

你只需要：

1. 配好 LLM 服务。
2. 按需调整员工启用状态（默认已启用）。
3. 在会话中选择模型并开始协作。

| 员工名称 | 角色定位 | 核心能力 |
| :--- | :--- | :--- |
| **Cole** | NocoBase 助手 | 产品使用问答、文档检索 |
| **Ellis** | 电子邮件专家 | 邮件撰写、摘要生成、回复建议 |
| **Dex** | 数据整理专家 | 字段翻译、格式化、信息提取 |
| **Viz** | 洞察分析师 | 数据洞察、趋势分析、关键指标解读 |
| **Lexi** | 翻译助理 | 多语言翻译、沟通辅助 |
| **Vera** | 研究分析师 | 联网搜索、信息汇总、深度研究 |
| **Dara** | 数据可视化专家 | 图表配置、可视化报表生成 |
| **Orin** | 数据建模专家 | 辅助设计数据表结构、字段建议 |
| **Nathan** | 前端工程师 | 辅助编写前端代码片段、样式调整 |

**备注**

部分内置 AI 员工不会出现在右下角列表中，它们有专属工作场景：

- Orin：数据建模页面。
- Dara：图表配置区块。
- Nathan：JS Block 等代码编辑器。
