# 快速开始

让我们从零开始，花 5 分钟快速了解和使用 NocoBase AI 员工。


![clipboard-image-1766653060](https://static-docs.nocobase.com/clipboard-image-1766653060.png)


## 1. 安装插件

AI 员工是 NocoBase 的内置插件 (`@nocobase/plugin-ai`)，开箱即用，无需单独安装。


## 2. 配置模型服务 (LLM Service)

在使用 AI 员工之前，需要先接入在线 LLM 服务。

NocoBase 目前支持主流的在线 LLM 服务，如 OpenAI, Gemini, Claude, DeepSeek, Qwen（阿里千问）等。推荐使用模型（已验证）：**gemini-3**、**deepseek-chat**、**qwen3-max**。

除了在线 LLM 服务，NocoBase 也支持 Ollama 本地模型的接入。

1.  进入 **系统设置** -> **AI 员工** -> **模型服务**。
2.  点击 **新建**，选择您的模型提供商。
3.  输入 API Key 和 Base URL (可选)。
4.  点击 **测试连接** 确保配置正确。

![20251021213122](https://static-docs.nocobase.com/20251021213122.png)

![20251021214903](https://static-docs.nocobase.com/20251021214903.png)


## 3. 启用内置员工
NocoBase 预置了多个开箱即用的 AI 员工，覆盖常见场景。
1.  进入 **系统设置** -> **AI 员工** 列表页。
2.  找到你需要的 **AI 员工**，例如 **Viz (洞察分析师)**。
3.  点击 **编辑**，在 **LLM 设置** 中选择刚才配置的模型服务商 (LLM Service) 和 模型 (Model)，推荐使用：**gemini-3**、**deepseek-chat**、**qwen3-max**
4.  在员工资料 (Profile) 中点击 **启用 (Enabled)** 开关。
5.  点击底部 **提交** 保存即可生效。

![clipboard-image-1766660703](https://static-docs.nocobase.com/clipboard-image-1766660703.png)

![clipboard-image-1766660863](https://static-docs.nocobase.com/clipboard-image-1766660863.png)

## 4. 开始协作
1.  回到应用界面，点击右下角的 **AI 悬浮球**，选择你要的员工，即可开启协作。
2.  尝试发送指令： ```"请按线索（Leads）来源分析线索的数量与质量（高意向比），并提供 2–3 条渠道优化建议。"```

你还可以 **添加上下文**、**添加附件** 等让 AI 更好地理解当前环境和需求。

![clipboard-image-1766661858](https://static-docs.nocobase.com/clipboard-image-1766661858.png)

![clipboard-image-1766666328](https://static-docs.nocobase.com/clipboard-image-1766666328.png)

恭喜！您已成功完成本次 AI 工作流体验。您可以继续探索其他岗位的 AI 员工，进一步提升业务效率。


## 内置员工一览
NocoBase 预置了多个针对特定场景的 AI 员工。

你只需要为它配置好 模型（Model） 即可开始投入工作。

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

## 备注
部分内置 AI 员工不会出现在右下角的 AI 员工列表中，它们有专属工作场景，例如
* Orin 只会出现在数据配置页面；
* Dara 只会出现在图表配置页面；
* Nathan 只会出现在 JS 编辑器上。
