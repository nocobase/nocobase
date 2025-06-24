# Step Settings with Drawer Support

这个功能扩展了 flow-engine 的步骤配置功能，支持根据步骤配置的 `settingMode` 属性自动选择使用对话框 (Dialog) 或抽屉 (Drawer) 来显示配置界面。

## 功能特性

- **自动模式选择**: 根据步骤的 `settingMode` 配置自动选择 Dialog 或 Drawer
- **向后兼容**: 默认使用 Dialog 模式，不影响现有代码
- **统一接口**: 提供统一的 `openStepSettings` 函数，简化使用
- **类型安全**: 完整的 TypeScript 类型支持

## 使用方法

### 1. 在步骤定义中配置 settingMode

```typescript
// 使用对话框模式 (默认)
const dialogStep = {
  title: '对话框步骤',
  use: 'someAction',
  // settingMode: 'dialog', // 可以省略，默认为 'dialog'
  uiSchema: {
    // ... 配置项
  }
};

// 使用抽屉模式
const drawerStep = {
  title: '抽屉步骤',
  use: 'someAction',
  settingMode: 'drawer', // 配置为抽屉模式
  uiSchema: {
    // ... 配置项
  }
};
```

### 2. 注册流程时使用

```typescript
MyModel.registerFlow({
  key: 'myFlow',
  title: '我的流程',
  steps: {
    step1: {
      title: '步骤1',
      use: 'myAction',
      settingMode: 'dialog', // 使用对话框
      uiSchema: { /* ... */ }
    },
    step2: {
      title: '步骤2', 
      use: 'myAction',
      settingMode: 'drawer', // 使用抽屉
      uiSchema: { /* ... */ }
    }
  }
});
```

### 3. 程序化调用

```typescript
import { openStepSettings, getStepSettingMode } from './StepSettings';

// 自动选择模式
await openStepSettings({
  model: myModel,
  flowKey: 'myFlow',
  stepKey: 'step1',
  width: 800,
  title: '自定义标题'
});

// 检查步骤的设置模式
const mode = getStepSettingMode(myModel, 'myFlow', 'step1');
console.log(mode); // 'dialog' 或 'drawer'
```

## API 参考

### openStepSettings(props)

统一的步骤设置入口函数，根据步骤配置自动选择 Dialog 或 Drawer。

**参数:**
- `model`: 模型实例
- `flowKey`: 流程键
- `stepKey`: 步骤键  
- `width?`: 对话框/抽屉宽度，默认 600
- `title?`: 自定义标题

**返回:** `Promise<any>` - 表单提交的值

### getStepSettingMode(model, flowKey, stepKey)

获取步骤的设置模式。

**返回:** `'dialog' | 'drawer' | null`

### isStepUsingDrawerMode(model, flowKey, stepKey)

检查步骤是否使用抽屉模式。

**返回:** `boolean`

## 选择指南

### 何时使用 Dialog
- 简单的配置项 (< 5个字段)
- 快速设置场景
- 移动端友好的界面

### 何时使用 Drawer  
- 复杂的配置项 (> 5个字段)
- 需要更大显示空间的场景
- 多步骤或分组配置
- 需要预览效果的配置

## 实现细节

该功能通过以下文件实现:

- `StepSettings.tsx`: 统一入口和模式判断逻辑
- `StepSettingsDrawer.tsx`: 抽屉模式实现
- `StepSettingsDialog.tsx`: 对话框模式实现 (原有)
- `types.ts`: 类型定义扩展

所有现有的 `FlowsFloatContextMenu` 和 `FlowsDropdownButton` 组件都已更新为使用新的统一接口。
