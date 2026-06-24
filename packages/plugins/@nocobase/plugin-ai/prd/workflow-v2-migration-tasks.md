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

## 审计结果

### v1 UI 基线

- LLM 节点基线来源：v1 `LLM Node` workflow，地址 `http://localhost:13022/admin/settings/workflow/workflows/369436327477250`。
- AI employee trigger 基线来源：v1 `Tools1` workflow，地址 `http://localhost:13022/admin/settings/workflow/workflows/365215881625600`。
- AI employee 节点基线来源：v1 `AIEmployee` workflow，地址 `http://localhost:13022/admin/settings/workflow/workflows/356950351282176`。
- v1 `Tools1` 只包含 AI employee trigger，不包含 AI employee 节点；AI employee 节点改用 `AIEmployee` workflow 作为对照。
- 已执行过的 workflow 会显示只读提示：`Executed workflow cannot be modified. Could be copied to a new version to modify.`；配置抽屉布局和值仍可作为真实渲染基线。

### 字段级映射表

| v1 字段名 | v1 当前使用的组件/Schema 写法 | 线上或现有 v1 的真实渲染形态 | 计划复用的 v2 组件或先例文件路径 | 是否需要新增公共组件 |
| --- | --- | --- | --- | --- |
| LLM `llmService` | `RemoteSelect` / Formily schema | 必填远程选择器，当前样例值 `OpenAI` | `packages/plugins/@nocobase/plugin-ai/src/client-v2/components/RemoteSelect.tsx` | 否 |
| LLM `model` | provider `ModelSettings` / Formily schema | 必填模型选择，随 LLM service 切换，当前样例值 `gpt-5.5` | `packages/plugins/@nocobase/plugin-ai/src/client-v2/llm-providers/forms.tsx` | 否 |
| LLM `options.frequency_penalty` | `InputNumber` | Options 折叠区数字输入，样例值 `0.0`，带说明 | antd `InputNumber`，抽到 LLM fieldset | 否 |
| LLM `options.max_completion_tokens` | `InputNumber` | Options 折叠区数字输入，样例值 `-1`，带说明 | antd `InputNumber`，抽到 LLM fieldset | 否 |
| LLM `options.presence_penalty` | `InputNumber` | Options 折叠区数字输入，样例值 `0.0`，带说明 | antd `InputNumber`，抽到 LLM fieldset | 否 |
| LLM `options.temperature` | `InputNumber` | Options 折叠区数字输入，样例值 `1.0`，带说明 | antd `InputNumber`，抽到 LLM fieldset | 否 |
| LLM `options.top_p` | `InputNumber` | Options 折叠区数字输入，样例值 `0.5`，带说明 | antd `InputNumber`，抽到 LLM fieldset | 否 |
| LLM `options.response_format` | `Select` | Options 折叠区选择器，样例值 `JSON Schema`，带 JSON mode 说明 | antd `Select`，复用 provider option 定义 | 否 |
| LLM `options.timeout` | `InputNumber` | Options 折叠区数字输入，样例值 `60000` | antd `InputNumber`，抽到 LLM fieldset | 否 |
| LLM `options.max_retries` | `InputNumber` | Options 折叠区数字输入，样例值 `1` | antd `InputNumber`，抽到 LLM fieldset | 否 |
| LLM `messages[]` | `ArrayItems` + `ListCollapse` | `Messages` tab 中的可折叠列表，支持新增、删除、排序、展开/收起 | 参考 v1 `ListCollapse` 行为，在 `src/client-v2/workflow/components/WorkflowListCollapse.tsx` 迁为 antd | 是 |
| LLM `messages[].role` | `Select` | 消息行角色选择，样例有 `System`、`User` | antd `Select` | 否 |
| LLM `messages[].content` system/assistant | `WorkflowVariableRawTextArea` | 真实多行 textarea + 变量按钮，样例系统提示为中文长文本 | `packages/plugins/@nocobase/plugin-workflow/src/client-v2/canvas/WorkflowVariableTextArea.tsx` | 否 |
| LLM `messages[].content[]` user | 嵌套 `ArrayItems` + `ListCollapse` | User 消息内嵌内容列表，支持 `Add content`、排序、删除 | `src/client-v2/workflow/components/WorkflowListCollapse.tsx` | 是 |
| LLM `messages[].content[].type` | `Select` | 内容类型选择，样例为 `Text`，源码支持 `text`、`image_url`、`image_base64` | antd `Select` | 否 |
| LLM `messages[].content[].text` | `WorkflowVariableRawTextArea` | 真实多行 textarea + 变量按钮，样例含 `$context` 与 `$jobsMapByNodeKey` 变量 | `packages/plugins/@nocobase/plugin-workflow/src/client-v2/canvas/WorkflowVariableTextArea.tsx` | 否 |
| LLM `messages[].content[].image_url` | `WorkflowVariableInput` | 单行变量输入 | `packages/plugins/@nocobase/plugin-workflow/src/client-v2/canvas/WorkflowVariableInput.tsx` | 否 |
| LLM `messages[].content[].image_base64` | `WorkflowVariableInput` | 单行变量输入 | `packages/plugins/@nocobase/plugin-workflow/src/client-v2/canvas/WorkflowVariableInput.tsx` | 否 |
| LLM `structuredOutput.schema` | `WorkflowVariableJSON` | `Structured output` tab 中 JSON textarea + 变量按钮，显示 `Syntax references: JSON Schema` | `packages/plugins/@nocobase/plugin-workflow/src/client-v2/canvas/WorkflowVariableJsonTextArea.tsx` | 否 |
| LLM `structuredOutput.name` | `Input` | 单行输入 | antd `Input` | 否 |
| LLM `structuredOutput.description` | `Input.TextArea` | 多行说明输入 | antd `Input.TextArea` | 否 |
| LLM `structuredOutput.strict` | `Checkbox` | 复选框 | antd `Checkbox` | 否 |
| AI employee `username` | `AIEmployeeSelect` + Formily decorator | `Task` tab 第一项，员工选择器显示头像、昵称、下拉箭头；样例为 `Atlas` | 迁到 `src/client-v2/workflow/nodes/employee/components/AIEmployeeSelect.tsx`，复用 `ProfileCard` / `avatars` | 是 |
| AI employee `model` | `ModelOptions` + `ModelSelect` | `Model` 选择器，placeholder `Use default model`，按员工可用模型过滤 | 复用 `packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/model.ts` 过滤逻辑 | 是 |
| AI employee `userId` | `UsersSelect` from workflow v1 + 变量按钮 | 必填 `Operator`，用户远程选择 + 单行变量按钮 | 优先查 workflow v2 是否有用户选择先例；变量输入复用 `WorkflowVariableInput` | 是 |
| AI employee `message.system` | `WorkflowVariableRawTextArea` rows 10 | `Background`，真实多行 textarea + 变量按钮 | `packages/plugins/@nocobase/plugin-workflow/src/client-v2/canvas/WorkflowVariableTextArea.tsx` | 否 |
| AI employee `message.user` | `WorkflowVariableRawTextArea` rows 10 | `Default user message`，真实多行 textarea + 变量按钮，样例为 `{{$context.data.input}}` | `packages/plugins/@nocobase/plugin-workflow/src/client-v2/canvas/WorkflowVariableTextArea.tsx` | 否 |
| AI employee `files[]` | `FileInputs` + v1 `ListCollapse` | `Attachments` 列表，空态 `No data`，按钮 `Add file` | `src/client-v2/workflow/components/WorkflowListCollapse.tsx` | 是 |
| AI employee `files[].type` | antd `Select` inside Formily field | `Attachment Type`，选项为 Attachment / Files collection / URL | antd `Select` | 否 |
| AI employee `files[].collection` | `DataSourceCollectionCascader` | 仅 `file_id` 时显示，限制 main 数据源和 file collection | 查 workflow v2 collection 组件，优先复用 `packages/plugins/@nocobase/plugin-workflow/src/client-v2/components/collection/*` | 待 W3.2 审计确认 |
| AI employee `files[].value` | `WorkflowVariableInput` | 单行变量输入；label 随类型为 `Attachment field` / `ID` / `URL` | `packages/plugins/@nocobase/plugin-workflow/src/client-v2/canvas/WorkflowVariableInput.tsx` | 否 |
| AI employee `skillSettings.skills` | `SkillSettings` | `Skills` radio：`Preset` / `Custom`，选择区提示 `Leave empty to disable skills.` | 复用/抽取 `packages/plugins/@nocobase/plugin-ai/src/client-v2/models/ai-employees/AIEmployeeShortcutModel.tsx` 同类 preset/custom 逻辑 | 是 |
| AI employee `skillSettings.tools` | `SkillSettings` | `Tools` radio：`Preset` / `Custom`，选择区提示 `Leave empty to disable tools.` | 复用/抽取 `packages/plugins/@nocobase/plugin-ai/src/client-v2/models/ai-employees/AIEmployeeShortcutModel.tsx` 同类 preset/custom 逻辑 | 是 |
| AI employee `webSearch` | `WebSearchSwitch` | `Web search` switch；模型不支持时禁用并显示 `Web search not supported` | antd `Switch` + `getServiceByOverride` | 否 |
| AI employee `structuredOutput.schema` | `WorkflowVariableJSON` | `Feedback & Notification` tab 中 `Structured output` JSON textarea + 变量按钮，带 JSON Schema 帮助链接 | `packages/plugins/@nocobase/plugin-workflow/src/client-v2/canvas/WorkflowVariableJsonTextArea.tsx` | 否 |
| AI employee `requiresApproval` | `Radio.Group` | `Approval & Notice` 三项：`No required`、`AI decision`、`Human decision`，每项有 tooltip | antd `Radio.Group` + `Tooltip` | 否 |
| AI employee `assignees` | workflow v1 `UsersAddition` / `UsersSelect` + `ArrayItems` | 非 `no_required` 时显示并必填；样例显示条件组 `Meet All conditions in the group` | 优先复用 workflow v2 已迁移的用户/条件选择先例；若缺失，在 W3.4 迁成 antd 条件组组件 | 是 |
| AI employee trigger `parameters[]` | `ArrayItems` + `ParameterAddition` / `EditParameter` | `Parameters` 列表，空态只显示虚线 `Add parameter` 按钮和说明 `Parameters required by the tool` | `src/client-v2/workflow/triggers/ai-employee/Parameters.tsx` 原生 antd `Form.List` | 是 |
| trigger `parameters[].name` | modal `Input` + validator | `Add parameter` modal 必填 `Parameter name`，校验 `/^[a-zA-Z_]+$/`，错误文案 `a-z, A-Z, _` | antd `Input` + `Form.Item.rules` | 否 |
| trigger `parameters[].type` | modal `Select` | 必填 `Parameter type`，选项 `string` / `number` / `boolean` / `enum` | antd `Select` | 否 |
| trigger `parameters[].description` | modal `Input.TextArea` | `Parameter description` 多行输入；列表行有描述时显示问号 tooltip | antd `Input.TextArea` + `Tooltip` | 否 |
| trigger `parameters[].enumOptions` | modal `ArrayItems` + reaction | 仅 type 为 `enum` 时显示 `Options` 并必填，支持 `Add option`、排序、删除 | antd `Form.List` + `Input` | 否 |
| trigger `parameters[].required` | modal `Checkbox` | `Required` 复选框；列表行以小号红色 `required` 展示 | antd `Checkbox` | 否 |

