# plugin-ai workflow v2 迁移任务拆分

## 基本信息

- 当前待迁移代码：`packages/plugins/@nocobase/plugin-ai/src/client/workflow`
- v2 主实现目录：`packages/plugins/@nocobase/plugin-ai/src/client-v2/workflow`
- 当前代码访问路径：`http://localhost:13004/v/admin`
- v1 对照源码：`/Users/drol/workspace/nocobase/ai-employee-comparison`
- v1 对照访问路径：`http://localhost:13022/admin`
- 迁移原则：`src/client-v2/` 作为主实现，`src/client/` 保留为兼容入口；v2 不引入 `@nocobase/client`、`@formily/*` runtime 或本插件 `src/client/`。

## 状态定义

| 状态 | 含义 |
| --- | --- |
| 未开始 | 尚未动手 |
| 进行中 | 正在实现、审计、对照或验证 |
| 代码完成 | 已完成代码变更，尚未完成校验 |
| UI 对照中 | 正在用浏览器对照 v1/v2 UI 与交互 |
| 校验通过 | lint、测试、必要的 UI 对照均通过 |
| 已提交 | 任务状态已更新并已提交代码 |
| 阻塞 | 需要用户决策、上游能力或运行环境修复 |
| 跳过 | 明确不在本轮范围内 |

## 执行规则

1. 每个小任务开始前，将状态改为“进行中”并提交或纳入该任务提交。
2. 每个小任务完成后，先更新本文件状态和验收记录，再只暂存本任务相关文件提交代码。
3. 每个提交只包含一个小任务的变更，不混入 unrelated 文件；当前已知 unrelated 修改：仓库根 `yarn.lock`。
4. 涉及 UI 的任务必须在必要时启动 Kimi WebBridge，对比两个地址：
   - v2：`http://localhost:13004/v/admin`
   - v1：`http://localhost:13022/admin`
5. v2 UI 和交互应尽量与 v1 一模一样；确实不能一致时，必须在对应任务验收记录中写明原因。
6. workflow runtime 分流边界必须保持：
   - 只有“增加节点抽屉”按 runtime 分流。
   - 点击节点/触发器打开配置抽屉时，已迁移的走 v2，未迁移的继续走 v1。
   - 不把所有抽屉/弹窗强行改成双 runtime。

## 变量输入专项规则

已审计 workflow v2 先例：

- `packages/plugins/@nocobase/plugin-workflow/src/client-v2/canvas/WorkflowVariableInput.tsx`
- `packages/plugins/@nocobase/plugin-workflow/src/client-v2/nodes/components/condition.tsx`
- `packages/plugins/@nocobase/plugin-workflow/src/client-v2/canvas/WorkflowVariableTextArea.tsx`
- `packages/plugins/@nocobase/plugin-workflow/src/client-v2/canvas/WorkflowVariableJsonTextArea.tsx`

迁移映射：

| v1 字段类型 | v1 真实形态 | v2 计划 |
| --- | --- | --- |
| `WorkflowVariableInput` / `Variable.Input` | 单行变量输入 | 复用 workflow v2 `WorkflowVariableInput` |
| `WorkflowVariableRawTextArea` / `Variable.RawTextArea` | 真实多行 textarea | 复用 workflow v2 `WorkflowVariableTextArea` |
| `WorkflowVariableJSON` | JSON textarea + 变量插入 | 复用 workflow v2 `WorkflowVariableJsonTextArea` |

禁止仅凭 `TextArea` 名字新建包装层。当前迁移不新增 workflow variable textarea wrapper。

## 大任务拆分

### W0. 迁移任务文档与基线准备

状态：已提交

目标：把 workflow 迁移拆成可独立提交的小任务，并记录对照环境、状态流转和验收要求。

#### W0.1 新增 workflow 迁移任务拆分文档

- 状态：已提交
- 范围：
  - `prd/workflow-v2-migration-tasks.md`
- 完成标准：
  - 文档包含独立大任务、小任务、状态、提交规则、UI 对照地址。
  - 不修改业务代码。
- 验收记录：
  - 已新增本 PRD，包含 workflow 迁移大任务、小任务、状态流转、提交规则、v1/v2 对照地址和变量输入专项规则。
  - 本任务只新增文档，不修改业务代码。

#### W0.2 浏览器基线截图与交互清单

- 状态：未开始
- 范围：
  - v1 `http://localhost:13022/admin`
  - v2 `http://localhost:13004/v/admin`
