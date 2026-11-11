import { useTranslation } from '@nocobase/i18n/client';
import enUS from './copy-en-US.js';
import zhCN from './copy-zh-CN.js';

/** Editorial guide copy follows the catalog's English/Chinese fallback, independently of the host namespace. */
export function useDetailCopy() {
  const { i18n } = useTranslation();
  const copy = i18n.language.startsWith('zh') ? zhCN : enUS;
  return {
    t(
      this: void,
      key: string,
      values: Readonly<Record<string, string | number>> = {},
    ): string {
      let value: unknown = copy;
      for (const part of key.split('.')) {
        value =
          value && typeof value === 'object'
            ? (value as Readonly<Record<string, unknown>>)[part]
            : undefined;
      }
      if (typeof value !== 'string') return key;
      return value.replace(/{{(\w+)}}/g, (placeholder, name: string) =>
        Object.hasOwn(values, name) ? String(values[name]) : placeholder,
      );
    },
  };
}
