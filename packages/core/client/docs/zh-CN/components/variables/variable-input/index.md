# VariableInput 组件

VariableInput 是一个统一的变量输入组件，支持静态值输入和动态变量选择，通过 converters 机制提供高度的可定制性。

## Props

- **value**: 组件的受控值
- **onChange**: 值变化时的回调函数
- **metaTree**: 上下文变量的元数据树，可以是对象或返回对象的函数
- **converters**: 可选的自定义转换器配置
- **showValueComponent**: 是否显示值输入组件（默认 true）
- **onlyLeafSelectable**: 是否仅允许选择叶子节点（默认 false）

## Converters 机制

VariableInput 组件的核心功能通过 converters 机制实现，该机制包含两个主要函数：

### resolvePathFromValue - 值转路径解析器

**作用**: 将外部传入的 value 转换成 FlowContextSelector 需要的路径数组

**参数**: 
- `value`: 外部传入的值

**返回值**: string[] | null

### resolveValueFromPath - 路径转值解析器

**作用**: 当一个上下文节点被选中后，将其信息转换成最终的外部 value

**参数**: 
- `metaTreeNode`: 选中的 MetaTreeNode 对象

**返回值**: any

## 示例演示

### 基础用法

最简单的用法，只需要 `value`、`onChange` 和 `metaTree` 三个参数：

<code src="./demos/basic.tsx"></code>

### Null 选项支持

通过 converters 为 metaTree 添加 Null 选项，渲染为只读 Input 显示 `<Null>`：

<code src="./demos/null-option.tsx"></code>

### 单层 Constant 支持

在 metaTree 中添加单层 Constant 选项，通过 converters 渲染为普通 Input：

<code src="./demos/single-constant.tsx"></code>

### 多层 Constant 支持

多层 Constant 结构（Constant → string/number/date），根据类型渲染不同的输入组件：

<code src="./demos/multi-constant.tsx"></code>

### 组件显示形态

通过 `showValueComponent` 属性控制组件的显示形态：

<code src="./demos/variants.tsx"></code>

### 组件间交互

演示两个 VariableInput 组件之间通过 `getPropertyMetaTree` 进行交互：

<code src="./demos/linked-components.tsx"></code>

### 仅允许选择叶子节点

通过 `onlyLeafSelectable` 属性限制只能选择叶子节点，不允许选择中间的对象节点：

<code src="./demos/only-leaf-selectable.tsx"></code>
