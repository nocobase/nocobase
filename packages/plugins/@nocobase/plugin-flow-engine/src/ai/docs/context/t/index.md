# ctx.t()

国际化快捷函数，用于在 JS 脚本中快速翻译文案。内部会委托给 `ctx.i18n.t`。

## 类型定义（简化）

```ts
t(key: string, variables?: Record<string, any>): string;
```

## 使用示例

```ts
const text = ctx.t('Hello {name}', { name: ctx.user?.nickname || 'NocoBase' });
ctx.render(<div>{text}</div>);
```

> 提示：
> - `ctx.t` 适合简单内联文案，若需要明确命名空间、语言等高级控制，请直接使用 `ctx.i18n.t`
