# AI 员工 · 管理员配置指南

> 这篇文档帮你快速搞懂如何配置和管理 AI 员工，从模型服务到任务上岗，一步步带你走完整个流程。


## 一、开始之前

### 1. 系统要求

在配置之前，请确保你的环境满足以下条件：

* 已安装 **NocoBase 2.0 或更高版本**
* 已启用 **AI 员工插件**
* 至少有一个可用的 **大语言模型服务**（如 OpenAI、Claude、DeepSeek、GLM 等）


### 2. 了解 AI 员工的双层设计

AI 员工分为两层：**"角色定义"** 和 **"任务定制"**。

| 层级       | 说明           | 特点         | 作用      |
| -------- | ------------ | ---------- | ------- |
| **角色定义** | 员工的基础人格与核心能力 | 稳定不变，像"简历" | 确保角色一致性 |
| **任务定制** | 针对不同业务场景的配置  | 灵活调整       | 适配具体任务  |

**简单理解：**

> "角色定义"决定这个员工是谁，
> "任务定制"决定他在当前要做什么。

这样设计的好处是：

* 角色不变，但可以胜任不同场景
* 升级或替换任务不会影响员工本身
* 背景与任务互相独立、维护更轻松


## 二、配置流程（5 步搞定）

### 第 1 步：配置模型服务

模型服务相当于 AI 员工的大脑，必须先设置好。

> 💡 详细配置说明请参考：[配置 LLM 服务](/ai-employees/features/llm-service)

**路径：**
`系统设置 → AI 员工 → LLM service`

