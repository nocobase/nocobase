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

For the configuration of the Action component, please refer to [Action](/components/action).

## Default values

We can use `x-use-component-props` and `form.setInitialValues()` to set default values. For more instance methods of the form, please refer to [Form](https://core.formilyjs.org/api/models/form).

<code src="./demos/new-demos/default-value.tsx"></code>

## FormLayout

FormV2 internally encapsulates the FormLayout component. Please refer to [FormLayout](https://antd.formilyjs.org/zh-CN/components/form-layout) for the props of the FormLayout component.

<code src="./demos/new-demos/form-layout.tsx"></code>

## Grid Layout

For the configuration of the Grid component, please refer to [Grid](/components/grid).

<code src="./demos/new-demos/grid.tsx"></code>

## With Collection

We can use `FormBlockProvider` and `CollectionField` to automatically retrieve the configuration of a data table and render form items based on the table's configuration.

`FormBlockProvider` is a secondary encapsulation of `DataBlockProvider`, and its properties can be referred to in [DataBlockProvider](/core/data-block/data-block-provider#属性详解). `CollectionField` will automatically search for the corresponding configuration of the data table based on `field.name` and render it as the corresponding form item. For more information about `CollectionField`, please refer to [CollectionField](/core/data-source/collection-field).

And we can use the `resource` context provided by `DataBlockProvider` to perform CRUD operations on resources.

For example, let's take the `users` data table as an example.

<code src="./demos/new-demos/collection.tsx"></code>

## Extend Collection

If the Collection is not created through the Data Source Manager, but is a custom extension, you can refer to [ExtendCollectionsProvider](/core/data-source/extend-collections-provider).

<code src="./demos/new-demos/extend-collection.tsx"></code>

## Get Collection Data

When we pass `action: 'get'` to `FormBlockProvider` and there is a `filterByTk` property, `FormBlockProvider` will automatically retrieve the data table data based on the value of `filterByTk`. Please refer to [DataBlockProvider](/core/data-block/data-block-provider#属性详解) for parameter details.

Then use `useFormBlockProps()` to assign the retrieved data to the Form.

Generally used in data update scenarios.

<code src="./demos/new-demos/collection-data.tsx"></code>

## Read Pretty

Just add `x-read-pretty: true` in the Schema.

<code src="./demos/new-demos/read-pretty.tsx"></code>

## Linkage

Form items can be linked together using the `x-linkage-rules` attribute.

TODO:

<!-- <code src="./demos/new-demos/linkage.tsx"></code> -->

## Hooks
