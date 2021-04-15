---
title: Fields - 字段
---

# Fields

一个完整的字段由「数据类型」和「区块类型」两部分参数组合而成。同一个数据类型可能对应多种区块类型，同一个区块类型的数据值也可能是多种数据类型。因此提炼了字段的接口（Interface）作为唯一标识。

字段的 Types 和 Blocks 就不赘述了，请查阅核心章节介绍

- [Field Types](/cores/packages/database#field-types)
- [Field Blocks](/cores/packages/blocks#fields---字段)

<Alert title="注意" type="warning">
在 NocoBase 里，普通用户概念上的字段类型指的是 interface；field type 只表示数据类型 - data type；field block 是 ui 组件，同一个组件也可能表示多种字段类型（interface）。
</Alert>

## Interfaces - 接口类型

```ts
{
  // 多行文本框
  interface: 'textarea',
  // 长文本类型
  type: 'text', // 也可以是 string
  // 使用 多行文本框 区块渲染 UI
  block: {
    type: 'textarea',
  },
}

{
  // 电子邮箱
  interface: 'email',
  // 字符串
  type: 'string',
  format: 'email',
  // 使用 String 区块渲染
  block: {
    type: 'string',
  },
}

{
  // 手机号
  interface: 'phone',
  // 字符串
  type: 'string',
  format: 'phone',
  // 使用 String 区块渲染
  block: {
    type: 'string',
  },
}
```

分类有：

- basic
- media
- choices
- datetime
- relation
- systemInfo
- developerMode
- others

### basic
#### string
#### textarea
#### phone
#### email
#### number
#### percent

### media
#### markdown
#### wysiwyg
#### attachment

### choices
#### select
#### multipleSelect
#### radio
#### checkboxes
#### boolean
#### chinaRegion

### datetime
#### datetime
#### time

### relation
#### subTable
#### linkTo

### systemInfo
#### createdAt
#### createdBy
#### updatedAt
#### updatedBy

### developerMode

#### primaryKey
#### sort
#### password
#### icon
#### json

### Others

以下字段可能会被遗弃

#### description
#### group
#### status