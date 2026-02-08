# ctx.i18n

i18n instance for the current context. Use it to **read or switch language**. For **translation**, use **`ctx.t()`** instead of `ctx.i18n.t` (see ctx.t() docs).

## Type Definition

```typescript
interface i18n: {
  language: string;
  changeLanguage(lng: string): Promise<any>;
}
```

## Properties

- **language** (string): Current active language code (e.g. `zh-CN`, `en-US`).

## Methods

### changeLanguage(lng)

Switch the current language.

- **lng** (string): Target language code (e.g. `'en'`, `'zh-CN'`).
- **Returns**: Promise that resolves when the language has been switched.

## Notes

- For **translation**, use **`ctx.t()`**, not `ctx.i18n.t`. See ctx.t() documentation.

## Examples

```ts
// Read current language
const current = ctx.i18n.language;

// Switch language
await ctx.i18n.changeLanguage('en');
await ctx.i18n.changeLanguage('zh-CN');
```
