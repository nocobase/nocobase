# FlowAction

`FlowAction` 是 NocoBase 流引擎中用于定义和注册流步骤可复用操作（Action）的核心对象。每个操作封装一段可执行的业务逻辑，可在多个流步骤中复用，并支持参数配置、UI 配置和类型推断。

---

## ActionDefinition 接口

```ts
interface ActionDefinition {
  name: string; // 操作唯一标识，必须唯一
  title?: string; // 操作显示名称（可选）
  uiSchema?: Record<string, ISchema>; // （可选）参数配置界面渲染
  defaultParams?: Record<string, any>; // （可选）默认参数
  paramsRequired?: boolean; // （可选）是否需要参数配置
  hideInSettings?: boolean; // （可选）是否在设置菜单中隐藏
  handler: (ctx: FlowContext, params: any) => Promise<any> | any; // 操作执行逻辑
}
```

---

## 使用说明

### 1. 定义 Action

#### 方式一：使用 defineAction 工具函数（推荐）

结构清晰，类型推断友好：

```ts
const myAction = defineAction({
  name: 'myAction',
  title: '操作显示名称',
  uiSchema: {},
  defaultParams: {},
  paramsRequired: true,
  hideInSettings: false,
  async handler(ctx, params) {
    // 操作逻辑
  },
});
```

#### 方式二：实现 ActionDefinition 接口

复杂场景时可以通过定义 Action 类来处理更复杂的操作

```ts
class MyAction implements ActionDefinition {
  name = 'myAction';
  title = '操作显示名称';
  uiSchema = {};
  defaultParams = {};
  paramsRequired = true;
  hideInSettings = false;
  async handler(ctx, params) {
    // 操作逻辑
  }
}
```

---

### 2. 注册到 FlowEngine 里

```ts
flowEngine.registerAction(myAction);           // 注册 defineAction 返回的对象
flowEngine.registerAction(new MyAction());     // 注册类实例
```

---

### 3. 在流中使用

在流步骤定义中通过 `use` 字段引用已注册的操作：

```ts
steps: {
  step1: {
    use: 'myAction', // 复用已注册的操作
    defaultParams: {},
    paramsRequired: true, // 可覆盖操作的 paramsRequired
    hideInSettings: false, // 可覆盖操作的 hideInSettings
  },
}
```

---

## 参数配置详解

### name

- **类型**: `string`
- **说明**: 操作唯一标识，必须全局唯一。建议使用有业务含义的英文名，便于维护和复用。

### title

- **类型**: `string`
- **说明**: 操作的显示名称，通常用于界面展示。支持多语言配置。

### defaultParams

- **类型**: `Record<string, any>` 或 `(ctx) => Record<string, any>`
- **说明**: 操作参数的默认值。支持静态对象或函数（可根据 context 动态生成）。
- **作用**: 作为 handler 的 params 默认值。

**静态用法：**
```ts
{
  defaultParams: { key1: 'val1' },
  async handler(ctx, params) {
    console.log(params.key1); // val1
  },
}
```

**动态用法：**
```ts
{
  defaultParams(ctx) {
    return { key1: 'val1' }
  },
  async handler(ctx, params) {
    console.log(params.key1); // val1
  },
}
```

### handler

- **类型**: `(ctx: FlowContext, params: any) => Promise<any> | any`
- **说明**: 操作的核心执行逻辑。支持异步和同步函数。`ctx` 提供当前流上下文，`params` 为参数对象。

### uiSchema

- **类型**: `Omit<FormilySchema, 'default'>`
- **说明**: 用于参数的可视化配置表单。推荐与 defaultParams 配合使用，提升用户体验。
- **注意**: uiSchema 不支持 default 参数，避免与 defaultParams 重复。

### paramsRequired

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 为 `true` 时，添加步骤前会强制打开参数配置对话框，确保用户配置必要参数。适用于参数必填的场景。

### hideInSettings

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 为 `true` 时，该步骤在设置菜单中隐藏，用户无法通过 Settings 界面直接添加。适用于初始化配置或内部步骤。

---

## 最佳实践

- 推荐优先使用 `defineAction` 工具函数定义操作，结构更清晰，类型推断更友好。
- `name` 字段建议采用有业务含义的英文名，避免重名。
- `uiSchema` 和 `defaultParams` 配合使用，提升参数配置体验。
- 对于需要用户强制配置参数的操作，设置 `paramsRequired: true`。
- 内部或自动化步骤可设置 `hideInSettings: true`，避免用户误操作。

---

## 常见问题与注意事项

- **Q: defaultParams 和 uiSchema 有什么区别？**  
> defaultParams 用于设置参数默认值，uiSchema 用于渲染参数配置表单。两者配合使用，互不冲突。
- **Q: uiSchema 为什么不支持 default？**  
> 1. 为避免与 defaultParams 重复，uiSchema 仅用于表单结构描述，不处理默认值；
> 2. 使用 defaultParams 处理可以有更好的 ts 类型提示；
> 3. uiSchema 的结构可能较为复杂，解析 uiSchema 来提取 default 值非常繁琐且容易出错，因此不建议在 uiSchema 中处理 default；

---

## 总结

- **FlowAction** 让流步骤逻辑高度复用，便于维护和扩展。
- 支持多种定义方式，适应不同复杂度的业务场景。
- 可通过 `uiSchema` 和 `defaultParams` 配置参数界面和默认值，提升易用性。
- 合理使用 `paramsRequired` 和 `hideInSettings`，提升操作安全性和灵活性。
