import type { ChatAgent } from '@nocobase/app-plugin-agents/shared/conversations';

/** An agent as `useAgentOptions().agents` gives it to the agent picker: a runner agent, online unless said. */
export function pickerAgent(
  id: string,
  name: string,
  overrides: Partial<ChatAgent> = {},
): ChatAgent {
  return {
    id,
    name,
    description: null,
    nameText: null,
    descriptionText: null,
    avatar: null,
    type: 'runner',
    models: [],
    personal: false,
    isSystemDefault: false,
    isMyDefault: false,
    availability: { online: true, reason: null, onlineRunners: 1 },
    ...overrides,
  };
}