- 完成标准：
  - 使用 Kimi WebBridge 记录 LLM 节点、AI employee 节点、AI employee trigger 的 v1 配置 UI。
  - 明确每个配置项的显示顺序、默认值、显隐规则、禁用规则、按钮文案和交互。
- 验收记录：
  - 待填写。

### W1. workflow v2 注册骨架与共享类型

状态：未开始

目标：建立 v2 workflow 主实现目录、公共类型和注册入口，不迁移具体 UI。

#### W1.1 新建 workflow v2 目录与共享类型

- 状态：未开始
- 范围：
  - `src/client-v2/workflow/types.ts`
  - `src/client-v2/workflow/constants.ts`
  - `src/client-v2/workflow/components/`
- 完成标准：
  - 抽出 LLM、AI employee、trigger parameters、files、approval 等配置类型。
  - 不使用 `any`，必要时使用 `unknown` 和类型守卫。
  - `src/client-v2/workflow` 无 v1 client/Formily runtime import。
- 验收记录：
  - 待填写。

#### W1.2 注册 v2 workflow instruction group、nodes、trigger

- 状态：未开始
- 范围：
  - `src/client-v2/plugin.tsx`
  - `src/client-v2/workflow/nodes/llm/index.tsx`
  - `src/client-v2/workflow/nodes/employee/index.tsx`
  - `src/client-v2/workflow/triggers/ai-employee/index.tsx`
- 完成标准：
  - v2 plugin 通过 `@nocobase/plugin-workflow/client-v2` 注册 `ai` group、`llm`、`ai-employee`、`ai-employee` trigger。
  - instruction/trigger 类先只包含 title/type/group/icon/useVariables/createDefaultConfig/loader 壳。
  - loader 指向真实后续组件文件，不创建无意义 re-export shim。
- 验收记录：
  - 待填写。

### W2. LLM workflow 节点迁移

状态：未开始

目标：把 v1 `workflow/nodes/llm` 迁到 v2，配置 UI 改为原生 antd。

#### W2.1 LLM service 选择和 provider model settings

- 状态：未开始
- 范围：
  - `src/client-v2/workflow/nodes/llm/components/LLMFieldset.tsx`
  - `src/client-v2/llm-providers/forms.tsx` 如需抽公共能力
- 完成标准：
  - `llmService` 复用 v2 RemoteSelect。
  - provider model settings 复用 `src/client-v2/llm-providers/forms.tsx` 的 antd 实现。
  - 不再从 `src/client/llm-providers/*` 读取 v1 Formily 表单。
- UI 对照：
  - 对照 v1 LLM service 下拉、模型字段、Options 折叠区。
- 验收记录：
  - 待填写。

#### W2.2 LLM messages 配置迁移

- 状态：未开始
- 范围：
  - `src/client-v2/workflow/nodes/llm/components/Messages.tsx`
  - `src/client-v2/workflow/components/WorkflowListCollapse.tsx`
- 完成标准：
  - `messages` 保持 v1 数组结构。
  - system/assistant 普通内容使用 `WorkflowVariableTextArea`。
  - user content 支持 text、image_url、image_base64。
  - 图片 URL 字段使用 `WorkflowVariableInput`，保持单行。
  - 增删、排序、折叠、错误提示与 v1 对齐。
- UI 对照：
  - 对照 v1 添加消息、切换角色、添加 content、切换 content type、删除/排序。
- 验收记录：
  - 待填写。

#### W2.3 LLM structured output 配置迁移

- 状态：未开始
- 范围：
  - `src/client-v2/workflow/nodes/llm/components/StructuredOutput.tsx`
- 完成标准：
  - `structuredOutput.schema` 使用 workflow v2 `WorkflowVariableJsonTextArea`。
  - `name`、`description`、`strict` 使用 antd 原生组件。
  - 值结构与 v1 保持一致。
- UI 对照：
  - 对照 JSON Schema、Name、Description、Strict 字段。
- 验收记录：
  - 待填写。

#### W2.4 LLM 节点测试与提交

- 状态：未开始
- 范围：
  - LLM 节点相关测试
  - 本 PRD 状态更新
- 完成标准：
  - loader 测试通过。
  - 表单初始值、提交值结构测试通过。
  - `yarn eslint --fix` 已运行在触达文件上。
  - 必要 UI 对照通过。
- 验收记录：
  - 待填写。

### W3. AI employee workflow 节点迁移

状态：未开始

目标：把 v1 `workflow/nodes/employee` 迁到 v2，保留配置结构并改为 antd。

#### W3.1 AI employee 基础配置迁移

- 状态：未开始
- 范围：
  - `src/client-v2/workflow/nodes/employee/components/AIEmployeeFieldset.tsx`
  - `src/client-v2/workflow/nodes/employee/components/AIEmployeeSelect.tsx`
