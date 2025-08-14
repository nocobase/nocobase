# VariableInput 组件场景示例：Linkage Rule 场景

VariableInput 在联动规则（Linkage Rule）场景下的示例，演示如何将变量选择能力应用于表单字段联动条件配置。

- 左侧选择触发字段：使用 VariableInput 选择表单字段或上下文变量作为联动触发条件  
- 操作符动态变化：根据左侧变量的数据类型（string/number/boolean/date）动态提供相应的操作符选项
- 右侧支持多种目标值：变量、常量、空值等多种类型的联动目标值，当选择"为空"/"非空"操作符时自动禁用

## 示例列表（Linkage Rule 场景）

### 1. 联动规则：左右均为 VariableInput，操作符根据左值类型动态变化

<code src="./linkage-rule.tsx"></code>