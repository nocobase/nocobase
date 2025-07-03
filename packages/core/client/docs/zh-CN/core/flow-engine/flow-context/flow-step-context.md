# FlowStepContext

`FlowStepContext` 是每个流程步骤（step）在执行时创建的上下文对象。它**继承自 `FlowRuntimeContext`**，并额外包含当前步骤的定义（`currentStep`），用于在步骤 handler 或 UI 层访问当前步骤的专属数据。

---

## 设计说明

- `FlowStepContext` 继承了 `FlowRuntimeContext` 的全部属性和方法，步骤 handler 可以直接访问流程级别的上下文能力。
- 仅在 `FlowStepContext` 上补充了 `currentStep` 属性，表示当前正在执行的步骤定义（如 stepKey、参数、元数据等）。
- 这种设计简洁、易扩展，便于未来为步骤级扩展更多能力。

---

## 主要属性

| 属性/方法         | 说明                                                                                  |
|------------------|---------------------------------------------------------------------------------------|
| `ctx.currentStep`| 当前步骤的定义对象，包含 stepKey、参数、元数据等。                                      |
| ...              | 继承自 `FlowRuntimeContext` 的所有属性和方法（如 traceId、stepResults、inputArgs 等）。 |

---

## 生命周期与作用范围

- 每当流程（Flow）执行到某个步骤时，都会基于当前的 `FlowRuntimeContext` 创建一个新的 `FlowStepContext`。
- `FlowStepContext` 仅在当前步骤 handler 执行期间有效，步骤执行结束后自动销毁。
- 在 UI 层（如 UISchema 组件）中，也可以通过 hook 获取当前步骤的上下文。

---

## 用法示例

### 1. 在 UISchema 组件中使用

在 `UISchema` 组件中，可以通过自定义 hook `useFlowStepContext` 获取当前步骤的上下文，便于在 UI 层访问和操作当前 step 的数据。

```ts
import { useFlowStepContext } from '@nocobase/flow-engine';

function MyStepComponent() {
  const ctx = useFlowStepContext();
  const stepKey = ctx.currentStep.stepKey;
  const uiSchema = ctx.currentStep.uiSchema;
  const params = ctx.currentStep.params;
  // ...
}
```

---

## 总结

- `FlowStepContext` 让每个步骤 handler 和 UI 层都能方便地访问当前步骤和流程级上下文。
- 继承自 `FlowRuntimeContext`，仅补充了 `currentStep`，结构简洁、易于维护和扩展。
- 推荐在复杂流程、需要步骤级扩展能力的场景下使用
