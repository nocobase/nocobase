/**
 * What an application may configure about the agent pages: the business actions an agent can be given
 * (`AgentActionCatalogContext`; the server's catalog by default).
 */
export {
  AgentActionCatalogContext,
  type AgentActionCatalog,
  type AgentActionOption,
} from './lib/action-catalog.js';
export {
  SkillSettingsContext,
  type SkillSettings,
} from './lib/skill-settings-context.js';
export { SkillMountToggle } from './lib/skill-settings.js';
