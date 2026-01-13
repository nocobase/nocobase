# scheduleModelOperation

`scheduleModelOperation` 用于在 **目标模型** 达到某个生命周期/事件锚点时，执行一段“只执行一次”的操作（回调）。

它是事件流（Event flow）“执行时机（when/phase）”能力的底层机制：事件分发过程中会持续 `emit` 各类锚点事件，调度器在命中锚点时触发回调，从而实现 **把一个函数/流程插入到另一段事件执行链的指定位置**。

它既可用于 **类级注册的 flow**，也可用于 **实例级注册的 flow** 的插入与顺序控制。

## API

### FlowModel.scheduleModelOperation

```ts
model.scheduleModelOperation(
  toUid: string,
  fn: (model: FlowModel) => Promise<void> | void,
  options?: { when?: ScheduleWhen },
): () => boolean;
```

### FlowEngine.scheduleModelOperation

```ts
engine.scheduleModelOperation(
  fromModelOrUid: FlowModel | string,
  toUid: string,
  fn: (model: FlowModel) => Promise<void> | void,
  options?: { when?: ScheduleWhen },
): () => boolean;
```

二者行为一致：`FlowModel.scheduleModelOperation()` 只是对 `engine.scheduleModelOperation()` 的便捷封装（`fromUid` 会用当前 model.uid）。

## 参数说明

### `toUid`

目标模型 uid：当目标模型触发事件/生命周期时，调度器才会尝试执行回调。

### `fn(model)`

命中锚点后执行的回调函数：

- **只会执行一次**（执行后即自动取消该条调度）；
- 若回调抛错，会被捕获并写入 `engine.logger`，不会影响其它调度项。

### `options.when`

触发时机，支持：

```ts
type ScheduleWhen =
  | 'created'
  | 'mounted'
  | 'unmounted'
  | 'destroyed'
  // dispatchEvent 锚点（eventName / flow / step）
  | `event:${string}:start`
  | `event:${string}:end`
  | `event:${string}:error`
  | `event:${string}:flow:${string}:start`
  | `event:${string}:flow:${string}:end`
  | `event:${string}:flow:${string}:error`
  | `event:${string}:flow:${string}:step:${string}:start`
  | `event:${string}:flow:${string}:step:${string}:end`
  | `event:${string}:flow:${string}:step:${string}:error`
  | ((e: LifecycleEvent) => boolean);
```

补充语义：

- `when` 默认值为 `'created'`；
- 当 `when === 'created'` 且目标模型已存在时，会 **立即执行一次**；其它 `when` 不会立即执行，需要等待真实事件发生。

调度成功会返回 `cancel()`，用于手动取消（返回 `true/false` 表示是否取消成功）。

### `LifecycleEvent`（when 为函数时）

当 `when` 传入函数时，入参结构如下（常用字段）：

```ts
type LifecycleEvent = {
  type: string; // 例如：'event:go:flow:goFlow:step:step1:end'
  uid: string; // 目标 model uid
  model?: FlowModel;
  runId?: string;
  inputArgs?: Record<string, any>;
  result?: any;
  error?: any;
  flowKey?: string;
  stepKey?: string;
};
```

## `when` 支持的事件（锚点）

调度器通过监听 `engine.emitter` 上的 `model:*` / `model:event:*` 事件实现锚点触发。

### 1) 模型生命周期

- `created`：目标模型创建（特殊：目标已存在时也会立即执行一次）
- `mounted`：目标模型挂载到 ReactView
- `unmounted`：目标模型从 ReactView 卸载
- `destroyed`：目标模型销毁

### 2) 事件分发（dispatchEvent）锚点

当你调用 `model.dispatchEvent('<eventName>')` 时，会依次产生如下锚点：

- `event:<eventName>:start`
- `event:<eventName>:end`
- `event:<eventName>:error`（当事件分发失败时）

例如：`event:go:end`。

### 3) Flow（flow）边界锚点

当事件分发执行到某条 flow 时，会产生：

- `event:<eventName>:flow:<flowKey>:start`
- `event:<eventName>:flow:<flowKey>:end`
- `event:<eventName>:flow:<flowKey>:error`

例如：`event:go:flow:goFlow:start`。

> 说明：`event:*:flow:*` / `event:*:flow:*:step:*` 这类锚点只会在通过 `dispatchEvent()` 执行 flow 时触发；仅 `applyFlow()` 不会产生这类锚点。

### 4) Flow 步骤（step）边界锚点

当事件分发执行到某个 step 时，会产生：

- `event:<eventName>:flow:<flowKey>:step:<stepKey>:start`
- `event:<eventName>:flow:<flowKey>:step:<stepKey>:end`
- `event:<eventName>:flow:<flowKey>:step:<stepKey>:error`

例如：`event:go:flow:goFlow:step:step1:end`。

## 示例：在事件链中插入回调，并触发一个 Flow

下面示例用不同按钮，分别把一个回调插入到 `dispatchEvent('go')` 的不同锚点（对应事件流编辑器里的 `phase` 选项：`beforeAllFlows / afterAllFlows / beforeFlow / afterFlow / beforeStep / afterStep`），回调里直接弹出通知即可。

<code src="./basic.tsx"></code>
