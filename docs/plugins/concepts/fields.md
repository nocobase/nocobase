---
title: Fields - 字段
---

# Fields

## Types - 数据类型

详情点击查看[Field Types 章节](/cores/packages/database#field-types)

## Blocks - 区块类型

详情点击查看[Blocks - Fields 章节](/cores/packages/blocks#fields---字段)

## Interfaces - 接口类型

在 NocoBase 插件中，字段类型通常指的是字段的接口类型，一个字段「接口类型」通常由「数据类型」和「区块类型」组成，如：

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