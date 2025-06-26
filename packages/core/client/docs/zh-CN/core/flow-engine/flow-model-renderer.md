# FlowModelRenderer

`FlowModelRenderer` 是 NocoBase 流引擎中用于渲染和交互单个模型（FlowModel）的基础组件。它负责展示模型的主要内容，并可通过不同方式集成流设置（FlowModelSettings），实现流的快捷管理与配置。

## Props 说明

```ts
interface FlowModelRendererProps {
  model?: FlowModel;
  uid?: string;

  /** 是否显示流设置入口（如按钮、菜单等） */
  showFlowSettings?: boolean; // 默认 false

  /** 流设置的交互风格 */
  flowSettingsVariant?: 'dropdown' | 'contextMenu' | 'modal' | 'drawer'; // 默认 'dropdown'

  /** 是否在设置中隐藏移除按钮 */
  hideRemoveInSettings?: boolean; // 默认 false

  /** 是否跳过自动应用流，默认 false */
  skipApplyAutoFlows?: boolean; // 默认 false

  /** 当 skipApplyAutoFlows !== false 时，传递给 useApplyAutoFlows 的额外上下文 */
  extraContext?: Record<string, any>

  /** 设置菜单层级：1=仅当前模型(默认)，2=包含子模型 */
  settingsMenuLevel?: number; // 默认 1

  /** 额外的工具栏项目，仅应用于此实例 */
  extralToolbarItems?: ToolbarItemConfig[];
}
```

### Props 详细说明

- **model**: 要渲染的 FlowModel 实例
- **uid**: 流模型的唯一标识符
- **showFlowSettings**: 是否显示流设置入口，如按钮、菜单等
- **flowSettingsVariant**: 流设置的交互风格
  - `dropdown`: 下拉菜单形式（默认）
  - `contextMenu`: 右键上下文菜单
  - `modal`: 模态框形式（待实现）
  - `drawer`: 抽屉形式（待实现）
- **hideRemoveInSettings**: 是否在设置中隐藏移除按钮，当设为 `true` 时，流设置菜单中不会显示删除/移除选项
- **skipApplyAutoFlows**: 是否跳过自动应用流。当设为 `true` 时，组件不会调用 `useApplyAutoFlows` hook
- **extraContext**: 额外的上下文数据，当 `skipApplyAutoFlows` 为 `false` 时传递给 `useApplyAutoFlows` hook
- **settingsMenuLevel**: 设置菜单层级，控制设置菜单的显示范围
  - `1`: 仅显示当前模型的设置（默认）
  - `2`: 包含子模型的设置
- **extralToolbarItems**: 额外的工具栏项目，仅应用于此实例

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

// 显示设置但隐藏移除按钮
<FlowModelRenderer 
  model={model} 
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>

// 跳过自动应用流
<FlowModelRenderer 
  model={model} 
  skipApplyAutoFlows={true}
/>

// 传递额外上下文
<FlowModelRenderer 
  model={model} 
  extraContext={{ customData: 'value' }}
/>

// 设置菜单层级示例
<FlowModelRenderer 
  model={model} 
  showFlowSettings 
  settingsMenuLevel={2} // 包含子模型设置
/>

// 完整配置示例
<FlowModelRenderer 
  model={model}
  uid="unique-flow-id"
  showFlowSettings={true}
  flowSettingsVariant="contextMenu"
  hideRemoveInSettings={false}
  skipApplyAutoFlows={false}
  settingsMenuLevel={2}
  extraContext={{ 
    userId: 123,
    permissions: ['read', 'write']
  }}
/>
```

## 使用场景

### 1. 基础渲染
当只需要渲染流模型内容时，使用最简配置：

```tsx | pure
<FlowModelRenderer model={flowModel} />
```

### 2. 带设置功能的渲染
当需要用户能够配置流时，启用流设置：

```tsx | pure
<FlowModelRenderer 
  model={flowModel} 
  showFlowSettings={true}
  flowSettingsVariant="dropdown"
/>
```

### 3. 带设置但禁用删除功能
当需要流设置但不允许用户删除时：

```tsx | pure
<FlowModelRenderer 
  model={flowModel} 
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>
```

### 4. 自定义流控制
当需要手动控制流应用时，可以跳过自动流：

```tsx | pure
<FlowModelRenderer 
  model={flowModel} 
  skipApplyAutoFlows={true}
/>
```

### 5. 传递自定义上下文
当需要向流传递特定上下文数据时：

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

### 6. 控制设置菜单层级
当需要控制设置菜单显示范围时，可以通过 `settingsMenuLevel` 参数配置：

```tsx | pure
// 仅显示当前模型设置（默认）
<FlowModelRenderer 
  model={flowModel} 
  showFlowSettings
  settingsMenuLevel={1}
/>

// 包含子模型设置
<FlowModelRenderer 
  model={flowModel} 
  showFlowSettings
  settingsMenuLevel={2}
/>
```

适用于嵌套模型结构中显示子模型设置，比如表格列模型需要配置字段子模型设置时。
