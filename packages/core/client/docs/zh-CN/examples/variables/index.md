# VariableInput 组件示例

VariableInput 是一个统一的变量输入组件，支持静态值输入和动态变量选择，通过 converters 机制提供高度的可定制性。

## Props

- **value**: 组件的受控值
- **onChange**: 值变化时的回调函数
- **metaTree**: 上下文变量的元数据树，可以是对象或返回对象的函数
- **converters**: 可选的自定义转换器配置

## 示例演示

### 1. 基础示例

最简单的用法，只需要 `value`、`onChange` 和 `metaTree` 三个参数：

<code src="./basic.tsx"></code>

### 2. Null 选项示例

通过 converters 为 metaTree 添加 Null 选项，渲染为只读 Input 显示 `<Null>`：

<code src="./null-option.tsx"></code>

### 3. 单层 Constant 示例

在 metaTree 中添加单层 Constant 选项，通过 converters 渲染为普通 Input：

<code src="./single-constant.tsx"></code>

### 4. 多层 Constant 示例

多层 Constant 结构（Constant → string/number/date），根据类型渲染不同的输入组件：

<code src="./multi-constant.tsx"></code>

### 5. 根据 editableFieldModel 渲染不同的输入组件

### 6. 根据 字段 来渲染不同的输入组件
