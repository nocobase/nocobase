import type { GuideEntryId, PromptIdOf } from '../catalog.js';
import type { GuideGroupId, GuidePluginRole, GuideSource } from '../types.js';

export interface PromptContent {
  readonly label: string;
  /** Shown and copied as it is; the bracketed parts are for the reader to replace. */
  readonly template: string;
  /** The same prompt filled in for one business, offered as a starting point. */
  readonly example?: string;
}

export interface EntryContent<P extends string = string> {
  readonly title: string;
  /** One sentence: the business problem it solves. Shown in the list and searched. */
  readonly summary: string;
  /** Typical business situations, each one short sentence. */
  readonly scenarios: readonly string[];
  /** What to prepare before asking. Omitted: the default for the entry's source or role. */
  readonly prerequisite?: string;
  readonly prompts: Readonly<Record<P, PromptContent>>;
  /** Technical notes for developers, shown folded. */
  readonly reference: readonly string[];
}

/** Everything the guide shows in one language. A language file must carry every key, so languages never drift. */
export interface GuideContent {
  readonly nav: { readonly title: string; readonly description: string };
  readonly page: {
    readonly title: string;
    readonly description: string;
    readonly search: string;
    readonly count: string;
    readonly noResults: string;
    readonly clear: string;
    readonly columns: {
      readonly index: string;
      readonly name: string;
      readonly source: string;
    };
    readonly empty: {
      readonly title: string;
      readonly description: string;
      readonly parts: readonly string[];
    };
  };
  readonly sources: Readonly<Record<GuideSource | 'all', string>>;
  readonly roles: Readonly<Record<GuidePluginRole, string>>;
  readonly groups: Readonly<Record<GuideGroupId, string>>;
  readonly detail: {
    readonly currentApplication: string;
    readonly dependencyOnly: string;
    readonly back: string;
    readonly scenarios: string;
    readonly prerequisite: string;
    readonly defaultPrerequisite: Readonly<
      Record<GuideSource | GuidePluginRole, string>
    >;
    readonly prompts: string;
    readonly promptHint: string;
    readonly template: string;
    readonly example: string;
    readonly copy: string;
    readonly copied: string;
    readonly copyFailed: string;
    readonly reset: string;
    readonly related: string;
    readonly docs: string;
    readonly demo: string;
    readonly adapt: {
      readonly title: string;
      readonly steps: readonly string[];
    };
    readonly covers: string;
    readonly reference: string;
    readonly packageName: string;
    readonly skills: string;
    readonly source: string;
    readonly missing: string;
  };
  readonly home: {
    readonly title: string;
    readonly description: string;
    readonly viewAll: string;
    readonly open: string;
  };
  /** Wording for a declared plugin the guide does not know yet; `{{name}}` is its package name. */
  readonly unlisted: EntryContent<'main'>;
  /** Exactly the known entries, each with exactly its declared prompts. */
  readonly entries: {
    readonly [K in GuideEntryId]: EntryContent<PromptIdOf<K>>;
  };
}