### 迁移方案

1. 先建立 `src/client-v2/workflow` 的公共类型、常量和注册骨架，v2 instruction / trigger 只注册加载入口，不引入 v1 client 或 Formily runtime。
2. LLM 节点按字段迁移为原生 antd 表单；变量输入严格复用 workflow v2 `WorkflowVariableInput`、`WorkflowVariableTextArea`、`WorkflowVariableJsonTextArea`。
3. AI employee 节点按 `Task` 与 `Feedback & Notification` 两个 tab 拆分组件；AI employee 选择、模型过滤、skills/tools preset/custom 逻辑优先复用 client-v2 已有实现。
4. AI employee trigger 参数编辑改为 antd `Form.List` + modal，保持参数值结构、排序、删除、enum options 显隐与校验。
5. v2 主实现完成并校验后，再将 `src/client/workflow` 收敛为兼容入口；已迁移的节点/触发器配置抽屉走 v2，未迁移能力继续走 v1，不扩大 runtime 分流边界。
6. 最后做禁止 import 扫描、UI 对照、eslint 和相关测试，确认 v2 与 v1 交互和值结构一致。

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

- 状态：已提交
- 范围：
  - v1 `http://localhost:13022/admin`
  - v2 `http://localhost:13004/v/admin`
- 完成标准：
  - 使用 Kimi WebBridge 记录 LLM 节点、AI employee 节点、AI employee trigger 的 v1 配置 UI。
  - 明确每个配置项的显示顺序、默认值、显隐规则、禁用规则、按钮文案和交互。
