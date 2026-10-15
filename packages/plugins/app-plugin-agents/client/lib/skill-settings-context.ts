import { createContext, type ComponentType, type Context } from 'react';

export interface SkillSettings {
  readonly Settings: ComponentType<{ readonly skillId: string }>;
}

/** Optional application-owned mount defaults in the attachment section. Hosts enforce their own server permissions. */
export const SkillSettingsContext: Context<SkillSettings | null> =
  createContext<SkillSettings | null>(null);
