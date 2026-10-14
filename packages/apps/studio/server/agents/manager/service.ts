/**
 * The project manager (`shared/project-manager.ts`): one agent of Studio's own (`PROJECT_MANAGER_ID`, kept with the
 * agents plugin's `ensureSystem`) that arranges every issue's work as its executor. It runs with the tool, model and
 * effort of the agents discovered from runners an administrator chooses (its entries: the first choice, then the
 * fallback, so a runner takes the fallback when it has not the first), and its instructions are its role and the
 * allocation principles in force (`texts.ts`). It may do what a person may do on issues except open pull requests and
 * manage previews: it writes no code.
 *
 * Every agent discovered from runners gets the same built-in instructions (`WORKER_INSTRUCTIONS`) and every business
 * action in Studio's command scope, reports included (`setDefaults` of the agents plugin), within what the person who
 * woke it may do.
 *
 * Choosing the first choice also makes it the team's default chat agent, so a new conversation and AI intake go to it.
 */
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type {
  Agent,
  RunnerModelEntry,
} from '@nocobase/app-plugin-agents/shared/agents';
import type { DatabaseConnection } from '@nocobase/db';

import {
  PROJECT_MANAGER_ID,
  type ProjectManagerPatch,
  type ProjectManagerSettings,
  type ProjectManagerView,
} from '../../../shared/project-manager.js';
import { studioError } from '../../http/errors.js';
import { OPEN_PR_ACTION, PREVIEWS_MANAGE_ACTION } from '../capabilities.js';
import {
  BUILT_IN_PRINCIPLES,
  managerInstructions,
  WORKER_INSTRUCTIONS,
} from './texts.js';
import { readManagerSettings, writeManagerSettings } from './settings.js';

/** Compatibility catalog for the project manager's coordinating role; authorization uses its running identity. */
const NOT_FOR_MANAGER: readonly string[] = [
  OPEN_PR_ACTION,
  PREVIEWS_MANAGE_ACTION,
];

export interface ProjectManager {
  settings(conn?: DatabaseConnection): Promise<ProjectManagerSettings>;
  view(userId: string, canEdit: boolean): Promise<ProjectManagerView>;
  /** Saves the settings (the agents named must be enabled) and brings the project manager's agent up to date. */
  update(
    byUserId: string,
    patch: ProjectManagerPatch,
  ): Promise<ProjectManagerView>;
  /** Brings the project manager's agent up to date with the settings and the agents it runs with. */
  sync(byUserId?: string | null): Promise<Agent>;
  /** At start: the agents' defaults, then the project manager's agent. */
  ready(): Promise<void>;
}

/** The first entry of an agent's list: its tool, model and default effort. */
function entryOf(agent: Agent | null): RunnerModelEntry | null {
  return agent?.status === 'enabled' ? (agent.modelEntries[0] ?? null) : null;
}

