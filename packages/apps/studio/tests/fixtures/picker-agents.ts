import type { ChatAgent } from '@nocobase/app-plugin-agents/shared/conversations';

/** An agent as `useAgentOptions().agents` gives it to the agent picker: enabled, online unless said. */
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
    personalOnly: false,
    isSystemDefault: false,
    isMyDefault: false,
    availability: { online: true, reason: null, onlineRunners: 1 },
    ...overrides,
  };
}
