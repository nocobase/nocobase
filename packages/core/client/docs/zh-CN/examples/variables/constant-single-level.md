# Constant 单层上下文 - 基础常量定义

本示例展示如何使用 `FlowContext.defineProperty()` 定义单层的常量上下文，并通过自定义 `converters` 来为这些常量选择合适的输入组件。

## 功能特点

### 1. 单层常量定义

通过 `FlowContext.defineProperty()` 可以直接定义简单的常量值：

```typescript
// 定义字符串常量
flowContext.defineProperty('appName', {
  value: 'NocoBase',
  meta: {
    title: 'Application Name', 
    type: 'string'
  }
});

// 定义数字常量
flowContext.defineProperty('version', {
  value: 1.0,
  meta: {
    title: 'Version',
    type: 'number'
  }
});
```

### 2. 组件自动选择

使用自定义的 `converters` 可以根据常量的类型自动选择合适的输入组件：

- **字符串常量** → `Input` 组件
- **数字常量** → `InputNumber` 组件  
- **布尔常量** → `Switch` 组件
- **日期常量** → `DatePicker` 组件

### 3. 智能渲染机制

当用户选择常量变量时，会显示为 `VariableTag`；当清除变量回到静态值时，会根据常量的类型自动切换到对应的输入组件。

## 使用场景

这种单层常量定义特别适合以下场景：

- **应用配置**: 应用名称、版本号、环境变量等
- **用户偏好**: 主题色、语言设置、默认值等
- **系统状态**: 当前时间、在线状态、计数器等
- **业务常量**: 税率、汇率、默认价格等

## 核心实现

```typescript
const constantConverters: Converters = {
  renderInputComponent: (meta, value) => {
    if (!meta) { // 静态值模式
      if (typeof value === 'number') {
        return (props) => <InputNumber {...props} />;
      }
      if (typeof value === 'boolean') {
        return (props) => <Switch checked={props.value} onChange={props.onChange} />;
      }
      // 默认使用 Input 组件（字符串）
      return null;
    }
    // 变量模式使用默认的 VariableTag
    return null;
  },
};
```

## 演示内容

<code src="./constant-single-level.tsx"></code>

## 相关文档

- [VariableInput 组件文档](./index.md)
- [自定义 Converters](./custom-converters.md)
- [二层常量上下文示例](./constant-multi-level.md)