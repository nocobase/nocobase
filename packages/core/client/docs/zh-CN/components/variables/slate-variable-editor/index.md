# SlateVariableEditor - 智能变量编辑器

SlateVariableEditor 基于 Slate.js 富文本编辑器框架构建，完美结合了 Slate 的强大编辑能力与 NocoBase 的组件生态。

## 特性

- **基于 Slate.js**: 利用成熟的富文本编辑器框架（8.7k+ GitHub stars）
- **完美集成**: 使用 `FlowContextSelector` 作为变量选择器，`InlineVariableTag` 作为变量显示组件
- **原子变量**: 变量作为 inline void 元素，作为原子单位不可编辑
- **精确控制**: 专业的光标控制和编辑体验
- **键盘导航**: 智能的键盘导航支持
- **完整功能**: 内置撤销/重做、文本选择、复制粘贴等标准编辑操作

## Props

- **value**: 编辑器内容的受控值（字符串）
- **onChange**: 内容变化时的回调函数
- **metaTree**: 上下文变量的元数据树
- **placeholder**: 占位符文本
- **multiline**: 是否启用多行编辑模式
- **triggerChars**: 触发变量选择器的字符（默认 `{{`）

## 适用场景

- 邮件模板编辑
- 通知模板配置
- 表达式编辑
- 任何需要在长文本中插入变量的场景

## 核心能力

### 变量插入
输入 `{{` 触发变量选择器，选择的变量将以标签形式显示在编辑器中。

### 智能键盘导航
- 方向键在变量间跳转
- Backspace 删除整个变量
- ESC 关闭变量选择器

### 编辑功能
- 撤销/重做（Ctrl+Z/Ctrl+Y）
- 文本选择和复制粘贴
- 多行编辑支持

## 示例演示

### 完整功能展示

包含单行和多行编辑模式的完整示例：

<code src="./demos/index.tsx"></code>

## 与其他组件的关系

SlateVariableEditor 是目前**最推荐的变量编辑解决方案**，特别适合需要在 NocoBase 中实现复杂变量编辑的场景。相比 VariableInput，它提供了更丰富的文本编辑能力。