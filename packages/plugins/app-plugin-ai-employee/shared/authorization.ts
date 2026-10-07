/**
 * The AI settings items a Permission Set grants, under System management → AI. Each settings page is one item: `read`
 * opens it, and `manage` changes what it configures where the page changes anything at all. The server registers the
 * items and checks them on every management route; the client names them on its settings routes and controls.
 *
 * This module imports nothing, so both sides can read it.
 */

/** The `settings` resource type every item is registered under. */
export const AI_SETTINGS_RESOURCE_TYPE = 'settings';

/** The id of each item. */
export const AI_SETTINGS = {
  employees: 'ai.employees',
  skills: 'ai.skills',
  tools: 'ai.tools',
  llmServices: 'ai.llmServices',
  mcpServers: 'ai.mcpServers',
  usage: 'ai.usage',
  conversations: 'ai.conversations',
} as const;

export type AISettingsKey = keyof typeof AI_SETTINGS;
export type AISettingsItem = (typeof AI_SETTINGS)[AISettingsKey];
export type AISettingsAction = 'read' | 'manage';

/** The actions of each item, in the order the permission workspace lists the items. */
export const AI_SETTINGS_ACTIONS: Readonly<
  Record<AISettingsKey, readonly AISettingsAction[]>
> = {
  employees: ['read', 'manage'],
  skills: ['read'],
  tools: ['read'],
  llmServices: ['read', 'manage'],
  mcpServers: ['read', 'manage'],
  usage: ['read'],
  conversations: ['read'],
};

/** A check of one action on one item, in the shape route and `useCan` checks take. */
export interface AISettingsCheck {
  readonly resource: {
    readonly type: typeof AI_SETTINGS_RESOURCE_TYPE;
    readonly id: AISettingsItem;
  };
  readonly action: AISettingsAction;
}

export function aiSettingsCheck(
  key: AISettingsKey,
  action: AISettingsAction = 'read',
): AISettingsCheck {
  if (!AI_SETTINGS_ACTIONS[key].includes(action))
    throw new TypeError(
      `AI settings item ${AI_SETTINGS[key]} has no ${action}`,
    );
  return {
    resource: { type: AI_SETTINGS_RESOURCE_TYPE, id: AI_SETTINGS[key] },
    action,
  };
}
