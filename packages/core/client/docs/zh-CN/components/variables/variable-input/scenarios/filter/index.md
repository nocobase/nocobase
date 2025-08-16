# VariableInput 组件场景示例：Filter 场景

VariableInput 在过滤器（Filter）场景下的若干示例，演示如何将变量选择能力融入到筛选条件中。

- 变量作为左值：左侧使用 VariableInput 选择上下文变量，中间选择操作符，右侧为文本输入
- 按左值类型动态渲染右侧输入：依据选中变量的类型动态切换右侧输入组件和操作符集合
- 右侧为 VariableInput：右侧支持变量或静态值，且可根据左侧变量动态限定变量范围

## 示例列表（Filter 场景）

### 1. 变量作为左值

<code src="./context-filter-item-variable-left.tsx"></code>

### 2. 右侧输入根据左值类型动态渲染

<code src="./dynamic-right-input-by-left-type.tsx"></code>

### 3. 右侧为 VariableInput（变量或静态值）

<code src="./variable-right-input.tsx"></code>
