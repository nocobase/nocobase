# `model.flowRegistry`

`model.flowRegistry` 用于实例化的 model 动态注册和管理流（Flow），支持本地化操作与持久化操作。

---

<code src="./demos/basic.tsx"></code>

<code src="./demos/flow-registry.tsx"></code>

## 全局流与实例流

模型支持两种流注册方式：类级别的全局流和实例级别的实例流。全局流由所有实例共享，实例流仅该实例可用。

### 统一的 `registerFlow` API

- **类级别（全局流）**：`ModelClass.registerFlow(key, definition)`
- **实例级别（实例流）**：`model.registerFlow(key, definition)`

<code src="./demos/global-and-instance-flows.tsx"></code>

```ts
const flows = flowRegistry.getFlows();
const flow = flowRegistry.getFlow(flowKey);

flowRegistry.mapFlows((flow) => {
  return <FlowComponent flow={flow} />
});

const flow = flowRegistry.addFlow('flow1', { title: 'Flow1' });
await flow.save();
flow.title = 'Flow Edited';
await flow.save();
flow.remove();
await flow.destroy();

flow.mapSteps((step) => {
  return <StepComponent step={step} />
});

const step = flow.addStep('step1', { title: 'Step 1' });
await step.save();
step.title = 'Step Edited';
step.save();
step.remove();
await step.destroy();
```

