# ctx.resolveJsonTemplate()

:::info
- `ctx.resolveJsonTemplate()` 由 `FlowEngineContext` 提供，全局可用。
:::

`ctx.resolveJsonTemplate()` 用于将 JSON 模板中的 `{{xxx}}` 表达式替换为上下文中的实际值，支持异步属性访问和复杂数据结构。

## 功能说明

- **模板解析**：支持解析 JSON 对象、数组和字符串中的 `{{xxx}}` 表达式。
- **异步支持**：可以处理异步属性访问，确保动态数据的正确解析。
- **递归解析**：支持嵌套的 JSON 结构，自动递归解析所有层级的表达式。

## 参数说明

```ts
type JSONValue = string | { [key: string]: JSONValue } | JSONValue[];
declare renderJson: (template: JSONValue, options?: Record<string, any>) => Promise<any>;
```

- `template` *(JSONValue)*：需要解析的 JSON 模板，可以是对象、数组、字符串。
- `options` *(可选)*：额外的解析选项，用于自定义解析逻辑。

## 返回值

返回解析后的 JSON 数据，所有 `{{xxx}}` 表达式都会被替换为上下文中的实际值。

## 用法说明

以下示例展示了如何使用 `ctx.resolveJsonTemplate()` 方法解析不同类型的模板。

### 定义上下文属性

```ts
ctx.defineProperty('str', {
    get: () => 'foo', 
});
ctx.defineProperty('num', {
    get: () => 123, 
});
ctx.defineProperty('bool', {
    get: () => true, 
});
ctx.defineProperty('obj', {
    get: () => ({ str: 'foo', num: 123 }), 
});
ctx.defineProperty('arr', {
    get: () => ([1, 2, 3]), 
});
ctx.defineProperty('null', {
    get: () => null, 
});
ctx.defineProperty('undefined', {
    get: () => undefined, 
});
```

### 解析单个字符串模板

```ts
await ctx.resolveJsonTemplate('{{str}}'); // 输出: 'foo'
await ctx.resolveJsonTemplate('{{num}}'); // 输出: 123
await ctx.resolveJsonTemplate('{{bool}}'); // 输出: true
await ctx.resolveJsonTemplate('{{obj}}'); // 输出: { str: 'foo', num: 123 }
await ctx.resolveJsonTemplate('{{arr}}'); // 输出: [1, 2, 3]
await ctx.resolveJsonTemplate('{{null}}'); // 输出: null
await ctx.resolveJsonTemplate('{{undefined}}'); // 输出: undefined
```

### 解析对象模板

```ts
const resolvedObject = await ctx.resolveJsonTemplate({
  str: '{{str}}',
  num: '{{num}}',
  bool: '{{bool}}',
  obj: '{{obj}}',
  arr: '{{arr}}',
  nullValue: '{{null}}',
  undefinedValue: '{{undefined}}',
});
// 输出: {
//   str: 'foo',
//   num: 123,
//   bool: true,
//   obj: { str: 'foo', num: 123 },
//   arr: [1, 2, 3],
//   nullValue: null,
//   undefinedValue: undefined,
// }
```

### 解析数组模板

```ts
const resolvedArray = await ctx.resolveJsonTemplate([
  '{{str}}',
  '{{num}}',
  '{{bool}}',
  '{{obj}}',
  '{{arr}}',
  '{{null}}',
  '{{undefined}}',
]);
// 输出: ['foo', 123, true, { str: 'foo', num: 123 }, [1, 2, 3], null, undefined]
```

## 示例

### 完整的示例

以下是一个完整的示例，展示如何使用 `ctx.resolveJsonTemplate()` 方法解析 JSON 模板：

<code src="./full.tsx"></code>

### 支持异步变量

该方法支持异步属性访问，以下示例展示了如何在异步场景中使用：

<code src="./index.tsx"></code>