- 验收记录：
  - 已使用 Kimi WebBridge 对照 v1：`LLM Node`、`Tools1`、`AIEmployee` 三个 workflow。
  - 已记录 LLM 节点 Messages / Structured output / Options 的字段顺序、真实控件形态、变量输入类型和值结构。
  - 已记录 AI employee trigger 参数列表、添加参数 modal、参数类型、enum options 显隐和参数名校验。
  - 已记录 AI employee 节点 Task / Feedback & Notification 两个 tab 的字段顺序、真实控件形态、显隐规则和值结构。
  - 已补充字段级映射表和迁移方案；当前结论是不新增 workflow variable textarea wrapper。

### W1. workflow v2 注册骨架与共享类型

状态：已提交

目标：建立 v2 workflow 主实现目录、公共类型和注册入口，不迁移具体 UI。

#### W1.1 新建 workflow v2 目录与共享类型

- 状态：已提交
- 范围：
  - `src/client-v2/workflow/types.ts`
  - `src/client-v2/workflow/constants.ts`
  - `src/client-v2/workflow/components/`
- 完成标准：
  - 抽出 LLM、AI employee、trigger parameters、files、approval 等配置类型。
  - 不使用 `any`，必要时使用 `unknown` 和类型守卫。
  - `src/client-v2/workflow` 无 v1 client/Formily runtime import。
