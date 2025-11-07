# FlowModel 事件流与配置化

FlowModel 提供了一种基于「事件流（Flow）」的方式来实现组件的配置化逻辑，使组件的行为和配置更具扩展性与可视化。

## 自定义 Model

你可以通过继承 `FlowModel` 来创建自定义组件模型。模型需要实现 `render()` 方法来定义组件的渲染逻辑。

```ts
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}
```

## 注册 Flow（事件流）

每个模型可以注册一个或多个 **Flow**，用于描述组件的配置逻辑与交互步骤。

```ts
MyModel.registerFlow({
  key: 'buttonSettings',
  title: '按钮设置',
  steps: {
    general: {
      title: '通用配置',
      uiSchema: {
        title: {
          type: 'string',
          title: '按钮标题',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      defaultParams: {
        type: 'primary',
      },
      handler(ctx, params) {
        ctx.model.setProps('children', params.title);
        ctx.model.setProps('type', params.type);
      },
    },
  },
});
```

说明

-   `key`：Flow 的唯一标识。
-   `title`：Flow 的名称，用于 UI 展示。
-   `steps`：定义配置步骤（Step）。每个步骤包括：
    -   `title`：步骤标题。
    -   `uiSchema`：配置表单结构（兼容 Formily Schema）。
    -   `defaultParams`：默认参数。
    -   `handler(ctx, params)`：保存时触发，用于更新模型状态。

## 渲染 Model

在渲染组件模型时，可以通过 `showFlowSettings` 参数来控制是否启用配置化功能。若启用 `showFlowSettings`，组件右上角将自动显示配置入口（如设置图标或按钮）。

```ts
<FlowModelRenderer model={model} showFlowSettings />
```

## 使用 openFlowSettings 手动打开配置表单

除了通过内置交互入口打开配置表单，也可以在代码中手动调用
`openFlowSettings()`。

``` ts
flowSettings.open(options: FlowSettingsOpenOptions): Promise<boolean>;
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>): Promise<boolean>;
```

### 参数定义

``` ts
interface FlowSettingsOpenOptions {
  model: FlowModel;               // 必填，所属模型实例
  preset?: boolean;               // 仅渲染标记为 preset=true 的步骤（默认 false）
  flowKey?: string;               // 指定单个 Flow
  flowKeys?: string[];            // 指定多个 Flow（当同时提供 flowKey 时被忽略）
  stepKey?: string;               // 指定单个步骤（通常与 flowKey 搭配）
  uiMode?: 'dialog' | 'drawer';   // 表单展示容器，默认 'dialog'
  onCancel?: () => void;          // 点击取消时回调
  onSaved?: () => void;           // 配置保存成功后回调
}
```

### 示例：以 Drawer 模式打开特定 Flow 的配置表单

``` ts
await model.openFlowSettings({
  flowKey: 'buttonSettings',
  uiMode: 'drawer',
  onSaved: () => {
    console.log('按钮配置已保存');
  },
});
```