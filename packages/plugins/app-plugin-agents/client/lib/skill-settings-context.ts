import { createContext, type ComponentType, type Context } from 'react';

import type { SkillView } from '../../shared/skills.js';

export interface SkillSettings {
  /** Rendered in the attachment section of a skill a manager of skills sees; `skillId` is `skill.id`. */
  readonly Settings: ComponentType<{
    readonly skillId: string;
    readonly skill: SkillView;
  }>;
  /** Whether to offer the team default ("global") mount for this skill; offered when absent. */
  readonly showGlobalMount?: (skill: SkillView) => boolean;
}

/** Optional application-owned mount defaults in the attachment section. Hosts enforce their own server permissions. */
export const SkillSettingsContext: Context<SkillSettings | null> =
  createContext<SkillSettings | null>(null);
