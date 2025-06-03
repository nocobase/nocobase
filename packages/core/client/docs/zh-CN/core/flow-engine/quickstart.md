# Quickstart

以 React 为例，我们通常会这样去渲染一个按钮组件。

```tsx
import { Button } from 'antd';

export default function App() {
    return <Button type="primary">Primary Button</Button>
}
```

但是这个按钮是一个静态的，无任何作用。开发可以有无数种办法实现相关的逻辑，但是如果要提供无代码或自动化编排能力，这个按钮需要很大工程改造。
而在 NocoBase 的 FlowEngine 里，无代码的改造，非常的简单。

第一步：基于 FlowModel 实现组件的渲染

<code src="./demos/quickstart-1-basic.tsx"></code>

三点小细节说明

1. 把组件放到 FlowModel 的 render 里渲染

```ts
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}
```

2. 每个按钮都是一个 model 实例

```ts
const model = this.flowEngine.createModel({
    uid: 'my-model',
    use: 'MyModel',
    props: {
        type: 'primary',
        children: 'Primary Button',
    },
});
```

3. 使用 `<FlowModelRenderer />` 渲染 model。

```ts
<FlowModelRenderer model={model} />
```

第二步：为 MyModel 添加一个属性流的配置，实现按钮 props 的可编辑能力

<code src="./demos/quickstart-2-register-propsflow.tsx"></code>

在这一步重点的几个改造

1. 为 MyModel 添加了一个 Flow，用于配置按钮属性

```ts

const myPropsFlow = defineFlow({
  key: 'myPropsFlow',
  auto: true,
  title: '按钮配置',
  steps: {
    setProps: {
      title: '按钮属性设置',
      uiSchema: {
        title: {
          type: 'string',
          title: '按钮标题',
          'x-component': 'Input',
        },
        type: {
          type: 'string',
          title: '类型',
          'x-component': 'Select',
          enum: [
            { label: '主要', value: 'primary' },
            { label: '次要', value: 'default' },
            { label: '危险', value: 'danger' },
            { label: '虚线', value: 'dashed' },
            { label: '链接', value: 'link' },
            { label: '文本', value: 'text' },
          ],
        },
        icon: {
          type: 'string',
          title: '图标',
          'x-component': 'Select',
          enum: [
            { label: '搜索', value: 'SearchOutlined' },
            { label: '添加', value: 'PlusOutlined' },
            { label: '删除', value: 'DeleteOutlined' },
            { label: '编辑', value: 'EditOutlined' },
            { label: '设置', value: 'SettingOutlined' },
          ],
        },
      },
      defaultParams: {
        type: 'primary',
      },
      // 步骤处理函数，设置模型属性
      handler(ctx, params) {
        console.log('Setting props:', params);
        ctx.model.setProps('children', params.title);
        ctx.model.setProps('type', params.type);
        const icon = params.icon ? React.createElement(icons[params.icon]) : undefined;
        ctx.model.setProps('icon', icon);
      },
    },
  },
});

MyModel.registerFlow(myPropsFlow);
```

2. model 实例，去掉 props 改为 stepParams 参数

```diff
const model = this.flowEngine.createModel({
    uid: 'my-model',
    use: 'MyModel',
-   props: {
-       type: 'primary',
-       children: 'Primary Button',
-   },
+   stepParams: {
+       myPropsFlow: {
+           setProps: {
+               title: 'Primary Button',
+               type: 'primary',
+           },
+       },
+   },
});
```

**为什么不用 props？**
因为有些 props 并不是可序列化的数据，比如 icon，在 step 可以转换为 React 组件。

```ts
handler(ctx, params) {
  const icon = params.icon ? React.createElement(icons[params.icon]) : undefined;
  ctx.model.setProps('icon', icon);
},
```

3. 启用 Flow 配置

```diff
- <FlowModelRenderer model={model} />
+ <FlowModelRenderer model={model} showFlowSettings />
```

第三步：为按钮支持事件流的配置

<code src="./demos/quickstart-3-register-eventflow.tsx"></code>

几个重点改动

1. 支持事件流触发

```ts
class MyModel extends FlowModel {
  render() {
    console.log('Rendering MyModel with props:', this.props);
    return (
      <Button
        {...this.props}
        onClick={(event) => {
          this.dispatchEvent('onClick', { event });
        }}
      />
    );
  }
}
```

2. 新增事件流的配置

```ts
const myEventFlow = defineFlow({
  key: 'myEventFlow',
  on: {
    eventName: 'onClick',
  },
  title: '按钮事件',
  steps: {
    confirm: {
      title: '确认操作配置',
      uiSchema: {
        title: {
          type: 'string',
          title: '弹窗提示标题',
          'x-component': 'Input',
        },
        content: {
          type: 'string',
          title: '弹窗提示内容',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        title: '确认操作',
        content: '你点击了按钮，是否确认？',
      },
      handler(ctx, params) {
        Modal.confirm({
          ...params,
        });
      },
    },
  },
});
```
