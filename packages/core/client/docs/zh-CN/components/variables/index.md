# Variables 变量组件

NocoBase 提供了一套完整的变量处理组件，用于在各种场景中处理动态变量的输入、选择和编辑。

## 组件概览

### VariableInput - 统一变量输入组件

VariableInput 是一个统一的变量输入组件，支持静态值输入和动态变量选择。

**主要特性**:
- 支持静态值输入和动态变量选择
- 通过 converters 机制提供高度可定制性
- 支持多种显示形态（显示/隐藏值输入组件）
- 支持 Null 值和 Constant 常量处理
- 组件间交互支持

**适用场景**:
- 表单字段的动态值配置
- 过滤条件中的变量输入
- 简单的变量选择需求

[查看 VariableInput 详细文档 →](./variable-input)

### SlateVariableEditor - 智能变量编辑器 ⭐️

基于 Slate.js 构建的专业变量编辑器，是**目前最推荐的变量编辑解决方案**。

**主要特性**:
- 基于 Slate.js 富文本编辑器框架
- 变量作为原子单位，不可拆分编辑
- 完善的键盘导航和编辑功能
- 支持单行和多行编辑模式
- 完整的撤销/重做支持

**适用场景**:
- 邮件模板编辑
- 通知模板配置
- 表达式编辑
- 任何需要在长文本中插入变量的复杂场景

[查看 SlateVariableEditor 详细文档 →](./slate-variable-editor)

## 选择指南

| 需求场景 | 推荐组件 | 理由 |
|---------|---------|------|
| 简单的变量选择 | VariableInput | 轻量级，配置简单 |
| 需要输入静态值 | VariableInput | 支持静态值和变量的混合输入 |
| 文本模板编辑 | SlateVariableEditor | 专业的文本编辑体验 |
| 复杂的变量编辑 | SlateVariableEditor | 强大的编辑能力，推荐方案 |
| 邮件/通知模板 | SlateVariableEditor | 最适合的解决方案 |

## 核心概念

### MetaTree
所有变量组件都依赖于 `metaTree`，这是一个描述可选变量结构的元数据树。

### FlowContext
通过 `FlowContext` 定义和管理上下文变量，为组件提供变量数据源。

### Converters
VariableInput 通过 converters 机制实现值与路径的双向转换，支持高度定制化。