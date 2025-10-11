# defaultParams - 步骤参数默认值

## 基础用法

<code src="./index.tsx"></code>

## 支持函数式

<code src="./callback.tsx"></code>

## 字符串变量

字符串变量会在流执行时，自动解析

```ts
{
  defaultParams: {
    type: '{{ctx.type.primary}}',
  },
  handler(ctx, params) {
    console.log(params.type); // 'primary'
  },
}
```

<code src="./string-var.tsx"></code>

## 支持函数式 + 字符串变量

<code src="./string-var-callback.tsx"></code>
