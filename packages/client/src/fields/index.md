---
title: Field - 字段概述
nav:
  title: 组件
  path: /client
order: 0
group:
  order: 1
  title: 字段 - Fields
  path: /client/fields
---

# Field - 字段概述

字段参数总共有三类情况

- 服务端参数：如 foreignKey、sourceKey、targetKey 等
- 客户端参数：如 x-component、x-decorator 等
- 混合参数：服务端和客户端都涉及到，如 name、x-validator 等

字段参数的安排上，服务端主要参考 Sequelize，客户端主要参考 Formily。

<Alert title="注意" type="warning">
字段参数的安排上，服务端主要参考 Sequelize，客户端主要参考 Formily。三部分参数如何统一还待进一步确定。
</Alert>

## 参数说明

### interface <Badge>M</Badge>

参数组合之后的参数，可以理解为字段模板，如手机号和电子邮箱的参数区别只在于 x-validator 不一样，一个是 phone，另一个是 email

手机号

```ts
{
  interface: 'phone',
  type: 'string',
  title: `手机号`,
  name: 'phone',
  required: true,
  'x-decorator': 'FormItem',
  'x-validator': 'phone',
  'x-component': 'Input',
  'x-component-props': {
    placeholder: 'please enter',
  },
};
```

电子邮箱

```ts
{
  interface: 'email',
  type: 'string',
  title: `单行文本`,
  name: 'email',
  required: true,
  'x-decorator': 'FormItem',
  'x-validator': 'email',
  'x-component': 'Input',
  'x-component-props': {
    placeholder: 'please enter',
  },
};
```

### type <Badge>M</Badge>

Formily 的 type 与 Sequelize 的 type 有些许参数，Sequelize 的更细致，Formily 的粗狂。所以以 Sequelize 为主，客户端需要时，转化为 Formily 的。Formily 的 type 有以下几种：

- String
- Object
- Array
- Boolean
- Date
- DateTime
- Void
- Number

### title <Badge>C</Badge>

字段标题

### name <Badge>M</Badge>

字段标识，前后端的用法基本相同

### default/defaultValue <Badge>M</Badge>

Formily 用的是 default，Sequelize 用的是 defaultValue，前端的默认值数据格式更丰富，所以以前端为主。实际数据库表字段都不会设置默认值，需要时通过程序处理。

### required/nullable <Badge>M</Badge>

Formily 用的是 required，Sequelize 用的是 nullable。实际数据库表字段都是 `可空` 的，`非空` 通过程序判断。

### x-validator <Badge>M</Badge>

Formily 的 validator 与 Sequelize 的 validator 有差别，目前已 Formily 为主。

### x-component <Badge>C</Badge>

字段适配的组件

### x-component-props <Badge>C</Badge>

组件的参数，无侵入，具体参数与适配的组件有关

### x-decorator <Badge>C</Badge>

字段装饰器，主要用于字段的布局，常用的字段装饰器有：

- FormItem：用于表单场景
- Editable：用于快捷编辑
- Column：用于表格单元格数据输出

### x-decorator-props <Badge>C</Badge>

字段装饰器参数