/**
 * The English settings messages for a language they are not yet translated into, with every plural form that
 * language uses: `count` picks `_few` or `_many` in Russian or Spanish, where English has only `_one` and `_other`.
 * Each added form repeats the English `_other` text.
 */
export function withPluralForms<TResource extends object>(
  resource: TResource,
  locale: string,
): TResource {
  const categories = new Intl.PluralRules(locale).resolvedOptions()
    .pluralCategories;
  const visit = (node: unknown): unknown => {
    if (typeof node !== 'object' || node === null) return node;
    const copy: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node)) copy[key] = visit(value);
    for (const [key, value] of Object.entries(node)) {
      if (!key.endsWith('_other') || typeof value !== 'string') continue;
      const base = key.slice(0, -'_other'.length);
      for (const category of categories)
        if (!(`${base}_${category}` in copy))
          copy[`${base}_${category}`] = value;
    }
    return copy;
  };
  return visit(resource) as TResource;
}
