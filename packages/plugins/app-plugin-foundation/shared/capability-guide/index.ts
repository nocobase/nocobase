// The capability guide: a catalog built from the application's dependencies and its wording, shared by the guide
// pages and the application home page.
import enUS from './content/en-US.js';
import zhCN from './content/zh-CN.js';
import type { EntryContent, GuideContent } from './content/types.js';
import type { CatalogEntry } from './catalog.js';

export * from './catalog.js';
export * from './types.js';
export type * from './content/types.js';

const CONTENT: Readonly<Record<string, GuideContent>> = {
  'en-US': enUS,
  'zh-CN': zhCN,
};

/** The guide's wording in a locale. The mockup carries English and Chinese; other languages read English. */
export function guideContent(locale: string): GuideContent {
  return CONTENT[locale] ?? (locale.startsWith('zh') ? zhCN : enUS);
}

/** Replace `{{name}}` placeholders. */
export function format(
  text: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return text.replace(/{{(\w+)}}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/** One entry's wording; a plugin the guide does not know reads the generic wording with its name filled in. */
export function entryContent(
  content: GuideContent,
  entry: CatalogEntry,
): EntryContent {
  const known = (
    content.entries as Readonly<Record<string, EntryContent | undefined>>
  )[entry.id];
  if (known) return known;
  const fill = (text: string): string =>
    format(text, { name: entry.packageName });
  const { unlisted } = content;
  return {
    title: fill(unlisted.title),
    summary: fill(unlisted.summary),
    scenarios: unlisted.scenarios.map(fill),
    prompts: {
      main: {
        label: unlisted.prompts.main.label,
        template: fill(unlisted.prompts.main.template),
      },
    },
    reference: unlisted.reference.map(fill),
  };
}

/** The prerequisite shown for an entry: its own, else the default for its role or source. */
export function entryPrerequisite(
  content: GuideContent,
  entry: CatalogEntry,
): string {
  return (
    entryContent(content, entry).prerequisite ??
    content.detail.defaultPrerequisite[entry.role ?? entry.source]
  );
}

/** Everything keyword search looks at for one entry. */
export function searchableText(
  content: GuideContent,
  entry: CatalogEntry,
): string {
  const text = entryContent(content, entry);
  return [
    entry.name,
    entry.packageName,
    text.title,
    text.summary,
    ...text.scenarios,
    entry.group ? content.groups[entry.group] : '',
    entry.role ? content.roles[entry.role] : '',
    content.sources[entry.source],
  ].join('\n');
}
