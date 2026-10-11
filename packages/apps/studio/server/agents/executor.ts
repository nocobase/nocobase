import type { Agent } from '@nocobase/app-plugin-agents/shared/agents';
import { OPEN_PR_ACTION } from './capabilities.js';

export function canImplement(agent: Pick<Agent, 'actions'>): boolean {
  return agent.actions.includes(OPEN_PR_ACTION);
}
