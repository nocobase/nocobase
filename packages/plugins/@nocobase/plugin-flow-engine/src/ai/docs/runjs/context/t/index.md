# ctx.t()

i18n shortcut for translating text in RunJS. Uses the current context language. Good for buttons, titles, tips, etc.

## Type Definition

```typescript
t(key: string, options?: Record<string, any>): string
```

`options` is the same as [i18next t() options](https://www.i18next.com/overview/api#t): interpolation variables and/or i18n options.

## Parameters

- **key** (string): Translation key or template with placeholders (e.g. `Hello {{name}}`, `{{count}} rows`).
- **options** (object): Optional. Any key-value is used for interpolation (`{{var}}` in key). Common i18next options:
  - **defaultValue**: Fallback when key is missing (can include `{{var}}`).
  - **count**: For plurals; resource uses `key_one` / `key_other` (and optionally `key_zero`). Variable name must be `count`.
  - **ns**: Namespace(s) to look up (string or array, e.g. `'myModule'` or `['myModule', 'common']`).
  - **lng**: Override language for this call (e.g. `'en'`, `'zh-CN'`).

## Returns

Translated string. If key is missing and no `defaultValue`, may return key or interpolated string.

## Notes

- i18next-style interpolation: use `{{varName}}` in key and pass the same name in `options`.
- Language comes from current context (user locale, app locale).
- For plurals: in resources use `key_one` (singular) and `key_other` (plural); call with `ctx.t('key', { count: n })`.
- When the localization plugin is enabled, text used in `ctx.t` is automatically extracted to the localization management list for centralized maintenance and translation.
