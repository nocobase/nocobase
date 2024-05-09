# Checkbox

Checkbox, which is a wrapper component based on the ant-design [Checkbox](https://ant.design/components/checkbox/) component.

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

If the value is `false`, by default, the content is not displayed. You can use the `showUnchecked` property to display the unchecked checkbox.

<code src="./demos/new-demos/read-pretty.tsx"></code>

## Checkbox Group

```ts
type CheckboxGroupProps = CheckboxGroupProps;
```

Note that the `type` property of the schema is `array`.

<code src="./demos/new-demos/group.tsx"></code>

## Checkbox Group Read Pretty

```ts
export interface CheckboxGroupReadPrettyProps {
  value?: any[];
  ellipsis?: boolean;
}
```

<code src="./demos/new-demos/group-read-pretty.tsx"></code>
