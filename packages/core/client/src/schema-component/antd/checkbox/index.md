# Checkbox

复选框，其基于 ant-design [Checkbox](https://ant.design/components/checkbox/) 组件封装。


## Basic Usage

```ts
type CheckboxProps = AntdCheckboxProps;
```

<code src="./demos/new-demos/basic.tsx"></code>

## Read Pretty

```ts
interface CheckboxReadPrettyProps {
  showUnchecked?: boolean;
  value?: boolean;
}
```

如果值为 `false`，默认情况下不显示内容，可以通过 `showUnchecked` 属性来显示未选中的复选框。

<code src="./demos/new-demos/read-pretty.tsx"></code>

## Checkbox Group

```ts
type CheckboxGroupProps = CheckboxGroupProps;
```

注意 schema 的 type 属性为 `array`。

<code src="./demos/new-demos/group.tsx"></code>

## Checkbox Group Read Pretty

```ts
export interface CheckboxGroupReadPrettyProps {
  value?: any[];
  ellipsis?: boolean;
}
```

<code src="./demos/new-demos/group-read-pretty.tsx"></code>
