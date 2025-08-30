# 上下文（配置态）- FlowSettingsContext

FlowSettingsContext 是 FlowRuntimeContext 的 settings 模式，在打开流步骤的设置表单时创建，步骤参数保存之后销毁。

## 以下流步骤的设置表单打开时会创建 FlowSettingsContext

- `model.openStepSettingsDialog(flowKey: string, stepKey: string): Promise<any>`  
  打开某个流的某个步骤的配置表单。
- `model.openPresetStepSettingsDialog(): Promise<any>`  
  打开预设置的配置步骤，需要在初始化 Model 时填写。

## 示例代码

### 打开预设置的配置表单

使用 AddSubModelButton 创建子 Model 时，当子 Model 有预设置参数时，会唤起初始化的配置表单

<code src="./preset.tsx"></code>

### 打开某个流的某个步骤的配置表单

<code src="./openStepSettingsDialog.tsx"></code>


## TODO

```ts
type StepUIMode =
  | 'dialog'
  | 'drawer'
  | { type: 'dialog'; props?: Record<string, any> }
  | { type: 'drawer'; props?: Record<string, any> };

interface FlowSettingsOpenOptions {
  model: FlowModel;
  preset?: boolean; // 预设置的配置，创建时需要配置的步骤
  flowKey?: string; // 流标识
  flowKeys?: string[]; // 流标识
  stepKey?: string; // 某一个 step 标识
  uiMode?: StepUIMode; // UI 模式，默认为 dialog
};

flowEngine.flowSettings.open(options: FlowSettingsOpenOptions);
model.openFlowSettings(options: Omit<FlowSettingsOpenOptions, 'model'>);
```

### 一个 step 的配置表单

传参

```ts
{
  model,
  flowKey,
  stepKey
}
```

数据结构

- step1（平铺）

content 部分的展示方式

- 按**表单**方式展示
- 自定义

### 一个 flow 的所有 steps 的配置表单

传参

```ts
{
  model,
  flowKey
}
```

数据结构

- flow1（标题）
  - step1（折叠面板）
  - step2（折叠面板）
  - step3（折叠面板）

content 部分的展示方式

- 按**折叠面板**组件方式展示 step
- 按**表单**方式展示（只有一个 step 时）
- 自定义

### 预设置的步骤

打开预设置的配置步骤，需要在初始化 Model 时填写。

```ts
{
  model,
  preset: true,
}
```

数据结构

- flow1（标签页）
  - step1-1（折叠面板）
  - step1-2（折叠面板）
- flow2（标签页）
  - step2-1（折叠面板）
  - step2-1（折叠面板）

content 部分的展示方式

- Flow 按**标签页**分组、按**折叠面板**组件方式展示 step
- 按**表单**方式展示（只有一个 step 时）
- 自定义

### 所有流的配置

传参

```ts
{
  model,
}
```


数据结构

- flow1
  - step1-1
  - step1-2
- flow2
  - step2-1
  - step2-1

content 部分的展示方式

- Flow 按**标签页**分组、按**折叠面板**组件方式展示 step
- 按**表单**方式展示（只有一个 step 时）
- 自定义

:::info
静态流不能 Add step，动态流允许 Add/Remove step
:::

```ts
MyModel.registerFlow({
  xxx: true,
});
```
