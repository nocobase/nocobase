---
group:
  title: Schema Components
---

# Cron

定时任务表达式组件，其基于 [react-js-cron](https://github.com/xrutayisire/react-js-cron) 封装。

## Cron

```ts
import { CronProps as ReactJsCronProps } from 'react-js-cron';

interface CronProps extends Omit<ReactJsCronProps, 'setValue'> {
  onChange: (value: string) => void
}
```

## Basic Usage

<code src="./demos/new-demos/cron-basic.tsx"></code>

## Read Pretty

<code src="./demos/new-demos/cron-read-pretty.tsx"></code>

## CronSet

```ts
interface CronSetProps extends SelectProps {
  onChange: (v: string) => void;
}
```

## Basic Usage

<code src="./demos/new-demos/cronset-basic.tsx"></code>

## Read Pretty

<code src="./demos/new-demos/cronset-read-pretty.tsx"></code>

