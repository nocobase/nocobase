# FlowActionRegistry

`FlowActionRegistry` 负责 Flow 引擎中 Action 的注册与查询。包含两级注册表：
- 全局级：`EngineActionRegistry`（挂在 `FlowEngine` 上，所有模型共享）
- 模型类级：`ModelActionRegistry`（挂在 `FlowModel` 类上，仅该类及其子类可见，支持继承与覆盖）

两者共享抽象基类 `BaseActionRegistry` 的注册逻辑：统一的去重提示、批量注册与查询接口。

---

## BaseActionRegistry

- 重复注册：相同 `name` 会 `console.warn` 并覆盖
- 方法：
  - `registerAction(def)`：注册单个 Action（必需 `def.name`）
  - `registerActions(defs)`：批量注册
  - `getAction(name)`：获取单个 Action
  - `getActions()`：获取所有 Action

---

## EngineActionRegistry（全局）

- 作用域：`FlowEngine` 维度，全局共享
- 读取：`getAction(name)`、`getActions()`
- 集成：`FlowEngine` 提供便捷方法委托到该注册表
  - `flowEngine.registerActions({...})`
  - `flowEngine.getAction(name)` / `flowEngine.getActions()`

示例：
```ts
const engine = new FlowEngine();
engine.registerActions({
  sayHello: {
    name: 'sayHello',
    async handler(ctx, params) {
      console.log('Hello', params?.name);
    },
  },
});

// 读取
const action = engine.getAction('sayHello');
await action?.handler(engine.context, { name: 'NocoBase' });
```

---

## ModelActionRegistry（FlowModel类级）

- 作用域：某个 `FlowModel` 子类的类级注册表，只对该类及其子类可用
- 继承：子类可见父类动作；同名 `name` 子类覆盖父类
- 缓存：合并查询带缓存，父类或本类新增动作后自动失效重建
- 读取顺序：
  - `model.getAction(name)`：优先类级，其次全局
  - `model.getActions()`：合并全局与类级，类级覆盖全局同名
- 注册 API：
  - `FlowModel.registerAction(def)`
  - `FlowModel.registerActions({...})`

示例（继承 + 覆盖 + 与全局合并）：
```ts
const engine = new FlowEngine();

class Base extends FlowModel {}
class Sub extends Base {}
engine.registerModels({ Base, Sub });

// 全局动作
engine.registerActions({
  globalOnly: { name: 'globalOnly', handler: async () => {} },
  dup: { name: 'dup', handler: async () => 'global' },
});

// 父类动作
Base.registerAction({ name: 'baseOnly', handler: async () => {} });
Base.registerAction({ name: 'dup', handler: async () => 'base' });

// 子类动作（覆盖父类同名）
Sub.registerAction({ name: 'dup', handler: async () => 'sub' });

const base = engine.createModel<Base>({ use: 'Base' });
const sub = engine.createModel<Sub>({ use: 'Sub' });

// base 合并：包含 globalOnly + baseOnly；dup 指向 base 版本
const baseActions = base.getActions();
console.log(baseActions.has('globalOnly')); // true
console.log(base.getAction('dup')?.handler !== undefined); // 来自 Base（覆盖全局）

// sub 合并：包含 globalOnly + baseOnly + 子类覆盖 dup
console.log(sub.getAction('dup')?.handler && (await sub.getAction('dup')!.handler(null as any, null))); // 'sub'
```

---

## 常见行为与注意

- 重复注册：相同 `name` 会告警并覆盖（全局与类级相同）
- 合并优先级：模型类级 > 全局；子类 > 父类
- 类级变更向下可见：祖先类新增动作后，后续查询会包含该动作（测试覆盖）
- 子类变更不回流：子类注册的动作不会出现在父类查询结果中

---

## 与 FlowDefinition 的关系

- Flow 步骤可通过 `use: 'actionName'` 引用动作；运行时解析顺序与上文一致：
  - 先查模型类级动作；未命中再查全局动作
