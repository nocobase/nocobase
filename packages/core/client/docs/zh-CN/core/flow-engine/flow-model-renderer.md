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

  /** 是否跳过自动应用流程，默认 false */
  skipApplyAutoFlows?: boolean; // 默认 false

  /** 当 skipApplyAutoFlows !== false 时，传递给 useApplyAutoFlows 的额外上下文 */
  extraContext?: Record<string, any>
}
```

### Props 详细说明

- **model**: 要渲染的 FlowModel 实例
- **uid**: 流程模型的唯一标识符
- **showFlowSettings**: 是否显示流程设置入口，如按钮、菜单等
- **flowSettingsVariant**: 流程设置的交互风格
  - `dropdown`: 下拉菜单形式（默认）
  - `contextMenu`: 右键上下文菜单
  - `modal`: 模态框形式（待实现）
  - `drawer`: 抽屉形式（待实现）
- **skipApplyAutoFlows**: 是否跳过自动应用流程。当设为 `true` 时，组件不会调用 `useApplyAutoFlows` hook
- **extraContext**: 额外的上下文数据，当 `skipApplyAutoFlows` 为 `false` 时传递给 `useApplyAutoFlows` hook

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

// 跳过自动应用流程
<FlowModelRenderer 
  model={model} 
  skipApplyAutoFlows={true}
/>

// 传递额外上下文
<FlowModelRenderer 
  model={model} 
  extraContext={{ customData: 'value' }}
/>

// 完整配置示例
<FlowModelRenderer 
  model={model}
  uid="unique-flow-id"
  showFlowSettings={true}
  flowSettingsVariant="contextMenu"
  skipApplyAutoFlows={false}
  extraContext={{ 
    userId: 123,
    permissions: ['read', 'write']
  }}
/>
```

## 使用场景

### 1. 基础渲染
当只需要渲染流程模型内容时，使用最简配置：

```tsx | pure
<FlowModelRenderer model={flowModel} />
```

### 2. 带设置功能的渲染
当需要用户能够配置流程时，启用流程设置：

```tsx | pure
<FlowModelRenderer 
  model={flowModel} 
  showFlowSettings={true}
  flowSettingsVariant="dropdown"
/>
```

### 3. 自定义流程控制
当需要手动控制流程应用时，可以跳过自动流程：

```tsx | pure
<FlowModelRenderer 
  model={flowModel} 
  skipApplyAutoFlows={true}
/>
```

### 4. 传递自定义上下文
当需要向流程传递特定上下文数据时：

```tsx | pure
<FlowModelRenderer 
  model={flowModel} 
  extraContext={{
    currentUser: user,
    formData: formValues,
    permissions: userPermissions
  }}
/>
```
