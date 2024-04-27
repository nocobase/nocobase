# Checkbox

复选框，其基于 ant-design [Checkbox](https://ant.design/components/checkbox/) 组件封装。

```ts
interface CheckboxProps extends AntdCheckboxProps {
  showUnchecked?: boolean;
}

interface CheckboxGroupProps extends AntdCheckboxGroupProps {
  ellipsis?: boolean;
}
```

## Basic Usage

<code src="./demos/new-demos/basic.tsx"></code>

## Read Pretty

如果值为 `false`，默认情况下不显示内容，可以通过 `showUnchecked` 属性来显示未选中的复选框。

<code src="./demos/new-demos/read-pretty.tsx"></code>

## Checkbox Group

注意 schema 的 type 属性为 `array`。

<code src="./demos/new-demos/group.tsx"></code>

## Checkbox Group Read Pretty

<code src="./demos/new-demos/group-read-pretty.tsx"></code>
