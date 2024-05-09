# Password

Password input box. For more properties, please refer to the [antd documentation](https://ant.design/components/input#components-input-demo-password-input).

```ts
interface PasswordProps extends AntdPasswordProps {
  checkStrength?: boolean;
}
```

## Basic Usage

<code src="./demos/new-demos/basic.tsx"></code>

## Check strength

<code src="./demos/new-demos/checkStrength.tsx"></code>

## Read Pretty

```ts
interface PasswordReadPrettyProps  {
  value?: string;
}
```

<code src="./demos/new-demos/read-pretty.tsx"></code>
