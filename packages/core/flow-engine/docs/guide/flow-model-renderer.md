# 渲染 FlowModel

FlowModelRenderer 是用于渲染 FlowModel 的核心 React 组件，它负责将 FlowModel 实例转换为可视化的 React 组件。

## 基本使用

### FlowModelRenderer

```tsx | pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

// 基本使用
<FlowModelRenderer model={myModel} />
```

### FieldModelRenderer

对于受控的字段 Model，使用 FieldModelRenderer 渲染：

```tsx | pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

// 受控字段渲染
<FieldModelRenderer model={fieldModel} />
```

## Props 参数

### FlowModelRendererProps

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `model` | `FlowModel` | - | 要渲染的 FlowModel 实例 |
| `uid` | `string` | - | 流程模型的唯一标识符 |
| `fallback` | `React.ReactNode` | `<Skeleton.Button size="small" />` | 渲染失败时的回退内容 |
| `showFlowSettings` | `boolean \| object` | `false` | 是否显示流程设置入口 |
| `flowSettingsVariant` | `'dropdown' \| 'contextMenu' \| 'modal' \| 'drawer'` | `'dropdown'` | 流程设置的交互风格 |
| `hideRemoveInSettings` | `boolean` | `false` | 是否在设置中隐藏移除按钮 |
| `showTitle` | `boolean` | `false` | 是否在边框左上角显示模型标题 |
| `skipApplyAutoFlows` | `boolean` | `false` | 是否跳过自动应用流程 |
| `inputArgs` | `Record<string, any>` | - | 传递给 useApplyAutoFlows 的额外上下文 |
| `showErrorFallback` | `boolean` | `true` | 是否在最外层包装 FlowErrorFallback 组件 |
| `settingsMenuLevel` | `number` | - | 设置菜单层级：1=仅当前模型，2=包含子模型 |
| `extraToolbarItems` | `ToolbarItemConfig[]` | - | 额外的工具栏项目 |

### showFlowSettings 详细配置

当 `showFlowSettings` 为对象时，支持以下配置：

```tsx
showFlowSettings={{
  showBackground: true,    // 显示背景
  showBorder: true,        // 显示边框
  showDragHandle: true,    // 显示拖拽手柄
  style: {},              // 自定义工具栏样式
  toolbarPosition: 'inside' // 工具栏位置：'inside' | 'above'
}}
```

## 渲染生命周期

整个渲染周期会按顺序调用以下方法：

1. **model.dispatchEvent('beforeRender')** - 渲染前事件
2. **model.render()** - 执行模型渲染方法
3. **model.onMount()** - 组件挂载钩子
4. **model.onUnmount()** - 组件卸载钩子

## 使用示例

### 基本渲染

```tsx | pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

function MyComponent() {
  const model = useFlowModel();
  
  return (
    <FlowModelRenderer 
      model={model}
      fallback={<div>加载中...</div>}
    />
  );
}
```

### 带流程设置的渲染

```tsx | pure
// 显示设置但隐藏删除按钮
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>

// 显示设置和标题
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  showTitle={true}
/>

// 使用右键菜单模式
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  flowSettingsVariant="contextMenu"
  hideRemoveInSettings={true}
/>
```

### 自定义工具栏

```tsx | pure
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  extraToolbarItems={[
    {
      key: 'custom-action',
      title: '自定义操作',
      icon: 'SettingOutlined',
      onClick: () => {
        console.log('自定义操作');
      }
    }
  ]}
/>
```

### 跳过自动流程

```tsx | pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
  showErrorFallback={false}
/>
```

### 字段模型渲染

```tsx | pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

function FormField({ model, onChange, ...props }) {
  return (
    <FieldModelRenderer
      model={model}
      onChange={onChange}
      {...props}
    />
  );
}
```

## 错误处理

FlowModelRenderer 内置了完善的错误处理机制：

- **自动错误边界**：默认启用 `showErrorFallback={true}`
- **自动流程错误**：捕获并处理自动流程执行中的错误
- **渲染错误**：当模型渲染失败时显示回退内容

```tsx | pure
<FlowModelRenderer
  model={myModel}
  showErrorFallback={true}
  fallback={<div>渲染失败，请重试</div>}
/>
```

## 性能优化

### 跳过自动流程

对于不需要自动流程的场景，可以跳过以提高性能：

```tsx | pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
/>
```

### 响应式更新

FlowModelRenderer 使用 `@formily/reactive-react` 的 `observer` 进行响应式更新，确保模型状态变化时组件能够自动重新渲染。

## 注意事项

1. **模型验证**：确保传入的 `model` 具有有效的 `render` 方法
2. **生命周期管理**：模型的生命周期钩子会在适当的时机被调用
3. **错误边界**：建议在生产环境中启用错误边界以提供更好的用户体验
4. **性能考虑**：对于大量模型渲染的场景，考虑使用 `skipApplyAutoFlows` 选项
