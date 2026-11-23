import {
  createContext,
  type ComponentType,
  type Context,
  type ReactNode,
} from 'react';

import type { Skill, SkillView } from '../../shared/skills.js';

/** A tab above the skill library's table, showing the skills `match` accepts. */
export interface SkillListFilter {
  readonly key: string;
  readonly label: ReactNode;
  readonly match: (skill: Skill) => boolean;
}

/** What an application adds to the skill library's list, typically from each skill's `metadata`. */
export interface SkillListExtension {
  /** Tabs above the table, each with its count; the first, usually every skill, is selected at first. */
  readonly filters?: readonly SkillListFilter[];
  /** A column after the name, such as what a skill is for. */
  readonly column?: {
    readonly header: ReactNode;
    readonly Cell: ComponentType<{ readonly skill: Skill }>;
  };
}

export interface SkillSettings {
  /** Rendered in the attachment section of a skill a manager of skills sees; `skillId` is `skill.id`. */
  readonly Settings: ComponentType<{
    readonly skillId: string;
    readonly skill: SkillView;
  }>;
  /** Whether to offer the team default ("global") mount for this skill; offered when absent. */
  readonly showGlobalMount?: (skill: SkillView) => boolean;
  /**
   * Why a skill the application protects is read only, shown in place of the generic note on its page (only the
   * creator and administrators may change it); `undefined` keeps the generic note. A hook, so the application can
   * translate what it returns.
   */
  readonly useReadOnlyNote?: (skill: SkillView) => ReactNode | undefined;
  /** Filters and a column for the library's list; a hook, so the application can translate what it returns. */
  readonly useList?: () => SkillListExtension;
}

/** Optional application-owned mount defaults in the attachment section, and additions to the library's list. Hosts enforce their own server permissions. */
export const SkillSettingsContext: Context<SkillSettings | null> =
  createContext<SkillSettings | null>(null);