- 验收记录：
  - 已新增 `constants.ts`、`types.ts`、`components/index.ts`。
  - 已抽出 LLM messages/content/structured output/model options、AI employee config/files/approval/assignees、AI employee trigger parameters、JSON schema 和 workflow variable option 类型。
  - 已运行 `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client-v2/workflow/constants.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/workflow/types.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/workflow/components/index.ts`。
  - 已扫描 `src/client-v2/workflow`，未发现 `@nocobase/client`、`@formily`、`@nocobase/plugin-workflow/client` 或本插件 `src/client/` import。

#### W1.2 注册 v2 workflow instruction group、nodes、trigger

- 状态：已提交
- 范围：
  - `src/client-v2/workflow/register.ts`
  - `src/client-v2/plugin.tsx`
  - `src/client-v2/workflow/nodes/llm/index.tsx`
  - `src/client-v2/workflow/nodes/employee/index.tsx`
  - `src/client-v2/workflow/triggers/ai-employee/index.tsx`
- 完成标准：
  - v2 plugin 通过 `@nocobase/plugin-workflow/client-v2` 注册 `ai` group、`llm`、`ai-employee`、`ai-employee` trigger。
  - instruction/trigger 类先只包含 title/type/group/icon/useVariables/createDefaultConfig/loader 壳。
  - loader 指向真实后续组件文件，不创建无意义 re-export shim。
