# FlowAction

`FlowAction` 是 NocoBase 流程引擎中用于定义和注册流程步骤可复用操作（Action）的核心对象。每个操作（Action）封装一段可执行的业务逻辑，可以在多个流程步骤中复用，支持参数配置、UI 配置和类型推断。

---

## ActionDefinition 接口

```ts
interface ActionDefinition {
  name: string; // 操作唯一标识，必须唯一
  title?: string; // 操作显示名称（可选）
  uiSchema?: Record<string, ISchema>; // （可选）用于参数配置界面渲染
  defaultParams?: Record<string, any>; // （可选）默认参数
  handler: (ctx: FlowContext, model: TModel, params: any) => Promise<any> | any; // 操作执行逻辑
}
```

---

## 定义操作的方式

### 1. 使用 defineAction 工具函数

推荐方式，结构清晰、类型推断友好：

```ts
const myAction = defineAction({
  name: 'actionName',
  title: '操作显示名称',
  uiSchema: {},
  defaultParams: {},
  async handler(ctx, model, params) {
    // 操作逻辑
  },
});
```

### 2. 继承 FlowAction 类

适合需要扩展属性或方法的场景：

```ts
class MyAction extends FlowAction {
  name = 'actionName';
  title = '操作显示名称';
  uiSchema = {};
  defaultParams = {};
  async handler(ctx, model, params) {
    // 操作逻辑
  }
}
```

---

## 注册操作

注册后可在流程步骤中通过 `use` 字段复用：

```ts
flowEngine.registerAction({
  name: 'actionName',
  title: '操作显示名称',
  uiSchema: {},
  defaultParams: {},
  handler(ctx, model, params) {
    // 操作逻辑
  },
});

flowEngine.registerAction(myAction);           // 注册 defineAction 返回的对象
flowEngine.registerAction(new MyAction());     // 注册类实例
```

---

## 在流程中复用操作

在流程步骤定义中通过 `use` 字段引用已注册的操作：

```ts
steps: {
  step1: {
    use: 'actionName', // 复用已注册的操作
    defaultParams: {},
  },
}
```

---

## 总结

- **FlowAction** 让流程步骤逻辑高度复用，便于维护和扩展。
- 支持多种定义方式，适应不同复杂度的业务场景。
- 可通过 `uiSchema` 和 `defaultParams` 配置参数界面和默认值，提升易用性。
