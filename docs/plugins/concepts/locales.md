---
title: Locales - 国际化
---

# Locales - 国际化 <Badge>未实现</Badge>

NocoBase 采用 [formatjs](https://formatjs.io/docs/getting-started/installation) 来处理国际化问题。

直接写在代码里，详情参考 formatjs 用例，NocoBase 会封装一个更易用的 `__` 函数来处理国际化，如：

```ts
__('Hello, {name}');
```

在配置里有两种写法：

模板字符串：

```ts
{
  name: `{{ __('Hello, {name}') }}`
}
```

json 格式：

```ts
{
  name: {
    'zh-CN': '{name}，您好',
    'en-US': 'Hello, {name}',
  },
}
```
