/**
 * The roster of a project manager's turn: a brief section listing the agents it may hand work to, for the person its
 * run acts for (`Agents.roster`: the enabled agents discovered from runners and reported in the last 14 days), each
 * with how to mention it, what it is good at, whether a runner would take its work now, whether only personal runners
 * have it, and how many of its runs are open. Only on the project manager's runs on issues; the context layer is
 * outside the session fingerprint, so a roster that changes does not end its session.
 */
import type {
  Agents,
  BriefSectionProvider,
} from '@nocobase/app-plugin-agents/server/tokens';
import type { ModelSelectionWait } from '@nocobase/app-plugin-agents/shared/runs';
import type { AvailableAgent } from '@nocobase/app-plugin-agents/shared/agents';

import { PROJECT_MANAGER_ID } from '../../../shared/project-manager.js';
import { ISSUE_SUBJECT } from '../catalog/triggers.js';
import { AGENT_KIND } from '../tx.js';

/** One agent as the roster lists it. */
export function rosterLine(
  agent: AvailableAgent & {
    readonly canStartNow?: boolean;
    readonly wait?: ModelSelectionWait | null;
  },
): string {
  const state = [
    agent.online ? 'online' : 'no runner can take its work now',
    `canStartNow=${agent.canStartNow === true}`,
    ...(agent.wait
      ? [
          `sampledAt=${agent.wait.sampledAt}`,
          ...agent.wait.entries.map(
            (entry) =>
              `${entry.tool}${entry.model ? `/${entry.model}` : ''}: ${entry.reason}`,
          ),
        ]
      : []),
    ...(agent.personalOnly ? ['personal runners only'] : []),
    `${agent.busy} open ${agent.busy === 1 ? 'run' : 'runs'}`,
  ].join(', ');
  const goodAt = agent.goodAt.trim().replace(/\s+/gu, ' ');
  return `- [@${agent.name}](mention://${AGENT_KIND}/${agent.id}) (${state}): ${goodAt || 'nothing written yet'}`;
}

/** The section: the agents, or that there is none to hand work to. */
export function renderRoster(
  agents: readonly (AvailableAgent & {
    readonly canStartNow?: boolean;
    readonly wait?: ModelSelectionWait | null;
  })[],
): string {
  return [
    '## Agents you can hand work to',
    '',
    agents.length > 0
      ? 'Mention one in a comment to hand it a step. Pick by what each is good at; prefer a fitting one marked canStartNow=true. This is a sampled snapshot and reserves no slot.'
      : 'No agent is enabled for this person now. Move the issue to `blocked` and say that an agent has to be enabled or a runner connected.',
    ...(agents.length > 0 ? ['', ...agents.map(rosterLine)] : []),
  ].join('\n');
}

export function managerRoster(
  agents: Pick<Agents, 'roster' | 'agents' | 'claims'>,
): BriefSectionProvider {
  return {
    key: 'studio.projectManager.roster',
    order: 10,
    async section(conn, claim) {
      if (
        claim.agent.id !== PROJECT_MANAGER_ID ||
        claim.run.subject.kind !== ISSUE_SUBJECT
      )
        return null;
      const roster = await agents.roster(conn, claim.run.actorUserId);
      const detailed = [];
      for (const candidate of roster) {
        const agent = await agents.agents.findWorkable(conn, candidate.id);
        const wait = agent
          ? await agents.claims
              .diagnose(
                conn,
                {
                  ...claim.run,
                  id: `@roster:${candidate.id}:${claim.run.id}`,
                  requires: [],
                  agentId: candidate.id,
                  status: 'queued',
                  runnerId: null,
                  availableAt: null,
                },
                agent,
              )
              .catch(() => null)
          : null;
        detailed.push({
          ...candidate,
          wait,
          canStartNow:
            wait?.entries.some((entry) => entry.reason === 'ready') === true,
        });
      }
      return renderRoster(detailed);
    },
  };
}
