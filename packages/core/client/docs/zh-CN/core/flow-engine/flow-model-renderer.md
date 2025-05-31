# FlowModelRenderer

`FlowModelRenderer` 是 NocoBase 流程引擎中用于渲染和交互单个模型（FlowModel）的基础组件。它负责展示模型的主要内容，并可通过不同方式集成流程设置（FlowModelSettings），实现流程的快捷管理与配置。

## Props 说明

```ts
interface FlowModelRendererProps {
  model?: FlowModel;
  uid?: string;

  /** 是否显示流程设置入口（如按钮、菜单等） */
  showFlowSettings?: boolean; // 默认 false

  /** 流程设置的交互风格 */
  flowSettingsVariant?: 'dropdown' | 'contextMenu' | 'modal' | 'drawer'; // 默认 'dropdown'
}
```

## 主要示例

```tsx | pure
// 基础示例
<FlowModelRenderer model={model} />

// 显示 flow settings
<FlowModelRenderer 
  model={model} 
  showFlowSettings 
  flowSettingsVariant={'dropdown'}
/>
```
