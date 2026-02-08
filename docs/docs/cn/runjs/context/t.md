# ctx.t()

在 RunJS 中用于翻译文案的 i18n 快捷函数，基于当前上下文的语言设置。适合按钮、标题、提示等内联文案的国际化。

## 类型定义

```typescript
t(key: string, options?: Record<string, any>): string
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `key` | string | 翻译 key 或带占位符的模板（如 `Hello {{name}}`、`{{count}} rows`） |
| `options` | object | 可选。插值变量（如 `{ name: '张三', count: 5 }`），或 i18n 选项（如 `defaultValue`、`ns`） |

## 返回值

- 返回翻译后的字符串；若 key 无对应翻译且未提供 `defaultValue`，可能返回 key 本身或经插值后的字符串。

## 说明

- 支持 i18next 风格插值：在 key 中使用 `{{变量名}}`，在 `options` 中传入同名变量即可替换。
- 语言由当前上下文（如用户语言、应用 locale）决定。
- 激活本地化插件后，`ctx.t` 使用的文案会自动提取到本地化管理列表，便于统一维护和翻译。

## 示例

### 简单 key

```javascript
ctx.t('Submit');
ctx.t('No data');
```

### 带插值变量

```javascript
const text = ctx.t('Hello {{name}}', { name: ctx.user?.nickname || 'Guest' });
ctx.render(`<div>${text}</div>`);
```

```js
ctx.message.success(ctx.t('Processed {{count}} rows', { count: rows.length }));
```

### 相对时间等动态文案

```javascript
if (minutes < 60) return ctx.t('{{count}} minutes ago', { count: minutes });
if (hours < 24) return ctx.t('{{count}} hours ago', { count: hours });
```

### 指定命名空间（ns）

翻译资源按命名空间划分时，可用 `ns` 指定从哪个命名空间取 key：

```javascript
// 从指定命名空间取 key
ctx.t('Submit', { ns: 'myModule' });

// 从多个命名空间依次查找（先 myModule，再 common）
ctx.t('Save', { ns: ['myModule', 'common'] });

// 带插值且指定命名空间
ctx.t('Hello {{name}}', { name: 'Guest', ns: 'myModule' });
```
