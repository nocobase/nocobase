# Filter 协议说明

本文档介绍 NocoBase 中 Filter（筛选器）协议的参数类型及用法。

## 参数类型说明

```ts
type FilterKey = string;
type FilterValue = any;

// 最简单的筛选：键值对形式
type SimpleFilter = Record<FilterKey, FilterValue>;

type OperatorType = string;

// 带操作符的筛选：支持比较等操作符
type FilterWithOperator = Record<FilterKey, Record<OperatorType, FilterValue>>;

type LogicType = '$and' | '$or';

// 支持逻辑运算符的筛选：可组合多个条件
type LogicFilter = Record<LogicType, Array<SimpleFilter | FilterWithOperator>>;

// 综合类型
type Filter = SimpleFilter | FilterWithOperator | LogicFilter;
```

## 示例

### 1. 最简单的 Filter

适用于所有场景，直接通过键值对筛选。

```ts
{ status: 'active' }
```

### 2. 带操作符的 Filter

适用于数据库场景，支持如 `$gt`（大于）、`$lt`（小于）等操作符。

```ts
{ age: { $gt: 18 } }
```

### 3. 带逻辑运算符的 Filter

适用于数据库场景，可组合多个条件，支持 `$and` 和 `$or`。

```ts
{
  $and: [
    { status: 'active' },
    { age: { $gt: 18 } }
  ]
}
```
