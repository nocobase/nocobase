# InputNumber

Number input box. It is a wrapper for the ant-design [InputNumber](https://ant.design/components/input-number/) component.

## Basic Usage

```ts
type InputNumberProps = AntdInputNumberProps;
```

<code src="./demos/new-demos/basic.tsx"></code>

## addonBefore and addonAfter

<code src="./demos/new-demos/addonBefore-addonAfter.tsx"></code>

## Read Pretty

```ts
interface InputNumberReadPrettyProps {
  formatStyle?: 'normal' | 'scientifix';
  unitConversion?: number;
  /**
   * @default '*'
   */
  unitConversionType?: '*' | '/';
  /**
   * @default '0.00'
   */
  separator?: '0,0.00' | '0.0,00' | '0 0,00' | '0.00';
  step?: number;
  value?: any;
  addonBefore?: React.ReactNode;
  addonAfter?: React.ReactNode;
}
```

<code src="./demos/new-demos/read-pretty.tsx"></code>

## Format Style

Scientific notation is supported.

<code src="./demos/new-demos/format-style.tsx"></code>

## Unit Conversion

Perform multiplication or division operations based on the original number.

<code src="./demos/new-demos/unit-conversion.tsx"></code>

## Separator

<code src="./demos/new-demos/separator.tsx"></code>
