# Event Registry 系统

Event Registry 是 NocoBase Flow Engine 的事件管理系统，提供了两层事件注册和查找机制。

## 两层架构

1. **EngineEventRegistry** - 全局 event 注册表
   - 通过 `flowEngine.registerEvents()` 注册
   - 所有 FlowModel 实例都可以访问

2. **ModelEventRegistry** - 模型类级 event 注册表  
   - 通过 `ModelClass.registerEvents()` 注册
   - 支持继承：子类可以访问父类的 event
   - 子类可以覆盖父类的同名 event

## Event 查找优先级

当流需要查找事件时：
1. 首先查找类级别的 event（ModelEventRegistry）
   - 当前类的 event
   - 如果未找到，递归查找父类的 event
2. 如果类级别（包含父类链）都未找到，查找全局 event（EngineEventRegistry）

## 注册方式

### 统一的 `registerEvents` API

- **全局注册**：`flowEngine.registerEvents(events)`
- **类级别注册**：`ModelClass.registerEvents(events)`

两种方式使用相同的方法名和参数格式，保持 API 的一致性。

## Event Definition

事件定义包含以下属性：

```ts
interface EventDefinition {
  name: string;       // 事件名称（必需）
  label?: string;     // 事件标签
  title?: string;     // 事件标题
  description?: string; // 事件描述
}
```

---

## 示例

### 基础用法

<code src="./demos/basic.tsx"></code>

### 全局与类级别 event

展示全局 event 和类级别 event 的注册与使用：

<code src="./demos/global-and-class-events.tsx"></code>

## API 使用示例

```ts
// 全局 event 注册
flowEngine.registerEvents({
  globalEvent: {
    name: 'globalEvent',
    title: '全局事件',
    description: '所有模型都可以触发的事件'
  }
});

// 类级别 event 注册
BaseModel.registerEvents({
  classEvent: {
    name: 'classEvent', 
    title: '类事件',
    description: '仅此类及其子类可以触发的事件'
  }
});

// 单个事件注册
flowEngine.registerEvent({
  name: 'singleEvent',
  label: '单个事件'
});

// 获取事件
const event = flowEngine.getEvent('globalEvent');
const allEvents = flowEngine.getEvents();
```

## 继承机制

事件注册支持类继承机制：

```ts
class BaseModel extends FlowModel {}
class ChildModel extends BaseModel {}

// 父类注册事件
BaseModel.registerEvents({
  baseEvent: { name: 'baseEvent', title: '基础事件' }
});

// 子类注册事件
ChildModel.registerEvents({
  childEvent: { name: 'childEvent', title: '子类事件' }
});

// 子类可以访问父类的事件
const childInstance = new ChildModel();
// childInstance 可以使用 baseEvent 和 childEvent
```