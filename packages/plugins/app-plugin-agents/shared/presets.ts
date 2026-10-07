/**
 * Agent presets: roles people can start a new agent from. A preset only fills the new agent's form (its description,
 * instructions and recommended business actions); once created, the agent is like any other and every field can be
 * changed. The application registers its presets on the server (`agents.presets.register`); this plugin ships none.
 *
 * `GET agents/presets` (`agents.agents` read) answers `{ data: AgentPreset[], meta: { total } }`.
 */
import type { AgentType } from './agents.js';
import type { I18nText } from './i18n.js';

export const PRESETS_ROUTE = 'agents/presets';

export interface AgentPreset {
  /** Stable, such as `reviewer`. */
  readonly key: string;
  /** English; the panel shows `nameText` in the viewer's language when it has it. */
  readonly name: string;
  /** What the agent is good at, as the agent's description; English, translated through `descriptionText`. */
  readonly description: string;
  readonly nameText: I18nText;
  readonly descriptionText: I18nText;
  /** The agent's instructions, in English: they are prompt text, not product copy. */
  readonly instructions: string;
  /** The type the new-agent dialog starts it as; the person may still pick the other. `runner` when absent. */
  readonly type?: AgentType;
  /**
   * The business actions to tick, among those the application offers now (`GET agents/actions`): a preset never
   * recommends an action nobody provides.
   */
  readonly actions: readonly string[];
}
