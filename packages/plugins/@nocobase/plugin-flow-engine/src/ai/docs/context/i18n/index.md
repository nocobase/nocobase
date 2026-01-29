# ctx.i18n

i18next 实例。

## 类型定义

```ts
interface i18n: {
  language: string;
  t: (key: string, options?: any) => string;
};
```

- `language`：当前激活的语言代码（如 `zh-CN`、`en-US`）
- `t(key, options?)`：翻译函数，等价于应用中的 `i18n.t`

## 使用示例

- [翻译文案](./i18n-basic.md)
