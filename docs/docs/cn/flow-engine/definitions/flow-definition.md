# FlowDefinition

FlowDefinition 定义了流的基本结构和配置，是流引擎的核心概念之一。它描述了流的元信息、触发条件、执行步骤等。

## 类型定义

```ts
interface FlowDefinitionOptions<TModel extends FlowModel = FlowModel> {
  key: string;
  title?: string;
  manual?: boolean;
  sort?: number;
  on?: FlowEvent<TModel>;
  steps: Record<string, StepDefinition<TModel>>;
  defaultParams?: Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>);
}
```

其中 `on` 的类型如下：

```ts
type FlowEventPhase =
  | 'beforeAllFlows'
  | 'afterAllFlows'
  | 'beforeFlow'
  | 'afterFlow'
  | 'beforeStep'
  | 'afterStep';

type FlowEvent<TModel extends FlowModel = FlowModel> =
  | string
  | {
      eventName: string;
      defaultParams?: Record<string, any>;
      phase?: FlowEventPhase;
      flowKey?: string;
      stepKey?: string;
    };
```

## 注册方式

```ts
class MyModel extends FlowModel {}

// 通过模型类注册流
MyModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step'
    }
  },
  defaultParams: {
    step1: { param1: 'value1' }
  }
});
```

## 属性说明

### key

**类型**: `string`  
**必需**: 是  
**描述**: 流的唯一标识符

建议采用统一的 `xxxSettings` 风格命名，例如：
- `pageSettings`
- `tableSettings` 
- `cardSettings`
- `formSettings`
- `detailsSettings`
- `buttonSettings`
- `popupSettings`
- `deleteSettings`
- `datetimeSettings`
- `numberSettings`

这样命名便于识别和维护，建议全局统一。

**示例**:
```ts
key: 'pageSettings'
key: 'tableSettings'
key: 'deleteSettings'
```

### title

**类型**: `string`  
**必需**: 否  
**描述**: 人类可读的流标题

建议与 key 保持一致风格，采用 `Xxx settings` 命名，例如：
- `Page settings`
- `Table settings`
- `Card settings`
- `Form settings`
- `Details settings`
- `Button settings`
- `Popup settings`
- `Delete settings`
- `Datetime settings`
- `Number settings`

这样命名更清晰易懂，便于界面展示和团队协作。

**示例**:
```ts
title: 'Page settings'
title: 'Table settings'
title: 'Delete settings'
```

### manual

**类型**: `boolean`  
**必需**: 否  
**默认值**: `false`  
**描述**: 是否仅手动执行流

- `true`: 流只能手动触发，不会自动执行
- `false`: 流可以自动执行（当没有 `on` 属性时默认自动执行）

**示例**:
```ts
manual: true  // 仅手动执行
manual: false // 可以自动执行
```

### sort

**类型**: `number`  
**必需**: 否  
**默认值**: `0`  
**描述**: 流执行顺序，数值越小越先执行

可以为负数，用于控制多个流的执行顺序。

**示例**:
```ts
sort: -1  // 优先执行
sort: 0   // 默认顺序
sort: 1   // 延后执行
```

### on

**类型**: `FlowEvent<TModel>`  
**必需**: 否  
**描述**: 允许该流被 `dispatchEvent` 触发的事件配置

用于声明触发事件名（字符串或 `{ eventName }`），以及可选的执行时机（`phase`）。不包含处理函数（处理逻辑在 `steps` 里）。

**支持的事件类型**:
- `'click'` - 点击事件
- `'submit'` - 提交事件
- `'reset'` - 重置事件
- `'remove'` - 删除事件
- `'openView'` - 打开视图事件
- `'dropdownOpen'` - 下拉框打开事件
- `'popupScroll'` - 弹窗滚动事件
- `'search'` - 搜索事件
- `'customRequest'` - 自定义请求事件
- `'collapseToggle'` - 折叠切换事件
- 或任意自定义字符串

**示例**:
```ts
on: 'click'  // 点击时触发
on: 'submit' // 提交时触发
on: { eventName: 'customEvent', defaultParams: { param1: 'value1' } }
```

#### 执行时机（phase）

当同一个事件（例如 `click`）存在多条事件流时，可以用 `phase / flowKey / stepKey` 指定该流插入到内置静态流的哪个位置执行：

| phase | 含义 | 需要的字段 |
| --- | --- | --- |
| `beforeAllFlows`（默认） | 在所有内置静态流之前执行 | - |
| `afterAllFlows` | 在所有内置静态流之后执行 | - |
| `beforeFlow` | 在某条内置静态流开始前执行 | `flowKey` |
| `afterFlow` | 在某条内置静态流结束后执行 | `flowKey` |
| `beforeStep` | 在某条内置静态流的某个 step 开始前执行 | `flowKey` + `stepKey` |
| `afterStep` | 在某条内置静态流的某个 step 结束后执行 | `flowKey` + `stepKey` |

**示例**：

```ts
// 1) 默认：在所有内置静态流之前（不需要写 phase）
on: { eventName: 'click' }

// 2) 在所有内置静态流之后
on: { eventName: 'click', phase: 'afterAllFlows' }

// 3) 在某条内置静态流开始前/结束后
on: { eventName: 'click', phase: 'beforeFlow', flowKey: 'buttonSettings' }
on: { eventName: 'click', phase: 'afterFlow', flowKey: 'buttonSettings' }

// 4) 在某条内置静态流的某个步骤开始前/结束后
on: { eventName: 'click', phase: 'beforeStep', flowKey: 'buttonSettings', stepKey: 'general' }
on: { eventName: 'click', phase: 'afterStep', flowKey: 'buttonSettings', stepKey: 'general' }
```

### steps

**类型**: `Record<string, StepDefinition<TModel>>`  
**必需**: 是  
**描述**: 流步骤定义

定义流中包含的所有步骤，每个步骤都有唯一的键名。

**示例**:
```ts
steps: {
  step1: {
    use: 'actionName',
    title: 'First Step',
    sort: 0
  },
  step2: {
    use: 'anotherAction',
    title: 'Second Step',
    sort: 1
  }
}
```

### defaultParams

**类型**: `Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>)`  
**必需**: 否  
**描述**: 流级默认参数

在模型实例化（createModel）时，为"当前流"的步骤参数填充初始值。仅填补缺失，不覆盖已有。固定返回形状：`{ [stepKey]: params }`

**示例**:
```ts
// 静态默认参数
defaultParams: {
  step1: { param1: 'value1', param2: 'value2' },
  step2: { param3: 'value3' }
}

// 动态默认参数
defaultParams: (ctx) => {
  return {
    step1: { 
      param1: ctx.model.uid,
      param2: new Date().toISOString()
    }
  }
}

// 异步默认参数
defaultParams: async (ctx) => {
  const data = await fetchSomeData();
  return {
    step1: { data }
  }
}
```

## 完整示例

```ts
class PageModel extends FlowModel {}

PageModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Load Data',
      sort: 0,
      preset: true
    },
    processData: {
      use: 'processDataAction', 
      title: 'Process Data',
      sort: 1,
      paramsRequired: true
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Save Data', 
      sort: 2,
      hideInSettings: false
    }
  },
  defaultParams: {
    loadData: { 
      source: 'api',
      cache: true 
    },
    processData: { 
      format: 'json' 
    }
  }
});
```
