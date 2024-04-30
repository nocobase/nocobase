# ColorPicker

颜色选择器，其基于 ant-design [ColorPicker](https://ant.design/components/color-picker/) 组件进行封装。

```ts
interface ColorPickerProps extends Omit<AntdColorPickerProps, 'onChange'> {
  onChange?: (color: string) => void;
}
```

## Basic Usage

<code src="./demos/new-demos/basic.tsx"></code>

## Read Pretty

<code src="./demos/new-demos/read-pretty.tsx"></code>
