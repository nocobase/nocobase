# FlowEngine

## 核心类型定义

```typescript
// Action 相关类型
export interface ActionOptions<P = any, R = any> {
  handler: (ctx: any, model: FlowModel, params: P) => Promise<R> | R;
  uiSchema?: Record<string, any>;
  defaultParams?: Partial<P>;
}

// Flow 步骤类型
export interface FlowStep<P = any, R = any> {
  handler?: (ctx: any, model: FlowModel, params: P) => Promise<R> | R;
  use?: string; // 复用已注册 action 的名称
  uiSchema?: Record<string, any>;
  defaultParams?: Partial<P>;
}

// Flow 定义类型
export interface FlowDefinition {
  on?: { event: string };
  steps: Record<string, FlowStep>;
}

// Step 参数类型
export interface StepParams {
  flowKey: string;
  stepKey: string;
  params: Record<string, any>;
}
```

---

## FlowEngine API

```typescript
class FlowEngine {
  // 注册 Action
  registerAction<P = any, R = any>(actionName: string, options: ActionOptions<P, R>): void;

  // 注册 Model
  registerModel(modelName: string, ModelClass: typeof FlowModel): void;

  // 获取 Model
  getModel(modelName: string): typeof FlowModel;

  // 注册流程
  registerFlow(flowKey: string, flow: FlowDefinition): void;

  // React hooks & HOC
  static useContext(): any;
  static useModelById(id: string): FlowModel | undefined;
  static useApplyFlow(flowKey: string, model: FlowModel, ctx?: any): void;
  static useDispatchEvent(eventName: string, model: FlowModel, ctx?: any): void;
  static withFlowModel<P>(
    Component: React.ComponentType<P>,
    options: { filterFlow?: string }
  ): React.ComponentType<P & { modelId: string }>;
}
```

---

## FlowModel API

```typescript
class FlowModel {
  constructor(options: { stepParams?: StepParams[] });

  getProps(key?: string): any;
  setProps(key: string, value: any): void;

  setStepParams(flowKey: string, stepKey: string, params: Record<string, any>): void;
  getStepParams(flowKey: string, stepKey: string): Record<string, any> | undefined;

  applyFlow(flowKey: string, ctx?: any): Promise<void>;
  dispatchEvent(eventName: string, ctx?: any): Promise<void>;
}
```

---

## React 集成 API

```typescript
// 通过 hook 获取上下文
const ctx = FlowEngine.useContext();

// 通过 hook 获取模型实例
const model = FlowEngine.useModelById('xxx');

// 触发流程
FlowEngine.useApplyFlow('myFlow', model, ctx);

// 派发事件
FlowEngine.useDispatchEvent('onClick', model, ctx);

// 高阶组件用法
const MyButton = FlowEngine.withFlowModel(Button, { filterFlow: 'myFlow' });
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

const Markdown = FlowEngine.withFlowModel(HTML, { defaultFlowKey: 'setMarkdownPropsFlow' });

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
const DeleteButton = FlowEngine.withFlowModel(Button, { defaultFlowKey: 'setDeletePropsFlow' });

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

const Table = FlowEngine.withFlowModel(AntdTable, { defaultFlowKey: 'setTablePropsFlow' });

<Table model={model} />;
```
