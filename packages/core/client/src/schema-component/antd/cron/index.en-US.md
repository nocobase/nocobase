

# Cron

A cron expression component based on [react-js-cron](https://github.com/xrutayisire/react-js-cron).

## Cron

## Basic Usage

```ts
import { CronProps as ReactJsCronProps } from 'react-js-cron';

interface CronProps extends Omit<ReactJsCronProps, 'setValue'> {
  onChange: (value: string) => void
}
```

<code src="./demos/new-demos/cron-basic.tsx"></code>

## Read Pretty

```ts
interface CronReadPrettyProps {
  value?: string;
}
```

<code src="./demos/new-demos/cron-read-pretty.tsx"></code>

## CronSet

## Basic Usage

```ts
interface CronSetProps extends SelectProps {
  onChange: (v: string) => void;
}
```

<code src="./demos/new-demos/cronset-basic.tsx"></code>

## Read Pretty

```ts
interface CronReadPrettyProps {
  value?: string;
  options?: SelectProps['options'];
}
```

<code src="./demos/new-demos/cronset-read-pretty.tsx"></code>

