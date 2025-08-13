# FilterGroup

用于以可视化方式编辑嵌套的筛选条件组，支持 All($and)/Any($or) 逻辑、条件项与条件组的递归嵌套、添加/删除等交互。

- 组件来源：`@nocobase/client` 导出的 `FilterGroup`
- 典型场景：为筛选按钮、数据范围、联动规则等提供条件编辑 UI

## 值结构

FilterGroup 的值为一个对象：

- `logic`: `$and | $or`，表示组内条件关系，默认 `$and`
- `items`: (条件项或子组) 的数组
  - 条件项形态：`{ leftValue: string; operator: string; rightValue: any }`
  - 子组形态：`{ logic: '$and' | '$or'; items: [...] }`

配合工具方法 `transformFilter` 可将该结构转换为查询对象。

## 基本示例

<code src="./demos/filter-group-basic.tsx" defaultShowCode={false}></code>

## Props

- `value: Record<string, any>` 可观察对象，包含 `logic` 与 `items`
- `FilterItem?: React.FC<{ value: { leftValue: string; operator: string; rightValue: any } }>` 自定义条件项组件
- `showBorder?: boolean` 是否显示组边框（用于嵌套组的视觉区分）
- `onRemove?: () => void` 移除当前组的回调（仅在作为子组时显示）

## 交互说明

- 切换 All/Any：修改 `value.logic` 为 `$and` 或 `$or`
- 添加条件：向 `value.items` 追加一个条件项
- 添加条件组：向 `value.items` 追加一个子组（可继续递归）
- 删除项：从 `value.items` 中移除对应索引项

