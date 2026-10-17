import type { AgentView } from '../../shared/agents.js';
import type {
  ChatAgent,
  ChatAvailability,
} from '../../shared/conversations.js';

/** Whether the agent can take the viewer's work now, as the agent picker shows it. */
export function availabilityOf(agent: AgentView): ChatAvailability {
  const onlineRunners =
    agent.runners.team + agent.runners.mine > 0
      ? agent.runners.team + agent.runners.mine
      : 0;
  if (agent.unusable === null)
    return { online: true, reason: null, onlineRunners };
  return {
    online: false,
    reason:
      agent.unusable === 'othersPersonal'
        ? 'othersPersonal'
        : agent.unusable === 'noRunner' || agent.unusable === 'unreported'
          ? 'noRunner'
          : 'agentArchived',
    onlineRunners: 0,
  };
}

/** An agent of the Agent page's list as the agent picker takes it, named `name` (such as in the viewer's language). */
export function pickerAgentOf(
  agent: AgentView,
  name: string,
  isSystemDefault: boolean = false,
): ChatAgent {
  return {
    id: agent.id,
    name,
    description: agent.description,
    nameText: null,
    descriptionText: null,
    avatar: agent.avatar,
    isSystemDefault,
    isMyDefault: false,
    availability: availabilityOf(agent),
    quota: agent.quota,
    personalOnly: agent.personalOnly,
  };
}
