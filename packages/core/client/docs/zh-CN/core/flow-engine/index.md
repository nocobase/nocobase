# FlowEngine

## 核心类型定义

```typescript
// Action 相关类型
export interface ActionOptions<P = any, R = any> {
  handler: (ctx: FlowContext, model: FlowModel, params: P) => Promise<R> | R;
  uiSchema?: Record<string, any>;
  defaultParams?: Partial<P>;
}

// Action 定义 (对应实际 ActionDefinition)
export interface ActionDefinition<P = any, R = any> {
  name: string;
  title?: string;
  handler: (ctx: FlowContext, model: FlowModel, params: P) => Promise<R> | R;
  uiSchema?: Record<string, any>;
  defaultParams?: Partial<P>;
}

// Flow 步骤定义 (对应实际 StepDefinition)
// BaseStepDefinition
interface BaseStepDefinition {
  title?: string;
  isAwait?: boolean; // 是否等待 handler 执行完毕，默认为 true
}

// 使用已注册 Action 的步骤
export interface ActionStepDefinition extends BaseStepDefinition {
  use: string; // 复用已注册 ActionDefinition 的名称
  uiSchema?: Record<string, any>; // 可选: 覆盖 ActionDefinition 中的 uiSchema
  defaultParams?: Record<string, any>; // 可选: 覆盖/扩展 ActionDefinition 中的 defaultParams
  handler?: undefined; // 不能有自己的 handler
}

// 内联定义 handler 的步骤
export interface InlineStepDefinition extends BaseStepDefinition {
  handler: (ctx: FlowContext, model: FlowModel, params: any) => Promise<any> | any;
  uiSchema?: Record<string, any>; // 可选: 此内联步骤的 uiSchema
  defaultParams?: Record<string, any>; // 可选: 此内联步骤的 defaultParams
  use?: undefined; // 不能使用已注册的 action
}

export type StepDefinition = ActionStepDefinition | InlineStepDefinition;

// Flow 定义类型 (对应实际 FlowDefinition)
export interface FlowDefinition {
  key: string; // 流程唯一标识
  title?: string;
  autoApply?: boolean; // 是否自动应用流程
  sort?: number; // 流程执行顺序，数字越小越先执行
  on?: { eventName: string }; // 更改 event 为 eventName
  steps: Record<string, StepDefinition>; // 更新 Step 类型
}

// 上下文类型 (对应实际 FlowContext)
export interface FlowContext {
  engine: FlowEngine;
  event?: any;
  $exit: () => void;
  [key: string]: any;
}

// 模型构造函数类型 (对应实际 ModelConstructor)
export type ModelConstructor<T extends FlowModel = FlowModel> = new (options: {
  uid: string;
  stepParams?: Record<string, any>;
}) => T;

// StepParams 在 FlowModel 构造时使用 (Record<string, any>)
// 此处 StepParams 保留文档原有概念，但实际传入 FlowModel 的是 Record<string, any>
// export interface StepParams {
//   flowKey: string;
//   stepKey: string;
//   params: Record<string, any>;
// }
```

---

## FlowEngine API

```typescript
class FlowEngine {
  // 注册 Action
  registerAction<TModel extends FlowModel = FlowModel>(
    nameOrDefinition: string | ActionDefinition<TModel>,
    options?: ActionOptions<TModel>
  ): void;

  // 获取 Action 定义
  getAction<TModel extends FlowModel = FlowModel>(name: string): ActionDefinition<TModel> | undefined;

  // 注册 Model 类
  registerModelClass(name: string, modelClass: ModelConstructor): void;

  // 获取 Model 类 (构造函数)
  getModelClass(name: string): ModelConstructor | undefined;

  // 创建并注册 Model 实例
  createModel<T extends FlowModel = FlowModel>(options: {
    uid?: string;
    use: string; // 已注册的模型类名
    stepsParams?: Record<string, any>;
  }): T;

  // 获取 Model 实例
  getModel<T extends FlowModel = FlowModel>(uid: string): T | undefined;

  // 销毁 Model 实例
  destroyModel(uid: string): boolean;

  // 注册流程 (注册到 Model 类上)
  registerFlow<TModel extends FlowModel = FlowModel>(
    modelClassName: string,
    flowDefinition: FlowDefinition<TModel>
  ): void;
}
```

