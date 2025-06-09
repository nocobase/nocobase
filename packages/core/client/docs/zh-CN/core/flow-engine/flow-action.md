# FlowAction

`FlowAction` 是 NocoBase 流引擎中用于定义和注册流步骤可复用操作（Action）的核心对象。每个操作（Action）封装一段可执行的业务逻辑，可以在多个流步骤中复用，支持参数配置、UI 配置和类型推断。

---

## ActionDefinition 接口

```ts
interface ActionDefinition {
  name: string; // 操作唯一标识，必须唯一
  title?: string; // 操作显示名称（可选）
  uiSchema?: Record<string, ISchema>; // （可选）用于参数配置界面渲染
  defaultParams?: Record<string, any>; // （可选）默认参数
  paramsRequired?: boolean; // （可选）是否需要参数配置，为true时添加模型前会打开配置对话框
  hideInSettings?: boolean; // （可选）是否在设置菜单中隐藏该步骤
  handler: (ctx: FlowContext, params: any) => Promise<any> | any; // 操作执行逻辑
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
  paramsRequired: true, // 添加模型前强制打开配置对话框
  hideInSettings: false, // 在设置菜单中显示
  async handler(ctx, params) {
    // 操作逻辑
  },
});
```

### 2. 实现 ActionDefinition 接口

适合需要扩展属性或方法的场景：

```ts
class MyAction implements ActionDefinition {
  name = 'actionName';
  title = '操作显示名称';
  uiSchema = {};
  defaultParams = {};
  paramsRequired = true; // 添加模型前强制打开配置对话框
  hideInSettings = false; // 在设置菜单中显示
  async handler(ctx, params) {
    // 操作逻辑
  }
}
```

---

## 注册操作

注册后可在流步骤中通过 `use` 字段复用：

```ts
flowEngine.registerAction({
  name: 'actionName',
  title: '操作显示名称',
  uiSchema: {},
  defaultParams: {},
  paramsRequired: true, // 添加模型前强制打开配置对话框
  hideInSettings: false, // 在设置菜单中显示
  handler(ctx, params) {
    // 操作逻辑
  },
});

flowEngine.registerAction(myAction);           // 注册 defineAction 返回的对象
flowEngine.registerAction(new MyAction());     // 注册类实例
```

---

## 在流中复用操作

在流步骤定义中通过 `use` 字段引用已注册的操作：

```ts
steps: {
  step1: {
    use: 'actionName', // 复用已注册的操作
    defaultParams: {},
    paramsRequired: true, // 可以在步骤级别覆盖操作的paramsRequired设置
    hideInSettings: false, // 可以在步骤级别覆盖操作的hideInSettings设置
  },
}
```

---

## 配置选项说明

### paramsRequired

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 当设置为 `true` 时，在添加该步骤模型前会强制打开参数配置对话框，确保用户配置必要的参数。适用于需要用户必须配置参数才能正常工作的操作。

### hideInSettings

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 当设置为 `true` 时，该步骤将在设置菜单中隐藏，用户无法通过 Settings 界面直接添加该步骤。适用于初始化配置场景。

---

## 总结

- **FlowAction** 让流步骤逻辑高度复用，便于维护和扩展。
- 支持多种定义方式，适应不同复杂度的业务场景。
- 可通过 `uiSchema` 和 `defaultParams` 配置参数界面和默认值，提升易用性。
