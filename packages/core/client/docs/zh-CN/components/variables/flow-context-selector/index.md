# FlowContextSelector 组件

FlowContextSelector 是一个流上下文选择器组件，基于 Ant Design 的 Cascader 组件构建，用于在工作流上下文中选择变量和属性。它支持层级结构的数据选择、异步加载、搜索等功能。

## Props

- **value**: `string` - 组件的受控值
- **onChange**: `(value: string, metaTreeNode?: MetaTreeNode) => void` - 值变化时的回调函数
- **children**: `React.ReactNode` - 自定义触发器组件，默认为按钮
- **metaTree**: `MetaTreeNode[] | (() => MetaTreeNode[] | Promise<MetaTreeNode[]>)` - 上下文变量的元数据树，可以是对象数组或返回对象数组的函数
- **parseValueToPath**: `(value: string) => string[] | undefined` - 自定义值解析函数，将字符串值转换为路径数组
- **formatPathToValue**: `(item: MetaTreeNode) => string` - 自定义路径格式化函数，将选中的节点转换为字符串值
- **open**: `boolean` - 控制下拉框的显示状态
- **onlyLeafSelectable**: `boolean` - 是否仅允许选择叶子节点（默认 false）
- **...cascaderProps**: 其他 Ant Design Cascader 组件的属性

## 核心特性

### 双击选择机制

当 `onlyLeafSelectable` 为 false 时，组件支持双击选择非叶子节点：
- 单击：展开/折叠节点
- 双击：选择非叶子节点

### 异步加载

组件支持异步加载子节点数据，当 metaTree 节点的 children 属性为函数时，会在展开时调用该函数加载数据。

### 路径自动对齐

当 metaTree 为子层数据（如通过 `getPropertyMetaTree('{{ ctx.collection }}')` 获取的子节点）而 value 路径仍包含根键时，组件会自动丢弃不存在的首段，确保级联选择器能正确对齐。

## 示例演示

### 基础用法

最简单的用法，只需要 `value`、`onChange` 和 `metaTree` 三个参数：

<code src="./demos/basic.tsx"></code>

### 自定义触发器

通过 `children` 属性自定义触发器组件的外观：

<code src="./demos/custom-children.tsx"></code>

<!-- ### 搜索功能

通过 `showSearch` 属性启用搜索功能，方便在大量选项中快速找到目标：

<code src="./demos/search.tsx"></code> -->

### 仅允许选择叶子节点

通过 `onlyLeafSelectable` 属性限制只能选择叶子节点，不允许选择中间的对象节点：

<code src="./demos/only-leaf-selectable.tsx"></code>

### 自定义解析和格式化

通过 `parseValueToPath` 和 `formatPathToValue` 自定义值的解析和格式化逻辑：

<code src="./demos/custom-parse-format.tsx"></code>

### 控制下拉框状态

通过 `open` 属性程序化控制下拉框的显示/隐藏状态：

<code src="./demos/open-control.tsx"></code>

## 与 VariableInput 的区别

- **FlowContextSelector**: 专注于变量选择，基于 Cascader 组件，提供层级选择功能
- **VariableInput**: 综合性变量输入组件，支持静态值输入和动态变量选择，内部使用 FlowContextSelector 作为变量选择器
