# 自定义组件（配置表单）

本文介绍如何在流程定义的配置表单中注册和使用自定义组件。

## 注册全局的自定义组件

通过 `flowSettings.registerComponents()` 方法注册全局自定义组件。注册后，可在任意的流步骤的 UI Schema 中直接使用该组件。

```ts
this.flowEngine.flowSettings.registerComponents({ ColorPicker });
```

<code src="./index.tsx"></code>

## 获取配置态的上下文

在自定义组件内部，可以通过 `useFlowSettingsContext()` 获取配置态的上下文信息。

<code src="./ctx.tsx"></code>

## 自定义局部组件

无需全局注册，也可在某个流程步骤中直接使用 React 组件。

<code src="./component.tsx"></code>
