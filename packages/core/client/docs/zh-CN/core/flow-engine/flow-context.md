# FlowContext

`FlowContext` 是流程引擎在执行流程步骤时传递的上下文对象。它用于在步骤处理函数中控制流程的执行、传递数据、记录日志等。通过 `ctx`，可以灵活地影响流程的走向和行为，实现复杂的业务流程编排。

---

## 主要属性与方法

| 属性/方法         | 说明                                                                                  |
|------------------|-------------------------------------------------------------------------------------|
| `ctx.exit()`     | 立即终止整个流程的执行，后续步骤不再执行。适用于遇到致命错误或业务条件不满足时主动中断流程。|          |
| `ctx.logger`     | 日志记录工具，支持 `info`、`warn`、`error`、`debug` 等方法。用于输出调试信息和业务日志。|
| `ctx.stepResults`| 存储每个步骤的返回结果，结构为 `{ 步骤名: 返回值 }`，便于后续步骤访问前置结果。         |
| `ctx.shared`     | 流程上下文中的共享数据对象，可用于步骤间数据传递，可读可写。适合存放流程内需要多步骤共享的变量。|
| `ctx.model`      | 当前流程关联的数据模型实例，通常用于在流程步骤中访问和操作业务数据。|
| `ctx.globals`    | 系统初始化时设置的全局上下文，跨流程共享，只读。适合存放全局配置、常量等。|
| `ctx.extra`      | 额外上下文对象，通过 `applyFlow` 传入，仅在本次流程执行时有效，适合传递临时数据，只读。     |
| `ctx.app`        | 当前应用实例，可用于访问应用级别的服务和资源。|
---

## 四类变量的定义与访问

流程上下文变量分为四类，分别对应不同的定义方式和访问范围：

### 1. 全局变量（ctx.globals）

- **定义方式**：在流程引擎初始化时通过 `flowEngine.defineGlobalVars()` 声明类型。
- **适用场景**：全局配置、当前用户、系统常量等，所有流程和步骤可访问，只读。
- **访问方式**：`ctx.globals.xxx`

```ts
flowEngine.defineGlobalVars({
  user: { type: 'object', label: '当前用户' },
  roles: { type: 'array', label: '当前角色' },
  systemDate: { type: 'date', label: '系统日期' },
});

// 在流程步骤中访问
const user = ctx.globals.user;
```

### 2. 局部变量（ctx.extra）

- **定义方式**：在模型层通过 `MyModel.defineExtraVars()` 声明类型，流程执行时通过 `applyFlow` 传入。
- **适用场景**：当前数据、选中记录等与本次流程强相关的临时数据，只读。
- **访问方式**：`ctx.extra.xxx`

```ts
MyModel.defineExtraVars({
  currentTable: { type: 'string', label: '当前数据表' },
  currentRecord: { type: 'object', label: '当前数据' },
  selectedRecords: { type: 'array', label: '选中记录' },
});

// 传入流程
const extraContext = {
  currentTable: 'users',
  currentRecord: { id: 1, name: '张三' },
  selectedRecords: [{ id: 2 }, { id: 3 }],
};
await model.applyFlow('myFlow', extraContext);

// 在流程步骤中访问
const record = ctx.extra.currentRecord;
```

### 3. 流程共享变量（ctx.shared）

- **定义方式**：在流程定义时通过 `defineFlow({ shared })` 声明类型。
- **适用场景**：流程内多步骤共享的数据，可读可写。
- **访问方式**：`ctx.shared.xxx`

```ts
const myFlow = defineFlow({
  key: 'myFlow',
  shared: {
    flowParam: { type: 'string', label: '流程参数' },
  },
  steps: { ... }
});

// 在流程步骤中访问和修改
ctx.shared.flowParam = 'newValue';
```

### 4. 步骤输出变量（ctx.stepResults）

- **定义方式**：每个步骤通过 `output` 字段声明类型，handler 返回值自动存储。
- **适用场景**：步骤间结果传递，后续步骤可访问前置步骤的输出，只读。
- **访问方式**：`ctx.stepResults.步骤名`

