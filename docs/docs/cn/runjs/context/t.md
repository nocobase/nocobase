# ctx.t()

在 JS 脚本中快速翻译文本的 i18n 快捷函数，内部委托给 `ctx.i18n.t`。

## 类型定义（简化）

```ts
t(key: string, variables?: Record<string, any>): string;
```

## 示例

```ts
const text = ctx.t('Hello {name}', { name: ctx.user?.nickname || 'NocoBase' });
ctx.render(<div>{text}</div>);
```

> 提示：
> - `ctx.t` 适合简单内联文案。若需要更细粒度控制命名空间、语言等，请直接使用 `ctx.i18n.t`。
