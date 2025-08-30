# FlowHooks

Flow Engine 提供了一系列 React Hooks 来简化 FlowModel 的使用和流程执行。

## Model Hooks

### useFlowModel

从 React Context 中获取 FlowModel 实例，避免 prop drilling。

```tsx
import { FlowModelProvider, useFlowModel } from '@nocobase/flow-engine';

// 提供 model 上下文
<FlowModelProvider model={model}>
  <ChildComponent />
</FlowModelProvider>

// 在子组件中获取 model
const ChildComponent = () => {
  const model = useFlowModel<MyFlowModel>();
  return <div>{model.uid}</div>;
};
```

**参数**：无
**返回值**：`T extends FlowModel` - FlowModel 实例
**异常**：如果在 FlowModelProvider 外部使用会抛出错误

### useFlowModelById

根据 UID 获取或创建 FlowModel 实例。

```tsx
import { useFlowModelById } from '@nocobase/flow-engine';

const MyComponent = () => {
  const model = useFlowModelById<MyFlowModel>(
    'my-model-uid',
    'MyFlowModel',
    { defaultFlow: { step1: { name: 'test' } } }
  );

  return <div>{model.props.name}</div>;
};
```

**参数**：
- `uid: string` - 模型唯一标识
- `modelClassName?: string` - 模型类名（用于创建新实例）
- `stepParams?: StepParams` - 初始步骤参数

**返回值**：`T extends FlowModel` - FlowModel 实例

## 流程执行 Hooks