```ts
step1: {
  output: { type: 'string', label: '问候语' },
  async handler(ctx, params) {
    return 'hello';
  }
},
step2: {
  async handler(ctx, params) {
    const prev = ctx.stepResults.step1;
    return prev + ' world';
  }
}
```

---

## 常见场景示例

### 1. 终止流程

当遇到不可恢复的错误或业务条件不满足时，可调用 `ctx.exit()` 立即终止流程。

```ts
async handler(ctx, params) {
    if (params.shouldExit) {
        ctx.exit();
    }
    // ...其他逻辑...
}
```

### 2. 访问前置步骤结果

通过 `ctx.stepResults` 可以方便地获取前置步骤的返回值，实现步骤间的数据依赖。

```ts
// step1 返回一个结果
async handler(ctx, params) {
    return 'hello';
}

// step2 访问 step1 的返回值
async handler(ctx, params) {
    const prev = ctx.stepResults.step1;
    // 基于前置步骤结果处理
    return prev + ' world';
}
```

### 3. 上下文的传递

流程上下文的传递分为全局和局部两种场景：

- **全局上下文**：适用于多个流程共享的数据（如全局配置、服务实例等），建议存放在 `this.flowEngine.context` 中，由流程引擎统一管理。
- **局部上下文**：适用于某次流程执行时临时传递的数据（如用户输入、请求参数等），通过 `applyFlow` 的 `extraContext` 参数传入，仅在本次流程执行期间有效。

示例代码如下：

```ts
class FlowModel {
    async applyFlow(flowKey, extraContext) {
        const flowContext = new FlowContext();
        // 绑定当前模型实例
        flowContext.set('model', this);
        // 注入全局上下文（只读）
        flowContext.set('globals', this.flowEngine.context);
        // 注入本次流程的额外上下文（只读）
        flowContext.set('extra', extraContext);
        // 执行流程中间件
        await compose(this.engine.middlewares)(flowContext);
    }
}
```

> **注意事项：**
> - `globals` 和 `extra` 都为只读属性，建议仅用于读取，不要在流程中修改。
> - `shared` 可读可写，适合在流程内多步骤间传递和修改数据。
> - 合理区分全局与局部上下文，避免数据污染和副作用。

### 4. 日志记录示例

日志记录有助于流程调试和问题追踪。推荐在关键步骤、异常处理等场景下使用。

```ts
ctx.logger.info('步骤开始', { step: 'step1', params });
ctx.logger.error('发生错误', error);
```

---

## 完整流程示例

以下为一个完整的流程定义与调用示例，涵盖了流程注册、步骤处理、上下文传递等关键环节：

```ts
class MyModel extends FlowModel {}

const myFlow = defineFlow({
    key: 'myFlow',
    shared: {
        flowParam: { type: 'string', label: '流程参数' },
    },
    steps: {
        step1: {
            output: { type: 'string', label: '问候语' },
            async handler(ctx, params) {
                if (params.shouldExit) {
                    ctx.exit();
                }
                return 'hello';
            },
        },
        step2: {
            async handler(ctx, params) {
                if (params.shouldSkip) {
                    return;
                }
                const prev = ctx.stepResults.step1;
                return prev + ' world';
            },
        }
    },
});

MyModel.registerFlow(myFlow);

const model = new MyModel({
    stepParams: {
        myFlow: {
            step1: { shouldExit: false },
            step2: { shouldSkip: true },
        }
    },
});

const extraContext = { userId: 123, requestId: 'abc-xyz' };

await model.applyFlow('myFlow', extraContext);
```

---

## 最佳实践建议

- 合理利用 `ctx.shared` 进行步骤间数据传递，避免滥用全局上下文。
- 日志记录应包含关键信息，便于后续排查和分析。
- 对于只读上下文（如 `globals`、`extra`），避免在流程中修改，确保数据一致性。
- 流程步骤应尽量保持单一职责，便于维护和复用。

如需进一步扩展 `FlowContext`，可根据实际业务需求自定义属性和方法，但建议遵循上下文只读/可写的设计原则，确保流程的可控性和可维护性。