export function createProjectManager(deps: {
  readonly defaultLocale?: string;
  readonly identityChanged?: () => void;
  readonly agents: Pick<
    Agents,
    | 'agents'
    | 'actions'
    | 'chat'
    | 'tx'
    | 'eligibility'
    | 'runners'
    | 'selectionPolicies'
  >;
}): ProjectManager {
  const { agents } = deps;
  const readSettings = (conn: DatabaseConnection) =>
    readManagerSettings(conn, deps.defaultLocale);
  agents.selectionPolicies.register(PROJECT_MANAGER_ID, async (conn) => ({
    fallbackAfterSeconds: (await readSettings(conn)).fallbackAfterSeconds,
  }));

  const workerActions = (): string[] => [...agents.actions.keys()];
  const managerActions = (): string[] =>
    agents.actions.keys().filter((key) => !NOT_FOR_MANAGER.includes(key));

  async function sync(byUserId: string | null = null): Promise<Agent> {
    const conn = agents.tx.read();
    const settings = await readSettings(conn);
    const entries: RunnerModelEntry[] = [];
    for (const id of [settings.firstChoiceAgentId, settings.fallbackAgentId]) {
      if (!id) continue;
      const entry = entryOf(await agents.agents.find(conn, id));
      if (
        entry &&
        !entries.some(
          (each) => each.tool === entry.tool && each.model === entry.model,
        )
      )
        entries.push({ ...entry });
    }
    return agents.agents.ensureSystem(
      {
        id: PROJECT_MANAGER_ID,
        name: settings.name,
        nameText: null,
        description: settings.description,
        instructions: managerInstructions(settings.principles),
        actions: managerActions(),
        modelEntries: entries,
      },
      byUserId,
    );
  }

  async function view(
    userId: string,
    canEdit: boolean,
  ): Promise<ProjectManagerView> {
    const conn = agents.tx.read();
    const settings = await readSettings(conn);
    const offered = (await agents.agents.listActive(conn)).filter(
      (agent) => agent.source === 'runner',
    );
    const manager = await agents.agents.find(conn, PROJECT_MANAGER_ID);
    const runners = await agents.runners.online(conn);
    const online = new Map(
      await Promise.all(
        offered.map(
          async (agent) =>
            [
              agent.id,
              manager
                ? await agents.eligibility.canClaim(
                    conn,
                    { ...manager, modelEntries: agent.modelEntries },
                    { actorUserId: userId, workspaceKey: true, runners },
                  )
                : false,
            ] as const,
        ),
      ),
    );
    return {
      ...settings,
      builtInPrinciples: BUILT_IN_PRINCIPLES,
      choices: offered.map((agent) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        online: online.get(agent.id) ?? false,
      })),
      canEdit,
    };
  }

  /** An agent the settings may name: one discovered from runners and enabled. */
  async function requireChoice(id: string, field: string): Promise<void> {
    const agent = await agents.agents.find(agents.tx.read(), id);
    if (!agent || agent.source !== 'runner' || agent.status !== 'enabled')
      throw studioError(
        'INVALID_ARGUMENT',
        'PROJECT_MANAGER_AGENT_INVALID',
        `${field} must name an enabled agent.`,
        { fieldViolations: [{ field, description: 'Not an enabled agent.' }] },
      );
  }

  return {
    settings: (conn) => readSettings(conn ?? agents.tx.read()),
    view,
    async update(byUserId, patch) {
      const current = await readSettings(agents.tx.read());
      const next: ProjectManagerSettings = {
        ...current,
        ...patch,
        ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
        ...(patch.description !== undefined
          ? {
              description:
                patch.description === null || patch.description.trim() === ''
                  ? null
                  : patch.description,
            }
          : {}),
        // The built-in text saved as it is, or nothing, is the built-in principles.
        ...(patch.principles !== undefined
          ? {
              principles:
                patch.principles === null ||
                patch.principles.trim() === '' ||
                patch.principles.trim() === BUILT_IN_PRINCIPLES.trim()
                  ? null
                  : patch.principles,
            }
          : {}),
      };
      if (next.firstChoiceAgentId && patch.firstChoiceAgentId !== undefined)
        await requireChoice(next.firstChoiceAgentId, 'firstChoiceAgentId');
      if (next.fallbackAgentId && patch.fallbackAgentId !== undefined)
        await requireChoice(next.fallbackAgentId, 'fallbackAgentId');
      if (
        next.fallbackAgentId !== null &&
        next.fallbackAgentId === next.firstChoiceAgentId
      )
        throw studioError(
          'INVALID_ARGUMENT',
          'PROJECT_MANAGER_AGENT_INVALID',
          'The fallback must be another agent than the first choice.',
          {
            fieldViolations: [
              {
                field: 'fallbackAgentId',
                description: 'The same agent as the first choice.',
              },
            ],
          },
        );
      await agents.tx.run(({ conn }) => writeManagerSettings(conn, next));
      await sync(byUserId);
      if (
        current.name !== next.name ||
        current.description !== next.description
      )
        deps.identityChanged?.();
      // New conversations and AI intake go to the first choice.
      if (
        patch.firstChoiceAgentId !== undefined &&
        next.firstChoiceAgentId !== null
      )
        await agents.chat.updateSettings(byUserId, {
          defaultAgentId: next.firstChoiceAgentId,
        });
      return view(byUserId, true);
    },
    sync,
    async ready() {
      agents.agents.setDefaults(() => ({
        instructions: WORKER_INSTRUCTIONS,
        actions: workerActions(),
      }));
      await agents.agents.applyDefaults({ preserveInstructions: true });
      await sync();
    },
  };
}
