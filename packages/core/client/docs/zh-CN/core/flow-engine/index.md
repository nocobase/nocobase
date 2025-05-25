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
  on?: { eventName: string }; // 更改 event 为 eventName
  steps: Record<string, StepDefinition>; // 更新 Step 类型
}

// 上下文类型 (对应实际 FlowContext)
export interface FlowContext {
  engine: FlowEngine;
  app?: Application;
  event?: any;
  $exit: () => void;
  [key: string]: any;
}

// 模型构造函数类型 (对应实际 ModelConstructor)
export type ModelConstructor<T extends FlowModel = FlowModel> = new (
  uid: string,
  app?: Application,
  stepParams?: Record<string, any>,
) => T;

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
  registerAction(nameOrDefinition: string | ActionDefinition, options?: ActionOptions): void;

  // 获取 Action 定义
  getAction(name: string): ActionDefinition | undefined;

  // 注册 Model 类
  registerModelClass(name: string, modelClass: ModelConstructor): void;

  // 获取 Model 类 (构造函数)
  getModelClass(name: string): ModelConstructor | undefined;

  // 创建并注册 Model 实例
  createModel<T extends FlowModel = FlowModel>(
    uid: string,
    modelClassName: string,
    app: Application,
    stepsParams?: Record<string, any> // 对应 FlowModel 构造函数中的 stepsParams
  ): T;

  // 获取 Model 实例
  getModel<T extends FlowModel = FlowModel>(uid: string): T | undefined;

  // 销毁 Model 实例
  destroyModel(uid: string): boolean;

  // 注册流程 (注册到 Model 类上)
  registerFlow(modelClassName: string, flowDefinition: FlowDefinition): void;

  // React hooks & HOC
  static useContext(): FlowContext;
  static useFlowModel<T extends FlowModel = FlowModel>(
    id: string, // 模型实例的 UID
    modelClassName: string, // 模型类名
    stepsParams?: Record<string, any> // 步骤参数，可选
  ): T;
  static useApplyFlow(flowKey: string, model: FlowModel, ctx?: Partial<FlowContext>): void;
  static useDispatchEvent(eventName: string, model: FlowModel, ctx?: Partial<FlowContext>): void;
  static withFlowModel<P>(
    Component: React.ComponentType<P>,
    options: {
      modelId?: string; // 可选，用于指定固定 modelId
      modelClass?: string; // 可选，用于指定模型类，若不提供 modelId，则会基于此创建
      defaultFlow?: string; // 可选
      stepsParams?: Record<string, any>; // 可选，用于模型创建
    }
  ): React.ComponentType<P & { modelId: string; model?: FlowModel }>;
}
```

---

## FlowModel API

```typescript
class FlowModel {
  readonly uid: string;
  readonly app?: Application;
  readonly flows: Map<string, FlowDefinition>; // 存储注册到此模型(类)的流程
  protected props: Map<string, any>;
  protected stepParams: Map<string, Record<string, any>>; // <flowKey, <stepKey, params>>

  constructor(uid: string, app?: Application, initialStepParams?: Record<string, any>);

  // 获取 props
  getProps(key?: string): any;
  // 设置 props
  setProps(keyOrObject: string | Record<string, any>, value?: any): void;

  // 设置步骤参数 (通常在模型初始化时或特定逻辑中调用)
  setStepParams(flowKey: string, stepKey: string, params: Record<string, any>): void;
  // 获取步骤参数
  getStepParams(flowKey: string, stepKey: string): Record<string, any> | undefined;

  // (applyFlow 和 dispatchEvent 通常通过 FlowEngine.useApplyFlow 和 FlowEngine.useDispatchEvent 触发，
  //  model 实例作为参数传入。FlowModel 自身不直接暴露这两个方法给外部调用者执行流程)

  // 静态方法 (在 Model 类上)
  static registerFlow(flowDefinition: FlowDefinition): void;
  static getFlow(flowKey: string): FlowDefinition | undefined;
}
```

---

## React 集成 API

```typescript
// 通过 hook 获取 FlowEngine 上下文
const flowContext = FlowEngine.useContext();

// 通过 hook 获取或创建模型实例
const modelInstance = FlowEngine.useFlowModel('uniqueModelId', 'MyRegisteredModelClass', { initialParam: 'value' });

