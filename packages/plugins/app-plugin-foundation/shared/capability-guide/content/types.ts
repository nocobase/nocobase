import type {
  CapabilityGroupId,
  CapabilityId,
  CapabilityPrerequisite,
  PromptIdOf,
} from '../catalog.js';

export interface PromptContent {
  readonly label: string;
  readonly text: string;
}

export interface CapabilityContent<P extends string = string> {
  readonly title: string;
  /** One sentence: the business problem it solves. Shown on cards and searched. */
  readonly summary: string;
  /** Two or three typical situations, each one short sentence. */
  readonly scenarios: readonly string[];
  /** What to prepare before asking, beyond the prerequisite badge. */
  readonly prerequisite: string;
  readonly prompts: Readonly<Record<P, PromptContent>>;
}

/** Everything the guide shows in one language. A language file must carry every key, so the two never drift. */
export interface GuideContent {
  readonly nav: { readonly title: string; readonly description: string };
  readonly page: {
    readonly title: string;
    readonly description: string;
    readonly requestTitle: string;
    readonly requestHint: string;
    readonly requestParts: readonly {
      readonly title: string;
      readonly example: string;
    }[];
    readonly search: string;
    readonly all: string;
    readonly noResults: string;
    readonly clear: string;
    readonly count: string;
  };
  readonly groups: Readonly<
    Record<
      CapabilityGroupId,
      { readonly title: string; readonly description: string }
    >
  >;
  readonly prerequisites: Readonly<Record<CapabilityPrerequisite, string>>;
  readonly detail: {
    readonly back: string;
    readonly scenarios: string;
    readonly prompts: string;
    readonly promptHint: string;
    readonly copy: string;
    readonly copied: string;
    readonly copyFailed: string;
    readonly reset: string;
    readonly prerequisite: string;
    readonly related: string;
    readonly docs: string;
    readonly demo: string;
    readonly demoHint: string;
    readonly reference: string;
    readonly packages: string;
    readonly skills: string;
    readonly applicationOwned: string;
    readonly missing: string;
  };
  readonly home: {
    readonly title: string;
    readonly description: string;
    readonly viewAll: string;
    readonly open: string;
  };
  /** Exactly the catalog's capabilities, each with exactly its declared prompts. */
  readonly capabilities: {
    readonly [K in CapabilityId]: CapabilityContent<PromptIdOf<K>>;
  };
}
