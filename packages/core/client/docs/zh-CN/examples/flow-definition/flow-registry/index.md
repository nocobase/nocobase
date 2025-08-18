# `model.flowRegistry`

`model.flowRegistry` 用于实例化的 model 动态注册和管理流（Flow），支持本地化操作与持久化操作。

---

<code src="./demos/basic.tsx"></code>

<code src="./demos/flow-registry.tsx"></code>

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

