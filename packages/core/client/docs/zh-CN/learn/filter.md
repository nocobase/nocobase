# Filter 协议说明

## 参数说明

```ts
type FilterKey = string;
type FilterValue = any;
// 最简单的筛选
type SimpleFilter = Record<FilterKey, FilterValue>;

type OperatorType = string;
// 带操作符的筛选
type FilterWithOperator = Record<FilterKey, Record<OperatorType, FilterValue>>;

type LogicType = '$and' | '$or';
// 支持逻辑运算符的筛选
type LogicFilter = Record<LogicType, Array<SimpleFilter | FilterWithOperator>>;
```

## 示例

### 最简单的 filter

适配所有场景

```
{ status: 'active' },
```

### 带操作符的 Filter

只适用于 database 的场景

```ts
{ age: { $gt: 18 } }
```

### 带逻辑运算符的 Filter

只适用于 database 的场景

```ts
{
  $and: [
    { status: 'active' },
    { age: { $gt: 18 } }
  ]
}
```