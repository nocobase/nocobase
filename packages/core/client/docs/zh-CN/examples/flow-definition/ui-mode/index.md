# uiMode - 步骤设置的 UI 模式

`uiMode` 用于控制步骤配置界面的显示方式，支持静态配置和函数式动态配置。

## 类型定义

```ts
export type StepUIMode =
  | 'dialog'
  | 'drawer'
  | { type: 'dialog'; props?: Record<string, any> }
  | { type: 'drawer'; props?: Record<string, any> };

// 步骤定义中的 uiMode 支持函数式
interface StepDefinition {
  uiMode?: StepUIMode | ((ctx: FlowRuntimeContext) => StepUIMode | Promise<StepUIMode>);
}
```

## 示例

### 1. 基础完整示例

包含完整 uiSchema 的主要示例：

<code src="./index.tsx"></code>

### 2. 基础用法 - 字符串形式的 uiMode

展示最简单的字符串形式 uiMode 用法：

<code src="./basic.tsx"></code>

### 3. 带属性示例 - 对象形式的 uiMode

展示如何使用对象形式设置对话框/抽屉的属性：

<code src="./with-props.tsx"></code>

### 4. 函数式示例 - 动态配置

展示函数式 uiMode 的强大功能，根据上下文动态配置：

<code src="./functional.tsx"></code>

## 主要特性

- **静态配置**: 支持字符串 (`'dialog'`, `'drawer'`) 和对象形式
- **动态配置**: 支持函数式配置，可根据上下文动态决定 UI 模式
- **属性传递**: 支持向对话框/抽屉传递自定义属性（宽度、样式等）
- **异步支持**: 函数式 uiMode 支持异步操作