- 完成标准：
  - tabs 保持 `Task`、`Feedback & Notification`。
  - AI employee 选择器保持头像、昵称、职位、Profile popover。
  - 切换员工时清空 `skillSettings.skills` 和 `skillSettings.tools`。
  - 默认员工逻辑与 v1 一致。
- UI 对照：
  - 对照员工选择下拉、popover、默认值和切换行为。
- 验收记录：
  - 待填写。

#### W3.2 模型、操作者、消息、附件配置迁移

- 状态：未开始
- 范围：
  - `src/client-v2/workflow/nodes/employee/components/ModelOptions.tsx`
  - `src/client-v2/workflow/nodes/employee/components/UserInput.tsx`
  - `src/client-v2/workflow/nodes/employee/components/MessageInputs.tsx`
  - `src/client-v2/workflow/nodes/employee/components/FileInputs.tsx`
- 完成标准：
  - 模型选择复用 v2 AI employee 可用模型过滤逻辑。
  - `userId` 保留“用户远程选择 + workflow 变量”能力。
  - `message.system`、`message.user` 使用 `WorkflowVariableTextArea`，保留多行。
  - attachments/file_id/file_url 三种附件来源结构不变。
  - `files[].value` 使用 `WorkflowVariableInput`。
- UI 对照：
  - 对照模型下拉、操作者选择、消息多行变量输入、附件列表。
- 验收记录：
  - 待填写。

#### W3.3 技能、工具、web search 配置迁移

- 状态：未开始
- 范围：
  - `src/client-v2/workflow/nodes/employee/components/SkillSettings.tsx`
  - `src/client-v2/workflow/nodes/employee/components/WebSearchOptions.tsx`
- 完成标准：
  - 复用或抽取 `AIEmployeeShortcutModel` 已有 skills/tools preset/custom 逻辑。
  - `skillsVersion`、`toolsVersion` 兼容逻辑保留。
  - web search 在模型不支持时禁用并自动清空 true。
- UI 对照：
  - 对照 Preset/Custom、远程多选、模型不支持 web search 提示。
- 验收记录：
  - 待填写。

#### W3.4 feedback、structured output、assignees 配置迁移

- 状态：未开始
- 范围：
  - `src/client-v2/workflow/nodes/employee/components/FeedbackSettings.tsx`
  - `src/client-v2/workflow/nodes/employee/components/StructuredOutput.tsx`
  - `src/client-v2/workflow/nodes/employee/components/Assignees.tsx`
- 完成标准：
  - `structuredOutput.schema` 使用 `WorkflowVariableJsonTextArea`。
  - `requiresApproval` 三种模式、tooltip 和默认值与 v1 一致。
  - `assignees` 只在非 `no_required` 时显示并必填。
  - assignees 保留“选择用户”和“查询用户”两种添加方式，值结构与 v1 一致。
- UI 对照：
  - 对照审批模式切换、assignees 显隐、添加用户/查询用户入口。
- 验收记录：
  - 待填写。

#### W3.5 AI employee 节点测试与提交

- 状态：未开始
- 范围：
  - AI employee 节点相关测试
  - 本 PRD 状态更新
- 完成标准：
  - loader、useVariables、表单值结构测试通过。
  - structured output schema 解析异常不导致配置 UI 崩溃。
  - `yarn eslint --fix` 已运行在触达文件上。
  - 必要 UI 对照通过。
- 验收记录：
  - 待填写。

### W4. AI employee workflow trigger 迁移

状态：未开始

目标：把 v1 `workflow/triggers/ai-employee` 参数配置迁到 v2。

#### W4.1 trigger 参数列表组件迁移

- 状态：未开始
- 范围：
  - `src/client-v2/workflow/triggers/ai-employee/Parameters.tsx`
  - `src/client-v2/workflow/triggers/ai-employee/AIEmployeeTriggerConfig.tsx`
- 完成标准：
  - `parameters` 使用 antd `Form.List`。
  - 支持排序、删除、添加、编辑 modal。
  - 行展示 name、type、required、description tooltip。
  - 参数名校验保持 `/^[a-zA-Z_]+$/`。
  - enum 类型时显示并校验 options。
- UI 对照：
  - 对照添加参数、编辑参数、enum options、排序、删除。
- 验收记录：
  - 待填写。

#### W4.2 trigger useVariables 和校验

- 状态：未开始
- 范围：
  - `src/client-v2/workflow/triggers/ai-employee/index.tsx`
