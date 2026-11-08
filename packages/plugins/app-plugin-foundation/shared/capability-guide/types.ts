/** Where a catalog entry comes from: a core module or a plugin the application depends on. */
export type GuideSource = 'kernel' | 'plugin';

/** The `source` filter of the guide. */
export type GuideSourceFilter = 'all' | GuideSource;

/** A plugin that demonstrates a capability, or one that only carries a Skill for the agent. */
export type GuidePluginRole = 'example' | 'skill';

/** Business groups, a secondary way to browse; they never decide what is listed. */
export const GUIDE_GROUP_IDS = [
  'data',
  'access',
  'process',
  'integration',
  'experience',
  'ai',
  'development',
] as const;

export type GuideGroupId = (typeof GUIDE_GROUP_IDS)[number];

/** The editorial part of an entry for a known package: everything except its wording, which is per language. */
export interface GuideEntryDefinition {
  readonly packageName: string;
  readonly source: GuideSource;
  readonly role?: GuidePluginRole;
  readonly group: GuideGroupId;
  /** Core packages introduced inside this entry instead of on their own, such as `@nocobase/drive` in the file plugin. */
  readonly covers?: readonly string[];
  /** Ids of related entries; links appear only for those the application also lists. */
  readonly related: readonly string[];
  /** App-relative path of the page the example plugin itself registers. */
  readonly demo?: string;
  /** Path on the documentation site, without the language prefix. Supplementary: it never decides inclusion. */
  readonly docs?: string;
  /** Shown on the application home page. */
  readonly featured?: boolean;
  /** Repository path of the package, for the developer reference. */
  readonly sourcePath: string;
  /** Skills the agent reads for this entry. */
  readonly skills: readonly string[];
  /** Prompt ids in display order; the wording is in the content files. */
  readonly prompts: readonly string[];
}