- 验收记录：
  - 已新增 `registerPluginAIWorkflow()`，在 workflow v2 插件存在时注册 `ai` group、`llm`、`ai-employee` instruction 和 `ai-employee` trigger。
  - 已在 `src/client-v2/plugin.tsx` 调用 workflow v2 注册函数；workflow v2 不存在时跳过，不影响 plugin-ai 其他 v2 能力。
  - 已新增 LLM、AI employee、AI employee trigger 的 v2 class 骨架；loader 指向后续真实组件模块。
  - 已新增 `workflow-registration.test.ts` 覆盖注册行为、LLM 变量、AI employee structured output 变量解析和 trigger 参数校验。
  - 已运行 `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/workflow-registration.test.ts --run --reporter=verbose`，5 个用例通过。
  - 已运行触达文件 eslint，并扫描确认 `src/client-v2/workflow` 和 `src/client-v2/plugin.tsx` 未引入 v1 client/Formily runtime/legacy workflow client/本插件 `src/client/`。

### W2. LLM workflow 节点迁移

状态：已提交

目标：把 v1 `workflow/nodes/llm` 迁到 v2，配置 UI 改为原生 antd。

#### W2.1 LLM service 选择和 provider model settings

- 状态：已提交
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
  - 已将 `OptionsFields` 抽为可复用 antd 组件，支持 `namePrefix`，provider 设置页仍默认写入 `options.*`。
  - 已新增 builtin provider -> model option fields 映射，workflow LLM 复用 v2 provider option 字段定义。
  - `LLMFieldset` 已迁为原生 antd：`llmService` 复用 v2 `RemoteSelect`，`model` 复用 v2 `ModelSelect`，Options 使用 antd `Collapse`。
  - 已确认 workflow LLM 提交值仍写入 `config` 根级：`llmService`、`model`、`frequencyPenalty`、`responseFormat` 等，与 server 端读取结构一致。
  - 已运行 `yarn eslint --fix` 覆盖触达文件。
  - 已运行 `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/llm-providers.test.tsx packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/workflow-registration.test.ts --run --reporter=verbose`；provider 测试 5 个用例通过，并单独确认 workflow registration 测试 5 个用例通过。
  - 已用 Kimi WebBridge 在 v2 `http://localhost:13004/v/admin/workflow/workflows/369436327477250` 打开 LLM 配置抽屉，对照确认 `LLM service`、`Model`、`Options` 折叠区出现且已有值与 v1 对齐。

#### W2.2 LLM messages 配置迁移

- 状态：已提交
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
  - 已新增 `WorkflowListCollapse` 公共组件，迁移 v1 `ListCollapse` 的空态、新增、删除、上下排序、折叠/展开能力，未引入 v1 client/Formily runtime。
  - 已新增原生 antd `Messages` 配置组件，`messages` 写入 `config.messages`，保持 server 实际读取结构：system/assistant 使用 `message`，user text 使用 `content[].content`，图片使用 `content[].image_url.url`。
  - 变量输入已按专项规则复用 workflow v2：system/assistant 和 user text 使用 `WorkflowVariableTextArea`，图片 URL/Base64 使用单行 `WorkflowVariableInput`，未新增 textarea 包装层。
  - 已用 Kimi WebBridge 在 v2 `http://localhost:13004/v/admin/workflow/workflows/369436327477250` 打开 LLM 配置抽屉，确认 Messages tab 显示已有 2 条消息，system/user 文本、嵌套 content、`Add prompt`、`Add content`、排序/删除按钮和变量按钮均可见，与 v1 基线对齐。
  - 已运行 `yarn eslint --fix` 覆盖触达文件。
  - 已运行 `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/workflow-list-collapse.test.ts --run --reporter=verbose`，2 个用例通过。
  - 已运行 `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/workflow-registration.test.ts --run --reporter=verbose`，5 个用例通过。

#### W2.3 LLM structured output 配置迁移

- 状态：已提交
- 范围：
  - `src/client-v2/workflow/nodes/llm/components/StructuredOutput.tsx`
