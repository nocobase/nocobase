# 变量筛选项组件

变量筛选项组件用于在流程引擎中创建基于上下文变量的筛选条件。该组件允许用户选择上下文变量、设置操作符，并输入对应的筛选值。

## 基本示例

<code src="./demos/variable-filter-item-basic.tsx"></code>

## 功能特性

- 支持从上下文元数据树中选择变量
- 根据变量类型自动提供相应的操作符选项
- 动态验证和禁用不适用的输入项
- 与流程引擎上下文集成

## 约定

- 组件签名：`({ value, model }) => ReactNode`
- `value` 对象包含 `leftValue`（变量路径）、`operator`（操作符）、`rightValue`（筛选值）
- `model` 为 FlowModel 实例，提供上下文元数据树和翻译功能