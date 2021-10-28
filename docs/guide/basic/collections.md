---
order: 1
group:
  title: Basic Concepts
  path: /guide/basic
  order: 4
---

# Collections & Fields

NocoBase 的数据表由字段（列）和记录（行）组成。数据表的概念与关系型数据库的数据表概念相近，但是字段的概念并不相同。

## 字段

NocoBase 里，最常见的字段具有组件形态，如：单行文本、多行文本、单选框。这些组件都有数值（value），可交由用户填写，称为有值组件。结构如下：

```ts
{
  interface: 'textarea',
  type: 'text',
  name: 'description',
  uiSchema: {
    type: 'string',
    title: '描述',
    'x-component': 'Input.TextArea',
    'x-decorator': 'FormItem',
  },
}
```

上述是一个描述字段的配置：

- type 表示字段的存储类型，为 text 长文本类型
- uiSchema 为字段的组件参数
- uiSchema.type 为字段组件的数值类型
- uiSchema.x-component 表示组件类型，为多行输入框
- 绑定了组件的字段，都要设置一个 interface，表示当前字段的类型，例子描述字段为多行文本类型

除了常见的绑定了组件的字段以外，还有一些无需绑定组件的字段，如 token 字段，这类组件并不会显示在界面上。无组件字段的结构如下：

```ts
{
  type: 'string',
  name: 'token',
}
```

**为什么字段要区分存储类型和组件类型？**

其一：存储类型和组件类型是多对多关系，并不适合合并处理。
同一组件的 value 的类型（存储类型）可能并不相同，比如 select 的 value 可能是 string 或者 integer。同一存储类型也可能以不同的组件呈现，如 string 绑定的组件可能是 Input，也可能是 Select。

其二：有限的存储类型和组件类型可以组合出无数种字段类型。
单行文本、电子邮件、网址、手机号这些字段的存储类型和组件类型虽然都相同，但是校验参数并不相同，只需要调整 validate 参数即可创建出无数种字段。

## 字段的类型

| 名称     | Interface | Type   | Component      | 备注              |
| :------- | :-------- | :----- | :------------- | :---------------- |
| 单行文本 | string    | string | Input          |                   |
| 多行文本 | textarea  | text   | Input.TextArea |                   |
| 邮箱     | email     | string | Input          | validate: 'email' |
| 手机号   | phone     | string | Input          | validate: 'phone' |

## 可以做什么？

### 快速建模

与专业的建模工具不同，NocoBase 提供了一种更利于普通用户理解的数据表配置方法。

- 可以直接通过 app.collection() 直接写代码里，多用于配置底层系统表。
- 也可以通过无代码平台的数据表配置入口配置数据表，多用于配置业务表。

### 创建数据区块

配置好的数据表可用于创建对应的数据区块，如以表格的形式展示某个数据表的内容。表格里可以选择哪些字段作为表格列显示出来。

更多关于区块的内容可以查看客户端组件章节。

### HTTP API

跨平台也可以通过 HTTP API 的方式操作数据表（增删改查配置等），更多内容查看 SDK 章节。
