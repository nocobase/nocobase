# FlowModelRenderer

`FlowModelRenderer` 是 NocoBase 流引擎中用于渲染和交互单个模型（FlowModel）的基础组件。它负责展示模型的主要内容，并可通过不同方式集成流设置（FlowModelSettings），实现流的快捷管理与配置。

## Props 说明

```ts
interface FlowModelRendererProps {
  model?: FlowModel;
  uid?: string;

  /** 执行 beforeRender 期间的回退内容（如 loading 占位） */
  fallback?: React.ReactNode;

  /** 是否显示流设置入口（如按钮、菜单等） */
  showFlowSettings?:
    | boolean
    | {
        /** 是否显示设置入口（对象形态默认 true） */
        enabled?: boolean;
        /**
         * 是否递归影响子 Model 的「是否开启」：
         * - 仅继承 enabled，不继承 showBorder/style 等外观配置
         * - 子节点显式配置优先级更高；但仅影响自身，除非也设置 recursive:true
         */
        recursive?: boolean;
        showBackground?: boolean;
        showBorder?: boolean;
        showDragHandle?: boolean;
        style?: React.CSSProperties;
        toolbarPosition?: 'inside' | 'above' | 'below';
      }; // 默认 false

  /** 流设置的交互风格 */
  flowSettingsVariant?: 'dropdown' | 'contextMenu' | 'modal' | 'drawer'; // 默认 'dropdown'

  /** 是否在设置中隐藏移除按钮 */
  hideRemoveInSettings?: boolean; // 默认 false

  /** 是否在边框左上角显示模型 title */
  showTitle?: boolean; // 默认 false

  /** 传递给 beforeRender 事件的运行时参数 */
  inputArgs?: Record<string, any>;

  /** 是否在最外层包装 FlowErrorFallback 组件 */
  showErrorFallback?: boolean; // 默认 true

  /** 设置菜单层级：1=仅当前模型(默认)，2=包含子模型 */
  settingsMenuLevel?: number; // 默认 1

  /** 额外的工具栏项目，仅应用于此实例 */
  extraToolbarItems?: ToolbarItemConfig[];

  /** beforeRender 是否使用缓存（默认由模型层决定） */
  useCache?: boolean;
}
```

### Props 详细说明

- **model**: 要渲染的 FlowModel 实例
- **uid**: 流模型的唯一标识符
- **fallback**: 执行 `beforeRender` 期间的回退内容（如 loading 占位），默认 `null`
- **showFlowSettings**: 是否显示流设置入口，如按钮、菜单等
  - `boolean`: 直接开关（默认 `false`）
  - `object`: 细粒度配置（对象形态默认 `enabled: true`）
    - `enabled`: 显式控制当前模型是否显示设置入口
    - `recursive`: 仅递归传递 `enabled`（不继承 showBorder/style 等外观配置）
      - `true`: 将当前节点的 `enabled` 传递给子节点
      - `false`: 阻断上层递归继承（子节点不再继承 `enabled`）
      - 未设置: 不改变上层递归继承链（仅影响当前节点）
    - `showBackground/showBorder/showDragHandle/style/toolbarPosition`: 仅影响当前实例，不会递归继承
- **flowSettingsVariant**: 流设置的交互风格
  - `dropdown`: 下拉菜单形式（默认）
  - `contextMenu`: 右键上下文菜单
  - `modal`: 模态框形式（待实现）
  - `drawer`: 抽屉形式（待实现）
- **hideRemoveInSettings**: 是否在设置中隐藏移除按钮，当设为 `true` 时，流设置菜单中不会显示删除/移除选项
- **showTitle**: 是否在边框左上角显示模型 title（默认 `false`）
- **inputArgs**: 运行时参数，传递给 beforeRender 事件
- **showErrorFallback**: 是否在最外层包裹 `FlowErrorFallback` 错误兜底（默认 `true`）
- **settingsMenuLevel**: 设置菜单层级，控制设置菜单的显示范围
  - `1`: 仅显示当前模型的设置（默认）
  - `2`: 包含子模型的设置
- **extraToolbarItems**: 额外的工具栏项目，仅应用于此实例

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

// 递归影响子模型是否显示设置入口（仅继承 enabled）
<FlowModelRenderer model={model} showFlowSettings={{ recursive: true }} />

// 仅关闭当前模型（不影响后代，除非也设置 recursive:true）
<FlowModelRenderer model={model} showFlowSettings={{ enabled: false }} />

// 关闭并影响后代
<FlowModelRenderer model={model} showFlowSettings={{ enabled: false, recursive: true }} />

// 显示设置但隐藏移除按钮
<FlowModelRenderer 
  model={model} 
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>

// 传递 beforeRender 事件上下文
<FlowModelRenderer 
  model={model} 
  inputArgs={{ customData: 'value' }}
/>

// 传递额外上下文
<FlowModelRenderer 
  model={model} 
  inputArgs={{ customData: 'value' }}
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
  settingsMenuLevel={2}
  inputArgs={{
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

### 4. 传递自定义上下文
当需要向流传递特定上下文数据时：

```tsx | pure
<FlowModelRenderer 
  model={flowModel} 
  inputArgs={{
    currentUser: user,
    formData: formValues,
    permissions: userPermissions
  }}
/>
```

### 5. 控制设置菜单层级
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