![进入配置页面](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

点击 **添加**，填写以下信息：

| 项目     | 说明                         | 注意事项      |
| ------ | -------------------------- | --------- |
| Provider   | 如 OpenAI、Claude、Gemini、Kimi 等          | 兼容相同规范的服务 |
| API 密钥 | 服务商提供的密钥                   | 保密并定期更换   |
| Base URL   | API Endpoint（可选）               | 使用代理时需修改  |
| Enabled Models   | 推荐模型 / 选择模型 / 手动录入模型 | 决定会话中可切换的模型范围   |

![创建大模型服务](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

配置后请使用 `Test flight` **测试连接**。
如果失败，请检查网络、密钥或模型名称。

![测试连接](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)


### 第 2 步：创建 AI 员工

> 💡 详细说明请参考：[创建 AI 员工](/ai-employees/features/new-ai-employees)

路径：`AI 员工管理 → 创建员工`

填写基础信息：

| 字段    | 必填 | 示例             |
| ----- | -- | -------------- |
| 名称    | ✓  | viz, dex, cole |
| 昵称    | ✓  | Viz, Dex, Cole |
| 启用状态  | ✓  | 开启             |
| 简介    | -  | "数据分析专家"       |
| 主要提示词 | ✓  | 见提示词工程指南       |
| 欢迎语   | -  | "你好，我是 Viz…"   |

![基础信息配置](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

员工创建阶段主要完成角色与技能配置。实际使用模型可在会话中通过 `Model Switcher` 选择。

**提示词编写建议：**

* 说清楚员工的角色、语气和职责
* 用"必须""绝不"等词强调规则
* 尽量包含示例，避免抽象说明
* 控制在 500–1000 字符之间

> 提示词越清晰，AI 表现越稳定。
> 可参考 [提示词工程指南](./prompt-engineering-guide.md)。


### 第 3 步：配置技能

技能决定员工能"做什么"。

> 💡 详细说明请参考：[技能](/ai-employees/features/tool)

| 类型   | 能力范围    | 示例        | 风险等级   |
| ---- | ------- | --------- | ------ |
| 前端   | 页面交互    | 读取区块数据、填表 | 低      |
| 数据模型 | 数据查询与分析 | 聚合统计      | 中      |
| 工作流  | 执行业务流程  | 自定义工具     | 取决于工作流 |
| 其他   | 外部拓展    | 联网搜索、文件操作 | 视情况而定  |

**配置建议：**

* 每个员工 3–5 个技能最合适
* 不建议全选，容易混乱
* 重要操作建议使用 `Ask` 权限，而不是 `Allow`

![配置技能](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-26-06.png)


### 第 4 步：配置知识库（可选）

如果你的 AI 员工需要记忆或引用大量资料，比如产品说明书、FAQ 等，可以配置知识库。

> 💡 详细说明请参考：
> - [AI 知识库概述](/ai-employees/knowledge-base/index)
> - [向量数据库](/ai-employees/knowledge-base/vector-database)
> - [知识库配置](/ai-employees/knowledge-base/knowledge-base)
> - [RAG 检索增强生成](/ai-employees/knowledge-base/rag)

这需要额外安装向量数据库插件。

![配置知识库](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-32-54.png)

**适用场景：**

* 让 AI 理解企业知识
* 支持文档问答与检索
* 训练领域专属助理


### 第 5 步：验证效果

完成后，你会在页面右下角看到新员工的头像。

![验证配置](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)

请逐项检查：

* ✅ 图标是否显示正常
* ✅ 能否进行基础对话
* ✅ 技能能否正确调用

若都通过，说明配置成功 🎉


## 三、任务配置：让 AI 真正上岗

前面完成的是"创建员工"，
接下来要让他们"去工作"。

AI 任务定义了员工在具体页面或区块中的行为。

> 💡 详细说明请参考：[任务](/ai-employees/features/task)


### 1. 页面级任务

适用于整个页面范围，比如"分析本页数据"。

**配置入口：**
`页面设置 → AI 员工 → 添加任务`

| 字段   | 说明       | 示例        |
| ---- | -------- | --------- |
| 标题   | 任务名称     | 阶段转化分析    |
| 背景   | 当前页面的上下文 | Leads 列表页 |
| 默认消息 | 预设对话     | "请分析本月趋势" |
| 默认区块 | 自动关联数据表  | leads 表格  |
| 技能   | 可用工具     | 查询数据、生成图表 |

![页面级任务配置](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**多任务支持：**
同一个 AI 员工可配置多个任务，以选项形式供用户选择：

![多任务支持](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

建议：

* 一个任务聚焦一个目标
* 名称清晰易懂
* 任务数量控制在 5–7 个以内


### 2. 区块级任务

适合操作某个特定区块，如"翻译当前表单"。

**配置方式：**

1. 打开区块操作配置
2. 添加"AI 员工"

![添加AI员工按钮](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-51-06.png)

3. 绑定目标员工即可

![选择AI员工](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-52-26.png)

![区块级任务配置](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-53-35.png)

| 对比项  | 页面级  | 区块级       |
| ---- | ---- | --------- |
| 数据范围 | 整个页面 | 当前区块      |
| 粒度   | 全局分析 | 细节处理      |
| 典型用途 | 趋势分析 | 表单翻译、字段提取 |


## 四、最佳实践

### 1. 配置建议

| 项目         | 建议          | 理由       |
| ---------- | ----------- | -------- |
| 技能数量       | 3–5 个       | 准确高、响应快  |
| 权限模式（Ask / Allow） | 修改数据建议 Ask | 防止误操作 |
| 提示词长度      | 500–1000 字符 | 兼顾速度与质量  |
| 任务目标       | 单一明确        | 避免 AI 迷茫 |
| 工作流        | 复杂任务封装后使用   | 成功率更高    |


### 2. 实战建议

**从小到大，逐步优化：**

1. 先创建基础员工（如 Viz、Dex）
2. 开启 1–2 个核心技能测试
3. 确认能正常执行任务
4. 再逐步扩展更多技能与任务

**持续优化流程：**

1. 初版能跑
2. 收集使用反馈
3. 优化提示词与任务配置
4. 测试并循环改进


## 五、常见问题解答

### 1. 配置阶段

**Q：保存失败怎么办？**
A：检查是否填写了所有必填项，尤其是模型服务与提示词。

**Q：该选哪个模型？**

* 代码类 → Claude、GPT-4
* 分析类 → Claude、DeepSeek
* 成本敏感 → Qwen、GLM
* 长文本 → Gemini、Claude


### 2. 使用阶段

**Q：AI 回复太慢？**

* 减少技能数量
* 优化提示词
* 检查模型服务延迟
* 可考虑换模型

**Q：任务执行不准？**

* 提示词不够明确
* 技能太多导致混乱
* 拆小任务、加示例

**Q：Ask / Allow 什么时候选？**

* 查询类任务可以使用 `Allow`
* 修改数据类任务建议使用 `Ask`

**Q：如何让AI处理特定表单？**

A：如果是页面级的配置，需要手动点选区块。

![手动点选区块](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-02-22.png)

如果是区块级任务配置，自动绑定数据上下文。


## 六、后续阅读

想让 AI 员工更强大，可继续阅读以下文档：

**配置相关：**

* [提示词工程指南](./prompt-engineering-guide.md) - 编写高质量提示词的技巧和最佳实践
* [配置 LLM 服务](/ai-employees/features/llm-service) - 大模型服务的详细配置说明
* [创建 AI 员工](/ai-employees/features/new-ai-employees) - AI 员工的创建和基础配置
* [与 AI 员工协作](/ai-employees/features/collaborate) - 如何与 AI 员工进行有效对话

**进阶功能：**

* [技能](/ai-employees/features/tool) - 深入了解各类技能的配置和使用
* [任务](/ai-employees/features/task) - 任务配置的高级技巧
* [选择区块](/ai-employees/features/pick-block) - 如何为 AI 员工指定数据区块
* 数据源 - 请参考对应插件的数据源配置文档
* [联网搜索](/ai-employees/features/web-search) - 配置 AI 员工的联网搜索能力

**知识库与 RAG：**

* [AI 知识库概述](/ai-employees/knowledge-base/index) - 知识库功能介绍
* [向量数据库](/ai-employees/knowledge-base/vector-database) - 向量数据库的配置
* [知识库](/ai-employees/knowledge-base/knowledge-base) - 如何创建和管理知识库
* [RAG 检索增强生成](/ai-employees/knowledge-base/rag) - RAG 技术的应用

**工作流集成：**

* [LLM 节点 - 文本对话](/ai-employees/workflow/nodes/llm/chat) - 在工作流中使用文本对话
* [LLM 节点 - 多模态对话](/ai-employees/workflow/nodes/llm/multimodal-chat) - 处理图片、文件等多模态输入
* [LLM 节点 - 结构化输出](/ai-employees/workflow/nodes/llm/structured-output) - 获取结构化的 AI 响应


## 结语

配置 AI 员工最重要的是：**先跑通，再优化**。
先让第一个员工成功上岗，再逐步拓展与微调。

排查方向可以按以下顺序：

1. 模型服务是否连通
2. 技能数量是否过多
3. 提示词是否明确
4. 任务目标是否清晰

只要循序渐进，你就能打造一支真正高效的 AI 团队。