---

## FlowModel API

```typescript
class FlowModel {
  readonly uid: string;
  public props: Record<string, any>;
  public hidden: boolean;
  public stepParams: Record<string, Record<string, any>>;
  public flowEngine: FlowEngine;

  constructor(options: { uid: string; stepParams?: Record<string, any> });

  // 设置 FlowEngine 实例
  setFlowEngine(flowEngine: FlowEngine): void;

  // 获取 props
  getProps(key?: string): any;
  // 设置 props
  setProps(keyOrObject: string | Record<string, any>, value?: any): void;

  // 设置步骤参数
  setStepParams(flowKey: string, stepKey: string, params: Record<string, any>): void;
  // 获取步骤参数
  getStepParams(flowKey: string, stepKey: string): Record<string, any> | undefined;

  // 应用流程
  applyFlow(flowKey: string, context?: any): Promise<any>;

  // 派发事件
  dispatchEvent(eventName: string, context?: any): void;

  // 应用自动流程
  applyAutoFlows(context?: any): Promise<any[]>;

  // 获取流程定义
  getFlow(key: string): FlowDefinition | undefined;

  // 可选的渲染 React 组件的方法, FlowModelComponent组件渲染时需要提供
  render(): React.ReactNode;

  // 静态方法 (在 Model 类上)
  static registerFlow(flowDefinition: FlowDefinition): void;
  static getFlows(): Map<string, FlowDefinition>;
}
```

---

## React 集成 API

```typescript
// 通过 hook 获取 FlowEngine 实例
const flowEngine = useFlowEngine();

// 通过 hook 获取或创建模型实例
const modelInstance = useFlowModel<MyModel>(
  'uniqueModelId',
  'MyRegisteredModelClass',
  { initialParam: 'value' }
);

// 应用流程
const result = useApplyFlow('myFlowKey', modelInstance, { customData: 'someValue' });

// 派发事件
const { dispatch } = useDispatchEvent('onClick', modelInstance, { eventSpecificData: '...' });

// 高阶组件用法
const MyButtonEnhanced = withFlowModel(Button, {
  use: 'ButtonModel', // 指定模型类
  uid: 'myButtonInstance1' // 可选，指定模型实例 ID
});

// 使用组件
<MyButtonEnhanced model={modelInstance} />
```

---

## 典型用法示例

### Markdown

```ts
// 注册模型类
class MarkdownModel extends FlowModel {}
flowEngine.registerModelClass('MarkdownModel', MarkdownModel);

// 注册流程
flowEngine.registerFlow('MarkdownModel', {
  key: 'setMarkdownPropsFlow',
  steps: {
    setTemplate: {
      title: '模板引擎',
      uiSchema: {
        template: {
          type: 'string',
          title: '模板类型',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            { label: '普通文本', value: 'plain' },
            { label: 'Handlebars模板', value: 'handlebars' }
          ],
        }
      },
      defaultParams: { template: 'handlebars' },
      handler: (ctx, model, params) => {
        model.setProps('template', params.template);
      },
    },
    setHeight: {
      title: '高度设置',
      uiSchema: {
        height: {
          type: 'number',
          title: '高度设置',
          'x-decorator': 'FormItem',
          'x-component': 'InputNumber',
          'x-component-props': { addonAfter: 'px' },
        }
      },
      defaultParams: { height: 300 },
      handler: (ctx, model, params) => {
        model.setProps('height', params.height);
      },
    },
    setContent: {
      title: '内容设置',
      uiSchema: {
        content: {
          type: 'string',
          title: 'Markdown内容',
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        }
      },
      handler: (ctx, model, params) => {
        model.setProps('content', params.content);
      },
    },
    parse: {
      handler: async (ctx, model) => {
        const props = model.getProps();
        let content = props.content;
        if (props.template === 'handlebars') {
          content = Handlebars.compile(content || '')({
            var1: 'variable 1',
            var2: 'variable 2',
            var3: 'variable 3',
          });
        }
        model.setProps('content', MarkdownIt().render(content || ''));
      },
    },
  }
});

// 创建模型实例
const model = flowEngine.createModel({
  uid: 'markdown-1',
  use: 'MarkdownModel',
  stepsParams: {
    'setMarkdownPropsFlow.setTemplate': { template: 'handlebars' },
    'setMarkdownPropsFlow.setHeight': { height: 200 },
    'setMarkdownPropsFlow.setContent': { content: '这是一段演示文本，**支持 Markdown 语法**。' },
  },
});

const HTML = ({ content, height }) => {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: content }}
      style={{ height }}
    />
  )
}

const Markdown = withFlowModel(HTML, { use: 'MarkdownModel' });

<Markdown model={model} />;
```

