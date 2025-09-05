# FlowEventRegistry

`FlowEventRegistry` 负责 Flow 引擎中 Event 的注册与查询。包含两级注册表：
- 全局级：`EngineEventRegistry`（挂在 `FlowEngine` 上，所有模型共享）
- 模型类级：`ModelEventRegistry`（挂在 `FlowModel` 类上，仅该类及其子类可见，支持继承与覆盖）

---

## BaseEventRegistry

- 内部结构：`Map<string, EventDefinition>`
- 重复注册：相同 `name` 会 `console.warn` 并覆盖
- 方法：
  - `registerEvent(def)`：注册单个 Event（必需 `def.name`）
  - `registerEvents(defs)`：批量注册
  - `getEvent(name)`：获取单个 Event
  - `getEvents()`：获取所有 Event

---

## EngineEventRegistry（全局）

- 作用域：`FlowEngine` 维度，全局共享
- 读取：`getEvent(name)`、`getEvents()`
- 集成：`FlowEngine` 提供便捷方法委托到该注册表
  - `flowEngine.registerEvents({...})`
  - `flowEngine.getEvent(name)` / `flowEngine.getEvents()`

示例：
```ts
const engine = new FlowEngine();
engine.registerEvents({
  click: { name: 'click', label: 'Click' },
  submit: { name: 'submit', label: 'Submit' },
});

// 读取
const e = engine.getEvent('click');
console.log(e?.label); // 'Click'
```

---

## ModelEventRegistry（模型类级）

- 作用域：某个 `FlowModel` 子类的类级注册表，只对该类及其子类可用
- 继承：子类可见父类事件；同名 `name` 子类覆盖父类
- 缓存：合并查询带缓存，父类或本类新增事件后自动失效重建
- 读取顺序：
  - `model.getEvent(name)`：优先类级，其次全局
  - `model.getEvents()`：合并全局与类级，类级覆盖全局同名
- 注册 API：
  - `FlowModel.registerEvent(def)`
  - `FlowModel.registerEvents({...})`

示例（继承 + 覆盖 + 与全局合并）：
```ts
const engine = new FlowEngine();

class Base extends FlowModel {}
class Sub extends Base {}
engine.registerModels({ Base, Sub });

// 全局事件
engine.registerEvents({
  click: { name: 'click', label: 'Click' },
});

// 类级事件
Base.registerEvent({ name: 'openView', label: 'Open view' });
Sub.registerEvent({ name: 'click', label: 'Click (sub override)' });

const base = engine.createModel<Base>({ use: 'Base' });
const sub = engine.createModel<Sub>({ use: 'Sub' });

// base: 包含全局 click + 类级 openView；click 指向全局（若 Base 未覆盖）
console.log(base.getEvents().has('openView')); // true
console.log(base.getEvent('click')?.label); // 'Click'

// sub: 继承 Base 的 openView，且覆盖 click
console.log(sub.getEvent('click')?.label); // 'Click (sub override)'
```

---

## 与 FlowDefinition 的关系

- FlowDefinition 的触发条件 `on` 使用事件名；`model.dispatchEvent(eventName, payload)` 会根据当前模型可见的事件进行匹配与触发对应流

---

## 常见行为与注意

- 重复注册：相同 `name` 会告警并覆盖（全局与类级相同）
- 合并优先级：模型类级 > 全局；子类 > 父类
- 类级变更向下可见：祖先类新增事件后，后续查询会包含该事件
- 子类变更不回流：子类注册的事件不会出现在父类查询结果中