- 完成标准：
  - `useVariables(config)` 返回参数变量，与 v1 `$context` scope 一致。
  - `validate(config)` 至少校验 parameters 结构，不破坏空参数场景。
  - title/description 使用 `tExpr` 或 workflow 可编译模板。
- 验收记录：
  - 待填写。

#### W4.3 trigger 测试与提交

- 状态：未开始
- 范围：
  - trigger 相关测试
  - 本 PRD 状态更新
- 完成标准：
  - loader、参数值结构、变量输出测试通过。
  - `yarn eslint --fix` 已运行在触达文件上。
  - 必要 UI 对照通过。
- 验收记录：
  - 待填写。

### W5. v1 兼容入口收敛

状态：未开始

目标：v2 主实现完成后，把 `src/client/workflow` 改为兼容入口，避免长期维护两套实现。

#### W5.1 LLM v1 入口改为继承 v2

- 状态：未开始
- 前置：W2 校验通过
- 范围：
  - `src/client/workflow/nodes/llm/index.tsx`
  - `src/client/workflow/nodes/llm/ModelSettings.tsx`
  - `src/client/workflow/nodes/llm/legacy-provider-options.ts`
- 完成标准：
  - v1 `LLMInstruction` 继承 v2 instruction。
  - 删除不再需要的 v1 Formily provider settings 依赖。
  - 保持 v1 canvas 已迁移节点点击配置时走 v2 loader。
- 验收记录：
  - 待填写。

#### W5.2 AI employee v1 入口改为继承 v2

- 状态：未开始
- 前置：W3 校验通过
- 范围：
  - `src/client/workflow/nodes/employee/**`
- 完成标准：
  - v1 `AIEmployeeInstruction` 继承 v2 instruction。
  - 删除重复的 v1 配置组件和 FlowModel 半迁移实现。
  - 保留必要 v1-only 覆盖；没有必要则不保留。
- 验收记录：
  - 待填写。

#### W5.3 AI employee trigger v1 入口改为继承 v2

- 状态：未开始
- 前置：W4 校验通过
- 范围：
  - `src/client/workflow/triggers/ai-employee/**`
- 完成标准：
  - v1 trigger 继承 v2 trigger。
  - 删除 Formily `ArrayItems`、`SchemaComponent` modal 参数编辑实现。
  - 保持 v1 workflow pane 已迁移 trigger 配置走 v2 loader。
- 验收记录：
  - 待填写。

### W6. 总体验收、清理和最终提交

状态：未开始

目标：确认 workflow 迁移整体完成，清理重复实现和风险点。

#### W6.1 禁止 import 扫描

- 状态：未开始
- 完成标准：
  - `src/client-v2/workflow` 无 `@nocobase/client`。
  - `src/client-v2/workflow` 无 `@formily/*` runtime。
  - `src/client-v2/workflow` 无 `@nocobase/plugin-workflow/client`。
  - `src/client-v2/workflow` 无相对路径引用本插件 `src/client/`。
- 验收记录：
  - 待填写。

#### W6.2 浏览器回归对照

- 状态：未开始
- 完成标准：
  - 在 v2 地址创建或打开 workflow，验证 AI 分组、LLM 节点、AI employee 节点、AI employee trigger。
  - 与 v1 地址逐项对照配置 UI、默认值、交互、保存后的值结构。
  - 验证 runtime 分流边界未被扩大。
- 验收记录：
  - 待填写。

#### W6.3 最终测试和文档收口

- 状态：未开始
- 完成标准：
  - 相关 workflow client-v2 测试通过。
  - 相关 plugin-ai 测试通过。
  - 本 PRD 所有已完成任务状态为“已提交”或“校验通过”。
  - 输出修改文件列表、兼容层、删除的重复实现、校验结果、自测方法。
- 验收记录：
  - 待填写。

## 当前任务状态总览

| 大任务 | 状态 | 下一步 |
| --- | --- | --- |
| W0. 迁移任务文档与基线准备 | 已提交 | 开始 W0.2 |
| W1. workflow v2 注册骨架与共享类型 | 未开始 | 等 W0.2 或用户确认后开始 |
| W2. LLM workflow 节点迁移 | 未开始 | 等 W1 完成 |
| W3. AI employee workflow 节点迁移 | 未开始 | 等 W1 完成 |
| W4. AI employee workflow trigger 迁移 | 未开始 | 等 W1 完成 |
| W5. v1 兼容入口收敛 | 未开始 | 等 W2/W3/W4 校验通过 |
| W6. 总体验收、清理和最终提交 | 未开始 | 等 W5 完成 |
