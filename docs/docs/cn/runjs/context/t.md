# ctx.t()

在 RunJS 中用于翻译文案的 i18n 快捷函数，基于当前上下文的语言设置。适合按钮、标题、提示等内联文案的国际化。

## 适用场景

所有 RunJS 执行环境均可使用 `ctx.t()`。

## 类型定义

```ts
t(key: string, options?: Record<string, any>): string
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `key` | `string` | 翻译 key 或带占位符的模板（如 `Hello {{name}}`、`{{count}} rows`） |
| `options` | `object` | 可选。插值变量（如 `{ name: '张三', count: 5 }`），或 i18n 选项（如 `defaultValue`、`ns`） |

## 返回值

- 返回翻译后的字符串；若 key 无对应翻译且未提供 `defaultValue`，可能返回 key 本身或经插值后的字符串。

## 命名空间（ns）

RunJS 环境的**默认命名空间为 `runjs`**。在不指定 `ns` 时，`ctx.t(key)` 会从 `runjs` 命名空间查找 key。

```ts
// 默认从 runjs 命名空间取 key
ctx.t('Submit'); // 等价于 ctx.t('Submit', { ns: 'runjs' })

// 从指定命名空间取 key
ctx.t('Submit', { ns: 'myModule' });

// 从多个命名空间依次查找（先 runjs，再 common）
ctx.t('Save', { ns: ['runjs', 'common'] });
```

## 示例

### 简单 key

```ts
ctx.t('Submit');
ctx.t('No data');
```

### 带插值变量

```ts
const text = ctx.t('Hello {{name}}', { name: ctx.user?.nickname || 'Guest' });
ctx.render(`<div>${text}</div>`);
```

```ts
ctx.message.success(ctx.t('Processed {{count}} rows', { count: rows.length }));
```

### 相对时间等动态文案

```ts
if (minutes < 60) return ctx.t('{{count}} minutes ago', { count: minutes });
if (hours < 24) return ctx.t('{{count}} hours ago', { count: hours });
```

### 指定命名空间

```ts
ctx.t('Hello {{name}}', { name: 'Guest', ns: 'myModule' });
```

## 注意事项

- **本地化插件**：如需翻译文案，需先激活本地化插件。缺失翻译的词条会自动提取到本地化管理列表，便于统一维护和翻译。
- 支持 i18next 风格插值：在 key 中使用 `{{变量名}}`，在 `options` 中传入同名变量即可替换。
- 语言由当前上下文（如 `ctx.i18n.language`、用户 locale）决定。

## 相关

- [ctx.i18n](./i18n.md)：读取或切换语言
