# Variables - 变量输入组件

变量输入组件提供了强大的动态变量选择和静态值输入功能，包含 `FlowContextSelector` 和 `VariableInput` 两个核心组件。

## 组件概览

### FlowContextSelector
- 基于 antd Cascader 的上下文变量选择器
- 支持异步 metaTree 加载和懒加载子节点
- 支持搜索功能
- 支持 `{{ ctx.path }}` 格式的变量

### VariableInput
- 智能输入组件，统一了静态值输入和动态变量选择
- 基于 converters 机制提供高度可定制性
- 自动切换 Input 和 VariableTag 显示模式
- 使用 Space.Compact 实现统一布局

## 示例

### 1. 基础完整示例

包含 FlowContextSelector 和 VariableInput 的完整演示：

<code src="./index.tsx"></code>

### 2. FlowContextSelector 独立使用

展示如何单独使用 FlowContextSelector 组件：

<code src="./flow-context-selector.tsx"></code>

### 3. 自定义 Converters

展示如何使用自定义 converters 来定制组件行为：

<code src="./custom-converters.tsx"></code>

### 4. 函数式 Converters

展示如何使用函数式 converters 来根据不同的 meta 信息动态调整组件行为：

<code src="./functional-converters.tsx"></code>

### 5. Constant 单层上下文

展示如何定义单层常量并为不同类型选择合适的输入组件：

<code src="./constant-single-level.tsx"></code>

### 6. Constant 二层上下文

展示如何定义二层结构的常量，包括 Constant → number/string/date 等类型：

<code src="./constant-multi-level.tsx"></code>

## 主要特性

- **智能渲染**: 根据值类型自动选择 Input 或 VariableTag
- **可扩展性**: 通过 converters 机制支持任意自定义组件
- **异步支持**: 支持异步 metaTree 加载和懒加载
- **搜索功能**: 内置搜索过滤能力
- **类型安全**: 完整的 TypeScript 类型支持