- 完成标准：
  - `structuredOutput.schema` 使用 workflow v2 `WorkflowVariableJsonTextArea`。
  - `name`、`description`、`strict` 使用 antd 原生组件。
  - 值结构与 v1 保持一致。
- UI 对照：
  - 对照 JSON Schema、Name、Description、Strict 字段。
- 验收记录：
  - 已新增原生 antd `StructuredOutput` 组件，`schema`、`name`、`description`、`strict` 写入 `config.structuredOutput.*`，保持 v1/server 值结构。
  - `structuredOutput.schema` 已按专项规则复用 workflow v2 `WorkflowVariableJsonTextArea`，开启 `json5` 与 `autoSize.minRows = 10`，未新增 JSON 变量输入包装层。
  - `Name` 使用 antd `Input`，`Description` 使用 antd `Input.TextArea`，`Strict` 使用 antd `Checkbox`，并保留 `Syntax references: JSON Schema` 帮助链接。
  - LLM `Tabs` 已对 `Messages` 和 `Structured output` 设置 `forceRender`，避免同一个 antd Form 下未访问 tab 字段提交丢失。
  - 已运行 `yarn eslint --fix` 覆盖触达文件。
  - 已运行 `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/workflow-registration.test.ts --run --reporter=verbose`，5 个用例通过。
  - 已运行 `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/workflow-list-collapse.test.ts --run --reporter=verbose`，2 个用例通过。
  - 已用 Kimi WebBridge 在 v2 `http://localhost:13004/v/admin/workflow/workflows/369436327477250` 打开 LLM 配置抽屉并切到 `Structured output`，确认 JSON Schema、变量按钮、帮助链接、Name、Description、Strict 与 v1 基线对齐，已有 schema 正确回显。

#### W2.4 LLM 节点测试与提交

- 状态：已提交
- 范围：
  - LLM 节点相关测试
  - 本 PRD 状态更新
- 完成标准：
  - loader 测试通过。
  - 表单初始值、提交值结构测试通过。
  - `yarn eslint --fix` 已运行在触达文件上。
  - 必要 UI 对照通过。
- 验收记录：
  - 已新增 `workflow-llm-fieldset.test.tsx`，覆盖 LLM `FieldsetLoader` lazy loader 指向 v2 `LLMFieldset`。
  - 已覆盖 `Messages` 与 `StructuredOutput` 在同一个 antd Form 中提交时的值结构，确认 `messages` 和 `structuredOutput` 都保留在 `config` 下。
  - 测试中发现 `Messages` 仅 `setFieldValue` 未注册字段会导致 `NodeConfigDrawer` 的 `form.validateFields()` 丢失 `config.messages`；已新增不渲染 UI 的 `Form.Item name={['config', 'messages']}` 注册项修复。
  - 已运行 `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client-v2/workflow/nodes/llm/components/Messages.tsx packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/workflow-llm-fieldset.test.tsx`。
  - 已运行 `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/workflow-llm-fieldset.test.tsx --run --reporter=verbose`，2 个用例通过。
  - 已运行 `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/workflow-list-collapse.test.ts --run --reporter=verbose`，2 个用例通过。
  - 已运行 `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/workflow-registration.test.ts --run --reporter=verbose`，5 个用例通过。
  - 已扫描 `src/client-v2/workflow`，未发现 `@nocobase/client`、`@formily/*` runtime、`@nocobase/plugin-workflow/client` 或本插件 `src/client/` import。

### W3. AI employee workflow 节点迁移

状态：进行中

目标：把 v1 `workflow/nodes/employee` 迁到 v2，保留配置结构并改为 antd。

#### W3.1 AI employee 基础配置迁移

