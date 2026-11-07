// The static capability guide: the catalog and its wording, shared by the guide pages and the application home page.
import enUS from './content/en-US.js';
import zhCN from './content/zh-CN.js';
import type { CapabilityContent, GuideContent } from './content/types.js';

export * from './catalog.js';
export type * from './content/types.js';

const CONTENT: Readonly<Record<string, GuideContent>> = {
  'en-US': enUS,
  'zh-CN': zhCN,
};

/** The guide's wording in a locale. Languages without their own wording read English. */
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

/** One capability's wording, looked up by an id that may come from a URL. */
export function capabilityContent(
  content: GuideContent,
  id: string,
): CapabilityContent | undefined {
  return (content.capabilities as Readonly<Record<string, CapabilityContent>>)[
    id
  ];
}
