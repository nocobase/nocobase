# Approval Surface Design

## Goal

在 `flowSurfaces` 现有 API 体系内，直接支持审批相关 UI 搭建能力，不新增独立 resource，也不引入 approval provider / extensibility。

这里的审批界面不是普通页面搭建，而是工作流审批节点的配置界面。它的 FlowModel、可放置区块、可添加动作、字段包装器，都和普通 page surface 不同，因此实现放在 `flow-surfaces/approval/` 子目录，并由 `flowSurfaces` 主服务按语义 use 接入。

## 为什么不单独开 API

- 审批界面仍然是 FlowModel tree，只是模型集合不同。
- `flowSurfaces` 已经负责 target 定位、树结构持久化、catalog 发现、compose/addBlock/addField/addAction/updateSettings 等通用写入流程。
- 需要变化的是:
  - catalog 可见项
  - parent/grid/wrapper/action container 推导
  - 默认子树生成
  - configure/options/contract 语义映射

因此更合理的做法是在 `flowSurfaces` 内扩展 approval-specific action/block/field semantics，而不是再复制一套审批专用 API。

## 目录职责

- `semantic-use.ts`
  - approval use 与 core semantic use 的别名映射
  - approval page/tab/block 默认 grid use
  - approval field wrapper 推导
- `catalog-specs.ts`
  - approval blocks / actions 的公共 catalog 定义
  - owner plugin 映射
- `builder.ts`
  - approval block/action/field 的默认子树
  - `PatternFormFieldModel` 专用构建逻辑
- `blueprint-service.ts`
  - `flowSurfaces:applyApprovalBlueprint` 的 binding/root/orchestration
- `runtime-config.ts`
  - approval 动作 singleton 校验
  - approval workflow / node runtime config 同步

## 当前公开能力

### Approval blocks

- `approvalInitiator` -> `ApplyFormModel`
  - 只允许放在 `TriggerBlockGridModel`
  - 默认带一个 `ApplyFormSubmitModel`
- `approvalApprover` -> `ProcessFormModel`
  - 只允许放在 `ApprovalBlockGridModel`
- `approvalInformation` -> `ApprovalDetailsModel`
  - 只允许放在 `ApprovalBlockGridModel`

### Page-like generic blocks

- `TriggerBlockGridModel` / `ApprovalBlockGridModel`
  - 继续承载 approval-specific blocks
  - 同时允许当前前端审批 UI 已公开支持、且普通 block catalog 也能落地的固定 generic blocks:
    - `markdown`
    - `jsBlock`
  - `applyApprovalBlueprint` 的 page-like `blocks[]` 允许沿用普通 `compose/addBlock` 的 `template: { uid, mode }` 语义
  - block 合法性以下游 `catalog` / `addBlock` / `compose` 判定为准，而不是再维护一份 approval blueprint 静态白名单
- task-card surface 仍然不公开 block authoring，继续保持 `fields + layout`

### Approval actions

- `approvalSubmit`
- `approvalSaveDraft`
- `approvalWithdraw`
- `approvalApprove`
- `approvalReject`
- `approvalReturn`
- `approvalDelegate`
- `approvalAddAssignee`
- 高层 `configure` 语义:
  - `approvalSubmit` / `approvalSaveDraft`: `confirm`、`assignValues`
  - `approvalWithdraw`: `confirm`
  - `approvalApprove` / `approvalReject`: `commentFormUid`
  - `approvalReturn`: `commentFormUid`、`approvalReturn`
  - `approvalDelegate` / `approvalAddAssignee`: `assigneesScope`

### Approval field wrappers

- `PatternFormItemModel`
- `ApprovalDetailsItemModel`
- `ApplyTaskCardDetailsItemModel`
- `ApprovalTaskCardDetailsItemModel`

### Approval relation fieldComponent switching

- `PatternFormItemModel`
  - 单值关系字段: `RecordSelectFieldModel` / `RecordPickerFieldModel` / `SubFormFieldModel`
  - 多值关系字段: `RecordSelectFieldModel` / `RecordPickerFieldModel` / `SubFormListFieldModel` / `PatternSubTableFieldModel`
  - 指向 file collection 时，继续保留推导出的默认 binding use，不公开 nested subform / subtable 切换
- `ApprovalDetailsItemModel` / `ApplyTaskCardDetailsItemModel` / `ApprovalTaskCardDetailsItemModel`
  - 单值关系字段: `DisplayTextFieldModel` / `DisplaySubItemFieldModel`
  - 多值关系字段: `DisplayTextFieldModel` / `DisplaySubListFieldModel` / `DisplaySubTableFieldModel`
- `catalog.node.configureOptions.fieldComponent.enum` 会按当前 wrapper use 与真实字段 interface 动态收窄，`configure(fieldComponent)` 也按同一套 truth source 校验

## 关键约束

- approval blocks 不应出现在普通 page/block grid 的 catalog 中。
- `TriggerBlockGridModel` / `ApprovalBlockGridModel` 是 approval page-like block container:
  - 可以承载 approval blocks
  - 也可以承载当前已公开支持的固定 generic blocks `markdown` / `jsBlock`
  - 当前阶段仍不承诺开放完整 generic block catalog，也不包含 workflow / node dynamic data blocks
- `ApplyTaskCardDetailsModel` / `ApprovalTaskCardDetailsModel` 仍是 block-forbidden surface，不接受 block blueprint，也不接受 incremental `addBlock`
- approval actions 只应出现在各自 block 的 action 容器中。
- approval singleton actions 在当前表单已经存在时，不应继续出现在 catalog 中。
- `PatternFormItemModel` 下的 inner field 必须持久化为 `PatternFormFieldModel`，并把真实字段 use 记录到 `stepParams.fieldBinding.use`。
- approval relation `fieldComponent` 的公开切换范围必须跟随真实字段 interface 与 wrapper use 动态收窄，不能再靠静态全局枚举推断。
- approval details / task-card details 复用 details 语义，但保留自己的 wrapper use，以便 client 侧继续走审批专属的模型逻辑。

## 对外 API 策略

继续使用:

- `flowSurfaces:applyApprovalBlueprint`
- `flowSurfaces:catalog`
- `flowSurfaces:addBlock`
- `flowSurfaces:addField`
- `flowSurfaces:addAction`
- `flowSurfaces:compose`
- `flowSurfaces:configure`

approval 相关差异通过 `target` 所在的 approval surface 与 catalog key / use 来表达，而不是通过新 endpoint 表达。

其中 `flowSurfaces:applyApprovalBlueprint` 是 approval surface 的薄 orchestration 层:

- 自动解析 workflow / node 绑定
- 自动创建或复用 approval root FlowModel
- 自动回写 `approvalUid` / `taskCardUid`
- page-like surface 复用 `compose(..., mode: "replace")`，并沿用普通 flowSurfaces block legality 检查
- task-card surface 复用 `addField + setLayout`

## 关联文档

- [FlowModel plan](./flow-model-plan.md)
