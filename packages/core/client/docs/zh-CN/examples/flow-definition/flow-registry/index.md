# `model.flowRegistry`

`model.flowRegistry` 用于实例化的 model 动态注册和管理流（Flow），支持本地化操作与持久化操作。

---

## 1. 初始化实例化流

在创建模型时可以传入 `flowRegistry` 进行初始化：

```ts
const model = engine.createModel({
  use: 'MyModel',
  flowRegistry: {
    flowKey: {
      on: 'click',
      steps: {}
    },
  },
});
```

内部实现：

```ts
class FlowModel {
  // 全局静态流，TODO：暂时还不支持动态注册
  static globalFlowRegistry = new GlobalFlowRegistry();
  flowRegistry: InstanceFlowRegistry;

  constructor(options) {
    this.flowRegistry = new InstanceFlowRegistry(this);
    this.flowRegistry.bulkRegister(options.flowRegistry);
  }

  applyFlow() {
    // TODO 改进
  }

  dispatchEvent() {
    // TODO 改进
  }
}
```

> **说明**：
> `globalFlowRegistry` 用于管理全局静态流，不受实例化影响。`flowRegistry` 用于每个模型实例的本地流注册。

---

## 2. `model.flowRegistry` API

### 本地化操作

```ts
// 单个流注册
model.flowRegistry.register(flowKey, flowDefinition);

// 批量注册
model.flowRegistry.bulkRegister({ flowKey: flowDefinition });

// 注销流
model.flowRegistry.unregister(flowKey);
```

### 持久化操作

```ts
// 持久化流
await model.flowRegistry.saveFlow(flowKey);

// 销毁持久化流
await model.flowRegistry.destroyFlow(flowKey);
```

### 内部实现示例

```ts
class FlowRegistry {
  constructor(protected model: FlowModel) {
    this.repository = new FlowRegistryRepository();
  }

  register(key, options) {}

  bulkRegister(flowMap: Record<string, FlowDefinition>) {}

  unregister(flowKey: string) {
    return this.model.unregisterInstanceFlow(flowKey);
  }

  async saveFlow(flowKeyOrDef: string | FlowDefinition) {
    await this.repository.saveFlow(flowKeyOrDef);
  }

  async destroyFlow(flowKeyOrDef: string | FlowDefinition) {
    await this.repository.destroyFlow(flowKeyOrDef);
  }

  async saveStep(flowStep: FlowStep) {
    await this.repository.saveStep(flowStep);
  }

  async destroyStep(flowStep: FlowStep) {
    await this.repository.destroyStep(flowStep);
  }
}
```

---

## 3. `FlowDefinition` API

用于定义单个流的步骤，并提供本地化和持久化操作。

```ts
const flowDef = new FlowDefinition();

// Step 操作
flowDef.addStep(stepKey, flowStep);
flowDef.setStep(stepKey, flowStep);
flowDef.getStep(stepKey);
flowDef.removeStep(stepKey);

// Step 持久化
await flowDef.saveStep(stepKey);
await flowDef.destroyStep(stepKey);

// Flow 持久化
await flowDef.save();
await flowDef.destroy();
```

### 内部实现示例

```ts
class FlowDefinition {
  constructor(protected flowRegistry: FlowRegistry) {
    this.flowRegistry = flowRegistry.getRepository();
  }

  getStep(stepKey: string) {}

  addStep(stepKey: string, flowStep: FlowStep) {}

  setStep(stepKey: string, flowStep: FlowStep) {}

  removeStep(stepKey: string) {}

  async saveStep(stepKey: string) {
    const flowStep = this.getStep(stepKey);
    await this.flowRegistry.saveStep(flowStep);
  }

  async destroyStep(stepKey: string) {
    const flowStep = this.getStep(stepKey);
    await this.flowRegistry.destroyStep(flowStep);
  }

  async save() {
    await this.flowRegistry.saveFlow(this);
  }

  async destroy() {
    await this.flowRegistry.destroyFlow(this);
  }
}
```
