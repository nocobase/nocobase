# Action Registry 系统

Action Registry 是 NocoBase Flow Engine 的动作管理系统，提供了两层动作注册和查找机制。

## 两层架构

1. **EngineActionRegistry** - 全局 action 注册表
   - 通过 `flowEngine.registerActions()` 注册
   - 所有 FlowModel 实例都可以访问

2. **ModelActionRegistry** - 模型类级 action 注册表  
   - 通过 `ModelClass.registerActions()` 注册
   - 支持继承：子类可以访问父类的 action
   - 子类可以覆盖父类的同名 action

## Action 查找优先级

当流的步骤使用 `use: 'actionName'` 时：
1. 首先查找类级别的 action（ModelActionRegistry）
   - 当前类的 action
   - 如果未找到，递归查找父类的 action
2. 如果类级别（包含父类链）都未找到，查找全局 action（EngineActionRegistry）

## 注册方式

### 统一的 `registerActions` API

- **全局注册**：`flowEngine.registerActions(actions)`
- **类级别注册**：`ModelClass.registerActions(actions)`

两种方式使用相同的方法名和参数格式，保持 API 的一致性。

---

## 示例

### 基础用法

<code src="./demos/basic.tsx"></code>

### 全局与类级别 action

展示全局 action 和类级别 action 的注册与使用：

<code src="./demos/global-and-class-actions.tsx"></code>

## API 使用示例

```ts
// 全局 action 注册
flowEngine.registerActions({
  globalAction: {
    name: 'globalAction',
    title: '全局动作',
    handler(ctx) {
      // 处理逻辑
    }
  }
});

// 类级别 action 注册
BaseModel.registerActions({
  classAction: {
    name: 'classAction', 
    title: '类动作',
    handler(ctx) {
      // 处理逻辑
    }
  }
});

// 在流中使用
model.registerFlow('myFlow', {
  steps: {
    step1: { use: 'globalAction' },
    step2: { use: 'classAction' }
  }
});
```