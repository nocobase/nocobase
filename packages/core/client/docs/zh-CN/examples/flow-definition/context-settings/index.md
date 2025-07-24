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
