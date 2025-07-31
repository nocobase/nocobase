# Filter Components

这个文件夹包含了重写后的筛选相关组件，使用新的数据结构和响应式对象。

## 数据结构

新的筛选条件使用以下数据结构：

```typescript
{
  "logic": "or", // 逻辑关系：'and' | 'or'
  "items": [
    // 筛选条件项
    {
      "leftValue": "isAdmin",
      "operator": "eq",
      "rightValue": true
    },
    // 嵌套的筛选组
    {
      "logic": "and",
      "items": [
        {
          "leftValue": "name",
          "operator": "eq",
          "rightValue": "NocoBase"
        },
        {
          "leftValue": "age",
          "operator": "gt",
          "rightValue": 18
        }
      ]
    }
  ]
}
```

## 组件说明

### FilterContent

主要的筛选内容组件，包含筛选条件和操作按钮。

**属性：**
- `value`: 响应式的过滤条件对象
- `FormItem`: 可选的自定义筛选项组件
- `ctx`: 上下文对象，用于获取翻译函数和事件派发

### FilterGroup

筛选条件组组件，支持嵌套的逻辑组合。

**属性：**
- `value`: 响应式的过滤条件对象
- `FilterItem`: 可选的自定义筛选项组件
- `showBorder`: 是否显示边框
- `onRemove`: 移除当前组的回调

### FilterItem

单个筛选条件项组件（暂未实现）。

**属性：**

- `value`: 筛选条件值对象
  - `leftValue`: 左侧值（字段名）
  - `operator`: 操作符
  - `rightValue`: 右侧值（比较值）

## 使用示例

```typescript
import { observable } from '@formily/reactive';
import { FilterContent } from './components/filter';

// 创建响应式的过滤条件对象
const filterValue = observable({
  logic: 'and',
  items: []
});

// 自定义筛选项组件
const CustomFormItem = ({ value }) => {
  const { leftValue, operator, rightValue } = value;
  return (
    <div>
      {leftValue} {operator} {rightValue}
    </div>
  );
};

// 上下文对象
const ctx = {
  model: {
    translate: (text) => text,
    dispatchEvent: (event) => console.log(event)
  }
};

// 使用组件
<FilterContent 
  value={filterValue}
  FormItem={CustomFormItem}
  ctx={ctx}
/>
```

## 开发计划

- [x] FilterContent 组件重写
- [x] FilterGroup 组件重写  
- [x] 新数据结构支持
- [x] 响应式对象集成
- [ ] FilterItem 组件完整实现
- [ ] 字段选择器集成
- [ ] 操作符选择器集成
- [ ] 值输入组件集成
- [ ] 与现有系统的集成测试
