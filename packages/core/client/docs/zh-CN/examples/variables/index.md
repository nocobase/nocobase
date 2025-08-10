# VariableInput 组件示例

VariableInput 是一个统一的变量输入组件，支持静态值输入和动态变量选择，通过 converters 机制提供高度的可定制性。

## Props

- **value**: 组件的受控值
- **onChange**: 值变化时的回调函数
- **metaTree**: 上下文变量的元数据树，可以是对象或返回对象的函数
- **converters**: 可选的自定义转换器配置

## Converters 函数说明

VariableInput 组件的核心功能通过 converters 机制实现，该机制包含三个主要函数：

### 1. `renderInputComponent` - 输入组件渲染器

**作用**: 根据选中的上下文选择器项目，返回一个用于渲染该值的 React 组件类型

**参数**: 
- `contextSelectorItem`: 选中的 ContextSelectorItem 对象，或者在未选择任何变量时为 null

**返回值**: React.ComponentType<{ value: any; onChange: (value: any) => void; }> | null

### 2. `resolvePathFromValue` - 值转路径解析器

**作用**: 将外部传入的 value 转换成 FlowContextSelector 需要的路径数组

**参数**: 
- `value`: 外部传入的值

**返回值**: string[] | null

### 3. `resolveValueFromPath` - 路径转值解析器

**作用**: 当一个上下文节点被选中后，将其信息转换成最终的外部 value

**参数**: 
- `contextSelectorItem`: 选中的 ContextSelectorItem 对象

**返回值**: any

**示例**: 在多层 Constant 示例中，当选中 Constant → string 节点时，返回一个字符串值

## 示例演示

### 1. 基础示例

最简单的用法，只需要 `value`、`onChange` 和 `metaTree` 三个参数：

<code src="./basic.tsx"></code>

### 2. Null 选项示例

通过 converters 为 metaTree 添加 Null 选项，渲染为只读 Input 显示 `<Null>`：

<code src="./null-option.tsx"></code>

**实现原理**: 
- `renderInputComponent` 返回一个只读的 Input 组件
- `resolveValueFromPath` 返回 `null` 值
- `resolvePathFromValue` 解析 null 相关的路径

### 3. 单层 Constant 示例

在 metaTree 中添加单层 Constant 选项，通过 converters 渲染为普通 Input：

<code src="./single-constant.tsx"></code>

**实现原理**: 
- `renderInputComponent` 返回一个可编辑的 Input 组件
- `resolveValueFromPath` 返回空字符串供用户输入
- `resolvePathFromValue` 解析 Constant 相关的路径

### 4. 多层 Constant 示例

多层 Constant 结构（Constant → string/number/date），根据类型渲染不同的输入组件：

<code src="./multi-constant.tsx"></code>

**实现原理**: 
- `renderInputComponent` 根据 Constant 类型返回对应的输入组件（Input、NumberPicker、DatePicker）
- `resolveValueFromPath` 根据类型返回不同格式的初始值
- `resolvePathFromValue` 解析多层路径结构

### 5. 根据 editableFieldModel 渲染不同的输入组件

<code src="./editable-field-model.tsx"></code>

**实现原理**: 
- `renderInputComponent` 根据 `editableFieldModel.type` 动态返回对应的输入组件
- `resolveValueFromPath` 根据 field type 返回对应的初始值
- `resolvePathFromValue` 解析包含 field 信息的路径

### 6. 根据字段来渲染不同的输入组件

根据 Collection 字段的 `interface` 属性自动选择合适的输入组件：

<code src="./fields.tsx"></code>

**实现原理**: 
- `renderInputComponent` 根据 `field.interface` 返回对应的表单组件
- `resolveValueFromPath` 根据 field interface 返回合适的初始值
- `resolvePathFromValue` 解析字段相关的路径结构

### 7. 不同的变量选择组件形态

通过 `showValueComponent` 属性控制组件的显示形态：

<code src="./variants.tsx"></code>

### 8. SlateVariableEditor - 智能变量编辑器

SlateVariableEditor 基于 Slate.js 富文本编辑器框架构建，完美结合了 Slate 的强大编辑能力与 NocoBase 的组件生态：

<code src="./slate-variable-editor/index.tsx"></code>

**适用场景**: 适合需要在长文本中插入变量的场景，如邮件模板、通知模板、表达式编辑等。这是目前最推荐的解决方案，特别适合需要在 NocoBase 中实现复杂变量编辑的场景。
