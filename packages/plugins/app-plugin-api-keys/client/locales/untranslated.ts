import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

type Resource = { readonly [key: string]: string | Resource };

/**
 * The English copy for a language these pages are not translated into yet, with every plural in that language's own
 * forms beside the English ones: `_one` keeps the singular, every other form the plural, so a count never falls back to
 * another language.
 */
export function untranslated(
  source: typeof enUS,
  locale: string,
): LocaleResource<typeof enUS> {
  const categories = new Intl.PluralRules(locale).resolvedOptions()
    .pluralCategories;
  const convert = (node: Resource): Resource => {
    const result: Record<string, string | Resource> = {};
    for (const [key, value] of Object.entries(node)) {
      if (typeof value !== 'string') {
        result[key] = convert(value);
        continue;
      }
      const plural = /^(.*)_(one|other)$/u.exec(key);
      if (!plural) {
        result[key] = value;
        continue;
      }
      // The English form stays, so every key of the source exists here too.
      result[key] = value;
      const base = plural[1];
      const one = node[`${base}_one`];
      const other = node[`${base}_other`];
      for (const category of categories)
        result[`${base}_${category}`] =
          category === 'one' && typeof one === 'string'
            ? one
            : typeof other === 'string'
              ? other
              : value;
    }
    return result;
  };
  return convert(source) as unknown as LocaleResource<typeof enUS>;
}
