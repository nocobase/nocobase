# FlowRegistry 与 IFlowRepository

`FlowRegistry` 用于注册和管理 Flow（流程定义）。在运行时有两类注册表：
- 类级的 `GlobalFlowRegistry`（静态/全局流，挂在 `FlowModel` 类上，所有实例共享，支持继承）；
- 实例级的 `InstanceFlowRegistry`（动态/实例流，挂在 `model.flowRegistry` 上，仅当前实例可见，可持久化）。

---

## IFlowRepository 接口

```ts
interface IFlowRepository {
  addFlows(defs: Record<string, Omit<FlowDefinitionOptions, 'key'>>): void; // 批量新增流
  addFlow(key: string, def: Omit<FlowDefinitionOptions, 'key'>): FlowDefinition; // 新增或覆盖流
  removeFlow(key: string): void; // 从当前注册表移除（仅影响实例注册表）
  getFlows(): Map<string, FlowDefinition>; // 获取当前注册表内所有流
  mapFlows<T>(fn: (flow: FlowDefinition) => T): T[]; // 便利方法：对所有流做 map
  hasFlow(key: string): boolean; // 是否存在
  getFlow(key: string): FlowDefinition | undefined; // 获取单个流
  saveFlow(flow: FlowDefinition): Promise<any> | void; // 持久化当前流（由子类实现）
  destroyFlow(key: string): Promise<any> | void; // 销毁并持久化（由子类实现）
  moveStep(flowKey: string, sourceStepKey: string, targetStepKey: string): Promise<any> | void; // 重新排序步骤
}
```

与之配合的 `FlowDefinition` 会将 `save()`、`destroy()`、`addStep()`、`removeStep()`、`moveStep()` 等操作委托给注册表对应的方法，实现统一的更改与持久化入口。

---

## GlobalFlowRegistry（类级）

- 挂载位置：`FlowModel.globalFlowRegistry`；通过 `FlowModel.registerFlow(...)` 写入。
- 继承行为：子类可读取父类已注册的静态流；子类注册同名 `key` 时覆盖父类定义。
- 读取方法：`getFlow(key)`、`getFlows()` 会在本类未命中时回退到父类注册表；`getFlows()` 会合并父类条目（不覆盖子类同名）。
- 持久化：`saveFlow()`/`destroyFlow()` 为 no-op（静态流无远端持久化）。
- 删除：`removeFlow()` 仅发出警告，不实际移除（静态流并非实例级数据）。

---

## InstanceFlowRegistry（实例级）

- 挂载位置：`model.flowRegistry`；也可通过 `model.registerFlow(...)` 写入。
- 持久化：`saveFlow()`、`destroyFlow()`、`moveStep()` 内部调用 `model.save()`，用于同步到后端仓库（由 `IFlowModelRepository` 具体实现）。
- 增删改查：支持 `addFlow`/`addFlows`、`removeFlow`、`getFlow`/`getFlows`、`mapFlows`、`hasFlow` 等。
- 步骤排序：`moveStep(flowKey, source, target)` 按整数 1、2、3... 重排 `sort`，并持久化。

---

## 类级与实例级合并规则

`model.getFlows()` 会将两侧合并：
- 实例级优先：同名 `key` 时，实例流覆盖静态流；
- 继承可见：静态流支持父类 → 子类的可见链；
- 事件触发：`model.dispatchEvent(eventName, payload)` 会触发匹配该事件的静态与实例流；若存在实例对同名静态流的覆盖，则仅执行实例版本。

---

## 常用用法

### 1) 注册静态（类级）流

```ts
class MyModel extends FlowModel {}

MyModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  on: { eventName: 'click' },
  steps: {
    s1: { title: 'S1', handler: async (ctx) => {/* ... */} },
  },
});
```

### 2) 注册实例（实例级）流

```ts
const engine = new FlowEngine();
engine.registerModels({ MyModel });
const model = engine.createModel({ use: 'MyModel' });

model.registerFlow('localFlow', {
  title: 'Local flow',
  steps: {
    a: { title: 'A' },
    b: { title: 'B' },
  },
});

// 修改 & 持久化
const flow = model.getFlow('localFlow');
flow.title = 'Edited';
await flow.save();      // 触发 model.save()
await flow.destroy();   // 从实例注册表移除并持久化
```

### 3) 合并与优先级

```ts
// 静态同名
MyModel.registerFlow({ key: 'dup', title: 'Static DUP', steps: {} });
// 实例同名覆盖
model.flowRegistry.addFlow('dup', { title: 'Instance DUP', steps: {} });

const all = model.getFlows();
// keys: ['dup', '...']，且 'dup' 指向实例定义
```

### 4) 事件触发

```ts
MyModel.registerFlow({ key: 'staticEvent', on: { eventName: 'click' }, steps: { s: { handler: async () => {} } } });
model.flowRegistry.addFlow('instEvent', { on: { eventName: 'click' }, steps: { i: { handler: async () => {} } } });

await model.dispatchEvent('click', { foo: 'bar' }); // 同时触发静态与实例（若无同名覆盖）
```

### 5) 移动步骤并重排 sort

```ts
model.flowRegistry.addFlow('reorder', {
  title: 'Reorder',
  steps: { a: { title: 'A' }, b: { title: 'B' }, c: { title: 'C' } },
});
await model.flowRegistry.moveStep('reorder', 'c', 'b');
// 新顺序：a(1), c(2), b(3)；并触发 model.save()
```

---

## 与其它模块的关系

- `FlowDefinition`：单个流程的定义与步骤增删改，内部把保存/销毁委托给注册表；参见 `flow-definition.md`。
- `FlowModel`：实例持有 `InstanceFlowRegistry`；类持有 `GlobalFlowRegistry`；参见 `flow-model.md`。
- `IFlowModelRepository`：`InstanceFlowRegistry` 的持久化最终由模型仓库实现；参见 `flow-model-repository.md`。

---

## 边界与注意

- 静态流不能被真正删除：`GlobalFlowRegistry.removeFlow` 会告警并忽略。
- 步骤 `sort` 会保持为递增整数；移动步骤会整体重排以保证顺序整洁。
- `mapFlows`/`mapSteps` 提供便利遍历，不改变注册表内容。