// 触发流程 (通常在事件处理或 effect 中)
// FlowEngine.useApplyFlow 返回一个函数，供调用
const applyMyFlow = FlowEngine.useApplyFlow();
// ... later
// applyMyFlow('myFlowKey', modelInstance, { customData: 'someValue' });

// 派发事件 (通常在事件处理或 effect 中)
// FlowEngine.useDispatchEvent 返回一个函数
const dispatchMyEvent = FlowEngine.useDispatchEvent();
// ... later
// dispatchMyEvent('onClick', modelInstance, { eventSpecificData: '...' });


// 高阶组件用法
// 注意: FlowEngine.withFlowModel 的 options 和返回的 props 可能需要根据实际实现微调
const MyButtonEnhanced = FlowEngine.withFlowModel(Button, {
  modelClass: 'ButtonModel', // 指定模型类
  defaultFlow: 'initializeButtonFlow',
  stepsParams: { title: 'Default Title' }
});

// <MyButtonEnhanced modelId="myButtonInstance1" />
// 或者如果不提供 modelId，HOC 内部会尝试创建和管理 model
// <MyButtonEnhanced someOtherProp="value" />
```

---

## 典型用法示例

### Markdown

```ts
flowEngine.registerFlow('setMarkdownPropsFlow', {
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
      name: 'block:markdown:height',
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

const model = new FlowModel({
  stepParams: [
    {
      flowKey: 'setMarkdownPropsFlow',
      stepKey: 'setTemplate',
      params: { template: 'handlebars' },
    },
    {
      flowKey: 'setMarkdownPropsFlow',
      stepKey: 'setHeight',
      params: { height: 200 },
    },
    {
      flowKey: 'setMarkdownPropsFlow',
      stepKey: 'setContent',
      params: { content: '这是一段演示文本，**支持 Markdown 语法**。' },
    },
  ],
});

const HTML = ({ content, height }) => {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: content }}
      style={{ height }}
    />
  )
}

const Markdown = FlowEngine.withFlowModel(HTML, { defaultFlow: 'setMarkdownPropsFlow' });

<Markdown model={model} />;
```

### Action

```typescript
// 1. 定义并注册模型
class ButtonModel extends FlowModel {}

flowEngine.registerModel('ButtonModel', ButtonModel);

// 2. 定义并注册 Action
flowEngine.registerAction('showConfirm', {
  async handler(ctx, model, params) {
    const confirmed = await ctx.modal.confirm(params);
    if (!confirmed) {
      await ctx.exit();
    }
  },
  uiSchema: { /* 可配置 modal.confirm 弹窗相关 UI Schema */ },
  defaultParams: { message: '确定要执行此操作吗？' }
});

// 3. 注册流程
flowEngine.registerFlow('setDeletePropsFlow', {
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

flowEngine.registerFlow('buttonActionFlow', {
  on: { event: 'onClick' },
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
const ButtonModel = flowEngine.getModel('ButtonModel');
const model = new ButtonModel({
  stepParams: [
    {
      flowKey: 'setDeletePropsFlow',
      stepKey: 'setTitle',
      params: { title: 'Delete record' },
    },
    {
      flowKey: 'buttonActionFlow',
      stepKey: 'popconfirm',
      params: { message: '确定要删除此记录吗？' },
    },
  ],
});

// 5. 在 React 组件中集成
const DeleteButton = FlowEngine.withFlowModel(Button, { defaultFlow: 'setDeletePropsFlow' });

<DeleteButton model={model} />;
```

### Table

```tsx | pure
flowEngine.registerFlow('setTablePropsFlow', {
  steps: {
    setLinkage: {
      async handler(ctx, model, params) {
        if (await jsonMagic(params, ctx)) {
          model.hidden = true;
          model.resource.addAppend('xxx');
          await ctx.exit();
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
        const onChange = mode.getProps('onChange');
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

class TableModel extends CollectionFlowModel {}

const model = new TableModel({
  stepParams: [
    {
      flowKey: 'setTablePropsFlow',
      stepKey: 'setColumns',
      params: { columns: [] },
    },
  ],
});

const Table = FlowEngine.withFlowModel(AntdTable, { defaultFlow: 'setTablePropsFlow' });

<Table model={model} />;
```