### Action

```typescript
// 1. 定义并注册模型
class ButtonModel extends FlowModel {}
flowEngine.registerModelClass('ButtonModel', ButtonModel);

// 2. 定义并注册 Action
flowEngine.registerAction('showConfirm', {
  async handler(ctx, model, params) {
    const confirmed = await ctx.modal.confirm(params);
    if (!confirmed) {
      ctx.$exit();
    }
  },
  uiSchema: { /* 可配置 modal.confirm 弹窗相关 UI Schema */ },
  defaultParams: { message: '确定要执行此操作吗？' }
});

// 3. 注册流程
flowEngine.registerFlow('ButtonModel', {
  key: 'setDeletePropsFlow',
  steps: {
    setTitle: {
      async handler(ctx, model, params) {
        model.setProps('children', params.title);
      },
    },
    setOnClick: {
      async handler(ctx, model, params) {
        model.setProps('onClick', () => {
          model.dispatchEvent('onClick', ctx);
        });
      },
    },
  }
});

flowEngine.registerFlow('ButtonModel', {
  key: 'buttonActionFlow',
  on: { eventName: 'onClick' },
  steps: {
    popconfirm: { use: 'showConfirm' },
    delete: {
      async handler(ctx, model) {
        await ctx.request({
          url: `/examples:destory/${ctx.currentRecord.id}`,
        });
        ctx.message.success('Deleted successfully.');
      }
    }
  }
});

// 4. 使用模型
const model = flowEngine.createModel({
  uid: 'delete-button-1',
  use: 'ButtonModel',
  stepsParams: {
    'setDeletePropsFlow.setTitle': { title: 'Delete record' },
    'buttonActionFlow.popconfirm': { message: '确定要删除此记录吗？' },
  },
});

// 5. 在 React 组件中集成
const DeleteButton = withFlowModel(Button, { use: 'ButtonModel' });

<DeleteButton model={model} />;
```

### Table

```tsx | pure
// 注册模型类
class TableModel extends FlowModel {}
flowEngine.registerModelClass('TableModel', TableModel);

flowEngine.registerFlow('TableModel', {
  key: 'setTablePropsFlow',
  steps: {
    setLinkage: {
      async handler(ctx, model, params) {
        if (await jsonMagic(params, ctx)) {
          model.hidden = true;
          model.resource.addAppend('xxx');
          ctx.$exit();
        }
      },
    },
    setURL: {
      async handler(ctx, model, params) {
        model.resource.setURL(params.url);
      },
    },
    // TODO: 简单示例
    setColumns: {
      async handler(ctx, model, params) {
        model.setProps('columns', params.columns);
      },
    },
    // TODO: 配置字段
    configureFields: {
      async handler(ctx, model, params) {
        model.addField(xxx);
        // model.setProps('columns', params.columns);
      },
    },
    onChange: {
      async handler(ctx, model, params) {
        const onChange = model.getProps('onChange');
        model.setProps('onChange', async () => {
          await onChange?.();
          await model.resource.next();
        });
      },
    },
    setDataSource: {
      async handler(ctx, model, params) {
        await model.resource.load();
        const dataSource = model.resource.getData();
        model.setProps('dataSource', dataSource);
      },
    },
  },
});

const model = flowEngine.createModel({
  uid: 'table-1',
  use: 'TableModel',
  stepsParams: {
    'setTablePropsFlow.setColumns': { columns: [] },
  },
});

const Table = withFlowModel(AntdTable, { use: 'TableModel' });

<Table model={model} />;
```
