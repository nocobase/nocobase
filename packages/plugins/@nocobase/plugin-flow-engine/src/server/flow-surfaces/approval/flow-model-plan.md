# Approval FlowModel Plan

## 1. Trigger Surface

审批发起页使用 trigger surface，目标树如下:

```text
TriggerChildPageModel
└── TriggerChildPageTabModel
    └── TriggerBlockGridModel
        └── ApplyFormModel
            ├── PatternFormGridModel
            │   └── PatternFormItemModel
            │       └── PatternFormFieldModel
            └── actions[]
                └── ApplyFormSubmitModel (default)
```

### 对应 API

- `addBlock(type: "approvalInitiator")`
- `addField(target: ApplyFormModel | PatternFormGridModel)`
- `addAction(target: ApplyFormModel, type: "approvalSubmit" | "approvalSaveDraft" | "approvalWithdraw")`
- `configure(target: ApplyFormModel | PatternFormItemModel | ApplyForm*ActionModel)`

补充说明:

- `ApplyFormModel` 默认只创建 `approvalSubmit`
- `approvalSaveDraft` / `approvalWithdraw` 通过后续 `addAction` 添加

## 2. Approval Surface

审批处理页使用 approval surface，目标树如下:

```text
ApprovalChildPageModel
└── ApprovalChildPageTabModel
    └── ApprovalBlockGridModel
        ├── ProcessFormModel
        │   ├── PatternFormGridModel
        │   │   └── PatternFormItemModel
        │   │       └── PatternFormFieldModel
        └── ApprovalDetailsModel
            └── ApprovalDetailsGridModel
                └── ApprovalDetailsItemModel
                    └── <details field model>
```

### 对应 API

- `addBlock(type: "approvalApprover")`
- `addBlock(type: "approvalInformation")`
- `addField(target: ProcessFormModel | PatternFormGridModel)`
- `addField(target: ApprovalDetailsModel | ApprovalDetailsGridModel)`
- `addAction(target: ProcessFormModel, type: "approvalApprove" | "approvalReject" | "approvalReturn" | "approvalDelegate" | "approvalAddAssignee")`

补充说明:

- `ProcessFormModel` 默认不自动创建 action
- 审批动作通过后续 `addAction` 添加

## 3. Task Card / Details Support

下列 use 暂不作为独立 block catalog 对外暴露，但需要在 server 侧被识别成 details surface，以支持:

- field menu 生成
- configure options
- field component rebuild
- reaction / title-field 同步

相关模型:

- `ApplyTaskCardDetailsModel`
- `ApprovalTaskCardDetailsModel`
- `ApplyTaskCardGridModel`
- `ApprovalTaskCardGridModel`
- `ApplyTaskCardDetailsItemModel`
- `ApprovalTaskCardDetailsItemModel`

## 4. 服务端接入点

approval surface 需要接入这些 server 入口:

- `catalog.ts`
  - approval blocks / actions 注册
  - owner plugin gating
  - field wrapper semantic 映射
- `surface-context.ts`
  - approval page/tab/block 的默认 grid 推导
  - approval form/details wrapper 推导
- `builder.ts`
  - approval block 默认 grid / actions
  - `PatternFormFieldModel` 树构建
- `service.ts`
  - approval form/details/wrapper use sets
  - configure field component / title field / field menu / record context
- `configure-options.ts`
  - approval page/tab/block/wrapper/action 的公共配置项

## 5. compose / direct-add 策略

approval surface 继续走 `flowSurfaces` 统一 direct-add / compose 语义:

- `catalog` 负责只在合法容器暴露 approval block keys
- `addBlock` 在解析出 parent grid use 后再做 block placement 校验
- `compose` 在编排阶段只校验 key/type 语义，真正的容器校验放到实际 `addBlock` 时执行

## 6. 限制

- approval blocks 不支持放入普通 `BlockGridModel`
- approval actions 不支持放入普通 form block
- `PatternFormItemModel` 不能降级成普通 `FieldModel`
- 不新增 approval provider，不增加 flowSurfaces 新 resource

## 7. Blueprint 编排入口

新增 `flowSurfaces:applyApprovalBlueprint`，用于一次性初始化 approval root，并复用已有的 direct-add 语义:

- `surface: "initiator"` + `workflowId`
  - 自动创建 / 复用 `TriggerChildPageModel`
  - 回写 `workflow.config.approvalUid`
  - 以 `blocks + layout` 调用 page-like replace 编排
- `surface: "approver"` + `nodeId`
  - 自动创建 / 复用 `ApprovalChildPageModel`
  - 回写 `node.config.approvalUid`
  - 以 `blocks + layout` 调用 page-like replace 编排
- `surface: "taskCard"` + `workflowId | nodeId`
  - workflow 侧绑定 `ApplyTaskCardDetailsModel`
  - node 侧绑定 `ApprovalTaskCardDetailsModel`
  - 回写对应的 `taskCardUid`
  - 以 `fields + layout` 调用 details-grid replace 编排
