import {
  createContext,
  type ComponentType,
  type Context,
  type ReactNode,
} from 'react';

import type { SkillView } from '../../shared/skills.js';

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
}

/** Optional application-owned mount defaults in the skill details. Hosts enforce their own server permissions. */
export const SkillSettingsContext: Context<SkillSettings | null> =
  createContext<SkillSettings | null>(null);
