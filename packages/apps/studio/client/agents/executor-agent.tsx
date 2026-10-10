/**
 * An agent among an executor picker's people: the agent picker's row (avatar, availability dot, name), its availability
 * read from the agents plugin's list (`useAgentOptions`), which the projects plugin's executor options do not carry.
 */
import { useAgentOptions } from '@nocobase/app-plugin-agents/client/kit';
import type { ReactElement } from 'react';

import { AgentIdentity } from '@/components/agent-picker';
import { useAgentPickerLabels } from '@/extensions/nocobase-agent-chat/chat-i18n';

/** Draws an agent executor by id and name: on the trigger (`ring` the card behind it) or in the menu (the popover). */
export function useExecutorAgent(): (
  id: string,
  name: string,
  place: 'trigger' | 'menu',
) => ReactElement {
  const agents = useAgentOptions().agents;
  const labels = useAgentPickerLabels();
  return (id, name, place) => (
    <AgentIdentity
      name={name}
      availability={
        agents.find((agent) => agent.id === id)?.availability ?? null
      }
      labels={labels}
      ringClassName={place === 'menu' ? 'ring-popover' : 'ring-card'}
    />
  );
}
