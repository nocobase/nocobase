# uiMode - 步骤设置的 UI 模式

```ts
export type StepUIMode =
  | 'dialog'
  | 'drawer'
  | { type: 'dialog'; props?: Record<string, any> }
  | { type: 'drawer'; props?: Record<string, any> };
```

<code src="./index.tsx"></code>
