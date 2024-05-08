# ColorPicker

ColorPicker is a color picker component that is wrapped based on the ant-design [ColorPicker](https://ant.design/components/color-picker/) component.

```ts
interface ColorPickerProps extends Omit<AntdColorPickerProps, 'onChange'> {
  onChange?: (color: string) => void;
}
```

## Basic Usage

<code src="./demos/new-demos/basic.tsx"></code>

## Read Pretty

<code src="./demos/new-demos/read-pretty.tsx"></code>