- 状态：已提交
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
  - 已新增 v2 `AIEmployeeSelect`，基于 antd `Dropdown`/`Popover`，复用 `AIEmployeeProfileCard` 与 `avatars`，不再依赖 Formily 或 v1 `AIEmployeeSelect`。
  - 已将 `AIEmployeeFieldset` 改为原生 antd `Tabs`，保留 `Task` 与 `Feedback & Notification` 两个 tab，并设置 `forceRender`。
  - `Task` tab 已注册 `config.username`，默认值为 `atlas`；选择员工时同步清空 `config.skillSettings.skills` 和 `config.skillSettings.tools`，保留 v1 切换行为。
  - 已运行 `yarn eslint --fix` 覆盖触达文件。
  - 已运行 `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/workflow-registration.test.ts --run --reporter=verbose`，5 个用例通过。
  - 已用 Kimi WebBridge 在 v2 `http://localhost:13004/v/admin/workflow/workflows/356950351282176` 打开 AI employee 节点配置抽屉，确认 `Task`/`Feedback & Notification` tabs、`AI employee` 必填项、默认 `Atlas`、头像、下拉箭头可见。
  - 已触发员工选择下拉，确认列表显示头像、昵称、职位和当前 `Atlas` 勾选状态。
  - 已扫描 `src/client-v2/workflow/nodes/employee`，未发现 `@nocobase/client`、`@formily/*` runtime、`@nocobase/plugin-workflow/client` 或本插件 `src/client/` import。

#### W3.2 模型、操作者、消息、附件配置迁移

- 状态：已提交
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
  - 已新增 v2 `ModelOptions`，复用 `getAIEmployeeModels` / `getAllModels` 按当前员工过滤可用模型，值结构保持 `config.model = { llmService, model }`，空值表示使用默认模型。
  - 已新增 v2 `UserInput`，保留远程用户选择与 workflow 单行变量输入能力，值写入 `config.userId`。
  - 已新增 v2 `MessageInputs`，`Background` 与 `Default user message` 均复用 workflow v2 `WorkflowVariableTextArea`，保持真实多行变量输入和值路径 `config.message.system/user`。
  - 已新增 v2 `FileInputs`，复用 `WorkflowListCollapse` 管理 `config.files[]`，支持 attachment / files collection / URL 三种类型；`files[].value` 复用 workflow v2 单行 `WorkflowVariableInput`。
  - 已抽出 `FormValueRegistry` 公共组件，用于数组字段在 antd `validateFields()` 中注册值，避免手动 list 字段提交丢失；LLM `Messages` 已改为复用该公共组件。
  - v2 当前无可直接复用的 `DataSourceCollectionCascader` 原生实现；`file_id` 的 collection 选择改为从 v2 `dataSourceManager` 读取 main 数据源中 template 为 `file` 的集合，并仍保存 collection name。
  - 已运行 `yarn eslint --fix` 覆盖触达文件。
  - 已运行 `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/workflow-registration.test.ts --run --reporter=verbose`，5 个用例通过。
  - 已运行 `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/workflow-llm-fieldset.test.tsx --run --reporter=verbose`，2 个用例通过。
  - 已用 Kimi WebBridge 在 v2 `http://localhost:13004/v/admin/workflow/workflows/356950351282176` 打开 AI employee 节点配置抽屉，确认 Model、Operator、Background、Default user message、Attachments 空态和已有消息值正确显示；该 workflow 已执行，新增附件按钮按只读表单不执行修改，与 v1 只读基线一致。
  - 已扫描 `src/client-v2/workflow`，未发现 `@nocobase/client`、`@formily/*` runtime、`@nocobase/plugin-workflow/client` 或本插件 `src/client/` import。

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
| W0. 迁移任务文档与基线准备 | 已提交 | 开始 W1.1 |
| W1. workflow v2 注册骨架与共享类型 | 已提交 | 开始 W2.1 |
| W2. LLM workflow 节点迁移 | 已提交 | 开始 W3.1 |
| W3. AI employee workflow 节点迁移 | 进行中 | 开始 W3.3 |
| W4. AI employee workflow trigger 迁移 | 未开始 | 等 W1 完成 |
| W5. v1 兼容入口收敛 | 未开始 | 等 W2/W3/W4 校验通过 |
| W6. 总体验收、清理和最终提交 | 未开始 | 等 W5 完成 |
