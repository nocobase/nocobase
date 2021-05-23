---
title: Form - 表单
nav:
  title: 组件 
  path: /client 
group:
  order: 2
  title: Blocks 
  path: /client/blocks
---

# Form - 表单

## 示例

### 基本使用

<code src="./demos/demo1.tsx"/>

### 更新数据表单

<code src="./demos/demo2.tsx"/>

### 抽屉表单

<code src="./demos/demo3.tsx"/>

### 阅读模式

<code src="./demos/demo4.tsx"/>

## Props API

可能包括四部分：

- IFormLayoutProps：表单布局相关参数
- IFormProps：用于初始化 form 实例
- ISchemaField：表单字段配置
- ResourceOptions：用于资源定位

暂时只提供了一些核心的参数

### resource <Badge>ResourceOptions</Badge>

这部分参数还有待改进

```ts
export interface ResourceOptions {
  resourceName: string;
  associatedKey?: string;
  associatedName?: string;
  resourceKey?: string;
}
```

### fields <Badge>ISchemaField</Badge>

字段配置

```ts
{
  interface: 'string',
  type: 'string',
  title: `单行文本`,
  name: 'username',
  required: true,
  component: {
    type: 'string',
    default: 'aa',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
    'x-component-props': {},
  },
}
```

### readPretty

详情展示

### initialValues <Badge>IFormProps</Badge>

初始值

### effects <Badge>IFormProps</Badge>

支持以下 Effect Hooks

- [Form Effect Hooks](https://core.formilyjs.org/api/entry/form-effect-hooks)
- [Field Effect Hooks](https://core.formilyjs.org/api/entry/field-effect-hooks)

### onSuccess

数据提交成功的回调函数
