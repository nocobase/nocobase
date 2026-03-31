# 自定义 FilterItem

通过传入 `FilterItem` 自定义渲染一条条件项的 UI，可根据 operator 切换不同的输入组件。

## 基本示例

<code src="./demos/custom-filter-item-basic.tsx"></code>

## 约定

- 组件签名：`({ value }) => ReactNode`，直接读写 `value.leftValue / value.operator / value.rightValue`
- 与 `FilterGroup` 配合，FilterGroup 负责 items 的增删与组逻辑（$and/$or）切换
