/**
 * What an application may configure about the agent pages: the business actions an agent can be given
 * (`AgentActionCatalogContext`; the server's catalog by default), and whether the pages it renders under a heading or
 * tab bar of its own show their title (`PageTitleContext`; shown by default).
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
export {
  PageTitleContext,
  type PageTitleDisplay,
} from './lib/page-title-context.js';
