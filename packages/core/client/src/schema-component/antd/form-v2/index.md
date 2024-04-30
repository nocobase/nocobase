# FormV2

```ts
import {  Form as FormilyForm } from '@formily/core';
import { IFormLayoutProps } from '@formily/antd-v5';

interface FormProps extends IFormLayoutProps {
  form?: FormilyForm;
  disabled?: boolean;
}
```

## Basic Usage

<code src="./demos/new-demos/basic.tsx"></code>

其中关于 Action 组件的的配置请参考 [Action](/components/action)。

## Default values

我们可以使用 `x-use-component-props`，通过 `form.setInitialValues()` 来设置默认值，更多 form 的实例方法请参考 [Form](https://core.formilyjs.org/api/models/form)。

<code src="./demos/new-demos/default-value.tsx"></code>

## FormLayout

FormV2 内部封装了 FormLayout 组件，FormLayout 组件的 props 请参考 [FormLayout](https://antd.formilyjs.org/zh-CN/components/form-layout)。

<code src="./demos/new-demos/form-layout.tsx"></code>

## Grid Layout

其中关于 Grid 组件的配置请参考 [Grid](/components/grid)。

<code src="./demos/new-demos/grid.tsx"></code>

## With Collection

我们可以使用 `FormBlockProvider` 和 `CollectionField` 自动读取数据表的配置，并根据数据表配置渲染表单项。

其中 `FormBlockProvider` 是对 `DataBlockProvider` 的二次封装，其属性可以参考 [DataBlockProvider](/core/data-block/data-block-provider#属性详解)，`CollectionField` 会自动根据 field.name 查找对应的数据表的配置，并渲染成对应的表单项，更多关于 `CollectionField` 的说明请参考 [CollectionField](/core/data-source/collection-field)。

并且我们可以使用 `DataBlockProvider` 提供的 `resource` 上下文对资源进行增删改查。

例如我们以 `users` 数据表为例。

<code src="./demos/new-demos/collection.tsx"></code>

## Extend Collection

如果 Collection 不是通过数据源管理器创建，而是自定义扩展，可以查看 [ExtendCollectionsProvider](/core/data-source/extend-collections-provider)。

<code src="./demos/new-demos/extend-collection.tsx"></code>

## Get Collection Data

当我们给 `FormBlockProvider` 传递 `action: 'get'` 且存在 `filterByTk` 属性时，`FormBlockProvider` 会自动根据 `filterByTk` 的值获取数据表数据。关于参数的说明请参考 [DataBlockProvider](/core/data-block/data-block-provider#属性详解)。

然后通过 `useFormBlockProps()` 将请求到的数据赋值给 Form。

一般用在更新数据场景。

<code src="./demos/new-demos/collection-data.tsx"></code>

## Read Pretty

只需要在 Schema 中添加 `x-read-pretty: true` 即可。

<code src="./demos/new-demos/read-pretty.tsx"></code>

## Linkage

表单项之间可以通过 `x-linkage-rules` 属性进行联动。

TODO:

<!-- <code src="./demos/new-demos/linkage.tsx"></code> -->

更多联动规则的写法请参考：TODO

## Hooks
