---
toc: menu
---

# Filter Operators <Badge>待完善</Badge>

## string

- eq
- ne
- includes
- notInclude
- empty
- notEmpty

## number

- eq
- ne
- gt
- gte
- lt
- lte
- between
- empty
- notEmpty

## enum

- eq
- ne
- in
- notIn
- empty
- notEmpty

## array

- match
- notMatch
- anyOf
- noneOf
- empty
- notEmpty

多选字段以什么类型存储还有待商榷，可能的思路有两个：

直接用 JSON 类型，是 Attribute 的字段：

优点：不用 appends 处理，创建、修改、查询的格式是一致的
缺点：不利于查询，性能差，或者不支持

```ts
{
  type: 'json',
  name: 'aa',
}

// 创建
await Repository.create({
  values: {
    aa: ['option1', 'option2']
  },
});

// 修改
await Repository.update({
  values: {
    aa: ['option1', 'option2']
  },
});

// 查询
const model = await Repository.findOne();

model.aa // ['option1', 'option2']
```

用 HasMany 类型，是 Association 字段

- 优点：支持查询
- 缺点：需要 appends，创建、修改、查询的格式如果要保持统一需要做一些格式化处理

如：


```ts
{
  type: 'hasMany',
  name: 'aa',
  target: 'xxx_options' // 自动生成 options 表，只有两个字段 value 和 foreignKey（联合主键）
}

// 创建
await Repository.create({
  values: {
    aa: ['option1', 'option2'] // option1 和 option2 存到 value 里
  },
});

// 更新
await Repository.create({
  values: {
    aa: ['option3', 'option4'] // option1 和 option2 存到 value 里
  },
});

// 查询
const model = await Repository.findOne();

// 如果不特殊处理，输出的格式是这样的：
model.aa // [{value: 'option1', foreignKey: 1}, {value: 'option2', foreignKey: 1}]
// 可以进一步格式化为：
model.aa // ['option1', 'option2']
```

## date

- dateOn
- dateNotOn
- dateBefore
- dateAfter
- dateNotBefore
- dateNotAfter
- empty
- notEmpty

## association

- exists
- notExists
