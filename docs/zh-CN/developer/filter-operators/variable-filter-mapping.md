# VariableFilterMapping 使用指南

## 概述

VariableFilterMapping 是 NocoBase 中一个用于处理变量助手条件映射的工具类。它允许开发者定义变量与助手条件之间的映射关系，使系统能够根据变量值动态生成数据查询条件。

## 主要功能

- 将变量值转换为数据查询条件
- 支持多种助手操作符
- 处理不同类型的变量（字符串、数字、日期等）
- 支持自定义变量处理器

## 基本用法

### 1. 定义助手条件映射

```typescript
import { VariableFilterMapping } from '@nocobase/database';

const helperMapping = new VariableFilterMapping({
  'user.id': '$user.id',              // 映射用户ID
  'user.name': '$user.name',          // 映射用户名
  'created_at': '$dateRange',         // 映射日期范围
  'status': '$status'                 // 映射状态
});
```

### 2. 使用映射生成助手条件

```typescript
// 变量值
const variables = {
  '$user.id': 1,
  '$user.name': 'admin',
  '$dateRange': ['2023-01-01', '2023-12-31'],
  '$status': 'active'
};

// 生成助手条件
const helper = helperMapping.toHelper(variables);
```

生成的助手条件类似于：

```javascript
{
  'user.id': 1,
  'user.name': 'admin',
  'created_at': {
    $between: ['2023-01-01', '2023-12-31']
  },
  'status': 'active'
}
```

## 高级用法

### 1. 自定义操作符

```typescript
const helperMapping = new VariableFilterMapping({
  'price': {
    name: '$price',
    operator: '$gt'     // 使用大于操作符
  }
});

const helper = helperMapping.toHelper({
  '$price': 100
});

// 生成: { price: { $gt: 100 } }
```

### 2. 嵌套映射

```typescript
const helperMapping = new VariableFilterMapping({
  'product': {
    'price': {
      name: '$product.price',
      operator: '$between'
    }
  }
});

const helper = helperMapping.toHelper({
  '$product.price': [100, 200]
});

// 生成: { product: { price: { $between: [100, 200] } } }
```

### 3. 使用处理器

```typescript
const helperMapping = new VariableFilterMapping({
  'tags': {
    name: '$tags',
    operator: '$match',
    processor: (value) => {
      // 将逗号分隔的标签转换为数组
      return value.split(',');
    }
  }
});

const helper = helperMapping.toHelper({
  '$tags': 'javascript,typescript,react'
});

// 生成: { tags: { $match: ['javascript', 'typescript', 'react'] } }
```

## 实际应用场景

1. **数据表格筛选**：根据用户界面中的筛选选项动态生成查询条件
2. **权限控制**：基于当前用户信息生成数据访问限制
3. **报表生成**：使用用户选择的参数动态生成报表数据查询条件
4. **工作流触发条件**：定义基于变量的工作流触发条件

## 注意事项

- 变量名必须以 `$` 开头
- 确保变量值与期望的操作符兼容（例如，$between 操作符需要数组值）
- 注意处理变量值为 null 或 undefined 的情况
- 复杂的助手逻辑可能需要使用处理器函数进行转换

## API 参考

### VariableFilterMapping 构造函数

```typescript
constructor(options: Record<string, MappingOptions | string>)
```

### MappingOptions 接口

```typescript
interface MappingOptions {
  name: string;               // 变量名
  operator?: string;          // 操作符名称
  processor?: (value) => any; // 值处理器
}
```

### toHelper 方法

```typescript
toHelper(variables: Record<string, any>): Record<string, any>
```

将变量值转换为助手条件。

## 总结

VariableFilterMapping 是 NocoBase 中强大的查询条件生成工具，它通过定义变量与助手条件的映射关系，使应用能够基于动态变量生成灵活的数据查询条件。掌握这一工具可以帮助开发者更有效地实现动态数据筛选、权限控制和自定义业务逻辑。
