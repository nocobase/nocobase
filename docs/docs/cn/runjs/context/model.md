# ctx.model

当前 RunJS 执行上下文所在的 `FlowModel` 实例，是 JSBlock、JSField、JSAction 等场景的默认入口。具体类型随上下文变化：可能是 `BlockModel`、`ActionModel`、`JSEditableFieldModel` 等子类。

## 适用场景

| 场景 | 说明 |
|------|------|
| **JSBlock** | `ctx.model` 即为当前区块模型，可访问 `resource`、`collection`、`setProps` 等 |
| **JSField / JSItem / JSColumn** | `ctx.model` 为字段模型，可访问 `setProps`、`dispatchEvent` 等 |
| **操作事件 / ActionModel** | `ctx.model` 为操作模型，可读写步骤参数、派发事件等 |

> 提示：若需访问**承载当前 JS 的父区块**（如表单/表格区块），使用 `ctx.blockModel`；若需访问**其他模型**，使用 `ctx.getModel(uid)`。

## 类型定义

```ts
model: FlowModel;
```

`FlowModel` 为基类，实际运行时为各种子类（如 `BlockModel`、`FormBlockModel`、`TableBlockModel`、`JSEditableFieldModel`、`ActionModel` 等），可用属性和方法因类型而异。

## 常用属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `uid` | `string` | 模型唯一标识，可用于 `ctx.getModel(uid)` 或弹窗 UID 绑定 |
| `collection` | `Collection` | 当前模型绑定的数据表（区块/字段绑定数据时存在） |
| `resource` | `Resource` | 关联的资源实例，用于刷新、获取选中行等 |
| `props` | `object` | 模型 UI/行为配置，可用 `setProps` 更新 |
| `subModels` | `Record<string, FlowModel>` | 子模型集合（如表单内字段、表格内列） |
| `parent` | `FlowModel` | 父模型（若有） |

## 常用方法

| 方法 | 说明 |
|------|------|
| `setProps(partialProps: any): void` | 更新模型配置，触发重新渲染（如 `ctx.model.setProps({ loading: true })`） |
| `dispatchEvent(eventName: string, payload?: any, options?: any): Promise<any[]>` | 向模型派发事件，触发该模型上配置的、监听该事件名的流程。可选 `payload` 传给流程 handler；`options.debounce` 可开启防抖 |
| `getStepParams?.(flowKey, stepKey)` | 读取配置流步骤参数（设置面板、自定义操作等场景） |
| `setStepParams?.(flowKey, stepKey, params)` | 写入配置流步骤参数 |

## 与 ctx.blockModel、ctx.getModel 的关系

| 需求 | 推荐用法 |
|------|----------|
| **当前执行上下文所在模型** | `ctx.model` |
| **当前 JS 所在的父区块** | `ctx.blockModel`，常用于访问 `resource`、`form`、`collection` |
| **按 uid 获取任意模型** | `ctx.getModel(uid)` 或 `ctx.getModel(uid, true)`（跨视图栈查找） |

在 JSField 中，`ctx.model` 为字段模型，`ctx.blockModel` 为承载该字段的表单/表格区块。

## 示例

### 更新区块/操作状态

```ts
ctx.model.setProps({ loading: true });
await doSomething();
ctx.model.setProps({ loading: false });
```

### 派发模型事件

```ts
// 派发事件，触发该模型上配置的、监听该事件名的流程
await ctx.model.dispatchEvent('remove');
// 带 payload 时，会传给流程 handler 的 ctx.inputArgs
await ctx.model.dispatchEvent('customEvent', { id: 123 });
```

### 使用 uid 绑定弹窗或跨模型访问

```ts
const myUid = ctx.model.uid;
// 弹窗配置中可传入 openerUid: myUid，用于关联
const other = ctx.getModel('other-block-uid');
if (other) other.rerender?.();
```

## 相关

- [ctx.blockModel](./block-model.md)：当前 JS 所在的父区块模型
- [ctx.getModel()](./get-model.md)：按 uid 获取其他模型
