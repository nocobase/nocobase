/**
 * Joins the agents plugin and the projects plugin in Studio (`bind.ts`), from the application's container, and binds
 * Studio's Reports page service (`../reports`).
 *
 * Boot order: Studio's own providers are registered after every plugin's, so they boot after the plugins have booted,
 * and before any route is served or any plugin's `ready()` runs. Binding at boot therefore adds the `agent` kind, the
 * stage rule types and the "Software development" template before the projects plugin first uses them: its services
 * read the kind registry on each use, and its `ready()` waits for the templates added while the providers booted.
 */
import type { Application } from '@nocobase/app-server/application';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import {
  projectsAccessToken,
  projectsDelegatedWritesToken,
  projectsIntakeOrganizerToken,
  projectsKindsToken,
  projectsNoticeRulesToken,
  projectsPlanHooksToken,
  projectsPlanSourceToken,
  projectsRequestActorToken,
  projectsStatusRulesToken,
  projectsToken,
  projectsWorkflowTemplatesToken,
} from '@nocobase/app-plugin-projects/server/tokens';
import type {
  DelegatedWrites,
  IntakeOrganizer,
  OrganizerJobRef,
  PlanHooks,
  ProjectsTx,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { IntakeAiTask } from '@nocobase/app-plugin-projects/shared/intake-ai';
import type { PlanDecided } from '@nocobase/app-plugin-projects/shared/plans';
import {
  ServiceProvider,
  type ServiceContainer,
} from '@nocobase/service-provider';

import {
  agentsToken,
  type Agents,
} from '@nocobase/app-plugin-agents/server/tokens';
import { registerCliSkill } from './cli-skill.js';
import {
  releasesAccessToken,
  releasesToken,
} from '@nocobase/app-plugin-releases/server/tokens';
import { noPermissions } from '@nocobase/app-plugin-releases/shared/access';
import { databaseManagerToken } from '@nocobase/db';

import { narrowedByScope } from '../access/grants.js';
import { studioAccessToken } from '../access/token.js';
import { ROLES, type RoleTitle } from '../../shared/access.js';
import { studioInboxPortToken } from '../inbox/port.js';
import { studioInboxSourceToken, studioInboxToken } from '../inbox/token.js';
import { knowledgeToken } from '@nocobase/app-plugin-knowledge/server/tokens';
import { knowledgeActionsOf } from '../knowledge/actions.js';
import { levelsFrom } from '../knowledge/directory.js';
import { createStudioReports } from '../reports/service.js';
import { studioReportsToken } from '../reports/token.js';
import { studioGitToken } from '../git/token.js';
import { bindStudioAgents } from './bind.js';
import {
  createDelegations,
  gitPullRequests,
} from './conversation/delegation.js';
import { studioDelegationsToken } from './conversation/delegation-token.js';
import {
  createPermissionSource,
  type ReaderGrantsOf,
} from './commands/permissions.js';
import type { RolesOf } from './conversation/asker.js';
import type { InboxSource } from './conversation/inbox.js';
import { runScopeStep, type RunPrincipal } from './run-principal.js';

/**
 * The plan hooks as bound in the container: a stand-in that forwards to the bridge while it is connected, so the
 * binding (which cannot be replaced) outlives a disconnect.
 */
class PlanHooksSlot implements PlanHooks {
  public current: PlanHooks | undefined;

  public async onPlanDecided(tx: ProjectsTx, decided: PlanDecided) {
    await this.current?.onPlanDecided?.(tx, decided);
  }
}

const slots = new WeakMap<ServiceContainer, PlanHooksSlot>();

function bindPlanHooks(
  container: ServiceContainer,
  hooks: PlanHooks,
): () => void {
  let slot = slots.get(container);
  if (!slot) {
    if (container.has(projectsPlanHooksToken)) {
      console.error(
        'Agents could not hear operation plans: another plugin binds the plan hooks.',
      );
      return () => undefined;
    }
    slot = new PlanHooksSlot();
    slots.set(container, slot);
    container.instance(projectsPlanHooksToken, slot);
  }
  const bound = slot;
  bound.current = hooks;
  return () => {
    if (bound.current === hooks) bound.current = undefined;
  };
}

/**
 * The intake organiser as bound in the container: a stand-in that forwards to Studio's while it is connected, so the
 * binding outlives a disconnect (and then reports that AI is not available).
 */
class IntakeOrganizerSlot implements IntakeOrganizer {
  public current: IntakeOrganizer | undefined;

  public availability(userId: string) {
    return (
      this.current?.availability(userId) ??
      Promise.resolve({ available: false, reason: 'notConfigured' })
    );
  }

  public start(task: IntakeAiTask) {
    if (!this.current)
      return Promise.reject(new Error('AI is not set up for intake.'));
    return this.current.start(task);
  }

  public progress(job: OrganizerJobRef) {
    return this.current?.progress(job) ?? Promise.resolve(null);
  }

  public cancel(job: OrganizerJobRef, byUserId: string) {
    return this.current?.cancel(job, byUserId) ?? Promise.resolve();
  }
}

const organizerSlots = new WeakMap<ServiceContainer, IntakeOrganizerSlot>();

function bindIntakeOrganizer(
  container: ServiceContainer,
  organizer: IntakeOrganizer,
): () => void {
  let slot = organizerSlots.get(container);
  if (!slot) {
    if (container.has(projectsIntakeOrganizerToken)) {
      console.error(
        'Agents could not organise intake: another plugin binds the intake organiser.',
      );
      return () => undefined;
    }
    slot = new IntakeOrganizerSlot();
    organizerSlots.set(container, slot);
    container.instance(projectsIntakeOrganizerToken, slot);
  }
  const bound = slot;
  bound.current = organizer;
  return () => {
    if (bound.current === organizer) bound.current = undefined;
  };
}

/**
 * How a run acts in the projects plugin's API, as bound in the container: stand-ins that forward to Studio's run
 * principal while it is connected, so the bindings (which cannot be replaced) outlive a disconnect.
 */
class RunPrincipalSlot {
  public current: RunPrincipal | undefined;

  public readonly actor = (context: Parameters<RunPrincipal['actor']>[0]) =>
    this.current?.actor(context) ?? Promise.resolve(undefined);

  public readonly planSource = (
    context: Parameters<RunPrincipal['planSource']>[0],
  ) => this.current?.planSource(context) ?? Promise.resolve(undefined);

  public readonly writes: DelegatedWrites = {
    covers: (viewer) => this.current?.writes.covers(viewer) ?? false,
    write: (viewer, request) => {
      if (!this.current)
        return Promise.reject(new Error('Studio is not connected.'));
      return this.current.writes.write(viewer, request);
    },
  };
}

const principalSlots = new WeakMap<ServiceContainer, RunPrincipalSlot>();

function bindRunPrincipal(
  container: ServiceContainer,
  principal: RunPrincipal,
): () => void {
  let slot = principalSlots.get(container);
  if (!slot) {
    if (
      container.has(projectsRequestActorToken) ||
      container.has(projectsDelegatedWritesToken) ||
      container.has(projectsPlanSourceToken)
    ) {
      console.error(
        'Agents could not act for runs in the projects API: another plugin binds who acts there.',
      );
      return () => undefined;
    }
    slot = new RunPrincipalSlot();
    principalSlots.set(container, slot);
    container.instance(projectsRequestActorToken, slot.actor);
    container.instance(projectsDelegatedWritesToken, slot.writes);
    container.instance(projectsPlanSourceToken, slot.planSource);
  }
  const bound = slot;
  bound.current = principal;
  return () => {
    if (bound.current === principal) bound.current = undefined;
  };
}

/**
 * Bounds a run calling the API by its scope (`runKeyScope`): what the command gate allows it, and for the Reports page
 * every run's figures when the person may read them. Once per container: the authorization plugin keeps its steps.
 */
const scopedContainers = new WeakSet<ServiceContainer>();

function scopeRuns(
  container: ServiceContainer,
  agents: Agents,
  grantsOf: ReaderGrantsOf,
): void {
  if (!container.has(authorizationToken) || scopedContainers.has(container))
    return;
  scopedContainers.add(container);
  container.resolve(authorizationToken).use(runScopeStep(agents, grantsOf));
}

/** Studio's inbox as agents read it, when Studio keeps one. */
function inboxOf(container: ServiceContainer): () => InboxSource | undefined {
  return () =>
    container.has(studioInboxSourceToken)
      ? container.resolve(studioInboxSourceToken)
      : undefined;
}

/**
 * Who may read the reports and every run, from Studio's roles: the Reports page grant and `agents.agents` read, of the
 * person (a run: the person who woke the agent), kept to the scope of the API key they called with.
 */
function readerGrantsOf(container: ServiceContainer): ReaderGrantsOf {
  return async (identity) => {
    if (!container.has(studioAccessToken))
      return { reports: false, allRuns: false };
    const access = container.resolve(studioAccessToken);
    const held = await access.grantsOfUser(identity.userId);
    const grants = identity.keyScope
      ? narrowedByScope(held, identity.keyScope, access.catalog())
      : held;
    return {
      reports: grants.pages.includes('reports'),
      allRuns: grants.settings['agents.agents/read'] === true,
    };
  };
}

/** What the built-in roles are called in an agent's brief, which is English. */
const ROLE_NAMES: Readonly<Record<string, string>> = {
  [ROLES.owner]: 'Owner',
  [ROLES.admin]: 'Administrator',
  [ROLES.contributor]: 'Contributor',
};

function roleName(key: string, title: RoleTitle | null): string {
  return ROLE_NAMES[key] ?? (typeof title === 'string' && title ? title : key);
}

/** The roles a person holds, by name, from Studio's roles. */
function rolesOf(container: ServiceContainer): RolesOf {
  return async (userId) => {
    if (!container.has(studioAccessToken))
      return { roles: [], superuser: false };
    const held = await container.resolve(studioAccessToken).rolesOfUser(userId);
    return {
      roles: held.roles.map((role) => roleName(role.key, role.title)),
      superuser: held.superuser,
    };
  };
}

/** Returns what disconnects, or undefined when the projects plugin is not registered. */
export function connectProjects(
  container: ServiceContainer,
  agents: Agents,
  options: {
    readonly basePath?: string;
    /** `studio.agents.queuedExpiryHours`: how long an issue's run waits for a runner; 0 waits forever. */
    readonly queuedExpiryHours?: number;
  } = {},
): (() => void) | undefined {
  if (!container.has(projectsToken) || !container.has(projectsKindsToken))
    return undefined;
  const grantsOf = readerGrantsOf(container);
  scopeRuns(container, agents, grantsOf);
  return bindStudioAgents({
    agents,
    kinds: container.resolve(projectsKindsToken),
    projects: () => container.resolve(projectsToken),
    ...(container.has(projectsNoticeRulesToken)
      ? { noticeRules: container.resolve(projectsNoticeRulesToken) }
      : {}),
    ...(container.has(projectsStatusRulesToken)
      ? { statusRules: container.resolve(projectsStatusRulesToken) }
      : {}),
    ...(container.has(projectsWorkflowTemplatesToken)
      ? { templates: container.resolve(projectsWorkflowTemplatesToken) }
      : {}),
    access: () =>
      container.has(projectsAccessToken)
        ? container.resolve(projectsAccessToken)
        : undefined,
    catalog: () =>
      container.has(studioAccessToken)
        ? container.resolve(studioAccessToken).catalog()
        : undefined,
    bindPlanHooks: (hooks) => bindPlanHooks(container, hooks),
    bindIntakeOrganizer: (organizer) =>
      bindIntakeOrganizer(container, organizer),
    bindRunPrincipal: (principal) => bindRunPrincipal(container, principal),
    inbox: inboxOf(container),
    grantsOf,
    rolesOf: rolesOf(container),
    pendingOf: () =>
      container.has(studioInboxToken)
        ? (userId: string) =>
            container.resolve(studioInboxToken).pending(userId)
        : undefined,
    inboxPort: () =>
      container.has(studioInboxPortToken)
        ? container.resolve(studioInboxPortToken)
        : undefined,
    // The knowledge base's actions (`nb-studio kb`), from Studio's roles.
    ...(container.has(knowledgeToken) && container.has(studioAccessToken)
      ? {
          actionSources: [
            knowledgeActionsOf(async (userId) =>
              levelsFrom(
                await container
                  .resolve(studioAccessToken)
                  .permissionsOfUser(userId),
              ),
            ),
          ],
        }
      : {}),
    ...(container.has(studioDelegationsToken)
      ? { delegations: container.resolve(studioDelegationsToken) }
      : {}),
    ...(options.queuedExpiryHours === undefined
      ? {}
      : { queuedExpiryMs: options.queuedExpiryHours * 3_600_000 }),
    ...(container.has(releasesToken)
      ? {
          releases: {
            permissionsOfUser: (userId: string) =>
              container.has(releasesAccessToken)
                ? container
                    .resolve(releasesAccessToken)
                    .permissionsOfUser(userId)
                : Promise.resolve(noPermissions()),
          },
        }
      : {}),
  });
}

/** `studio.agents.queuedExpiryHours` as a number, from YAML or an environment string; nothing when unset or invalid. */
function queuedExpiryOf(value: unknown): { queuedExpiryHours?: number } {
  const hours = typeof value === 'string' ? Number(value) : value;
  return typeof hours === 'number' && Number.isFinite(hours) && hours >= 0
    ? { queuedExpiryHours: hours }
    : {};
}

/** Binds the join at boot and releases it at shutdown. */
export default class StudioAgentsProvider extends ServiceProvider<Application> {
  public readonly name: string = 'studio/agents';
  private release: (() => void) | undefined;

  public override register(): void {
    const { container } = this.app;
    // The work conversations delegate, for the join (`bind.ts`) and the routes (`routes.ts`).
    container.singleton(studioDelegationsToken, (resolver) =>
      createDelegations({
        agents: resolver.resolve(agentsToken),
        projects: () => resolver.resolve(projectsToken),
        pullRequests: () =>
          resolver.has(studioGitToken)
            ? gitPullRequests(() => resolver.resolve(studioGitToken).events())
            : undefined,
        onError: (error) =>
          console.error('Agents could not report delegated work.', error),
      }),
    );
    container.singleton(studioReportsToken, (resolver) => {
      const access = () =>
        resolver.has(projectsAccessToken)
          ? resolver.resolve(projectsAccessToken)
          : undefined;
      const permissions = createPermissionSource(access);
      return createStudioReports({
        agents: resolver.resolve(agentsToken),
        projects: () =>
          resolver.has(projectsToken)
            ? resolver.resolve(projectsToken)
            : undefined,
        viewerOf: (userId) =>
          permissions.viewerOf({ kind: 'user', userId, displayName: userId }),
        ...(resolver.has(databaseManagerToken)
          ? {
              connection: () =>
                resolver.resolve(databaseManagerToken).connection(),
            }
          : {}),
      });
    });
  }

  public override boot(): Promise<void> {
    if (this.release) return Promise.resolve();
    const { container } = this.app;
    if (!container.has(agentsToken)) return Promise.resolve();
    const agents = container.resolve(agentsToken);
    const disconnect = connectProjects(container, agents, {
      basePath: this.app.publicBasePath,
      ...queuedExpiryOf(
        this.app.config.get<unknown>('studio.agents.queuedExpiryHours'),
      ),
    });
    const withdrawSkill = registerCliSkill(agents);
    this.release = () => {
      withdrawSkill();
      disconnect?.();
    };
    return Promise.resolve();
  }

  public override async shutdown(): Promise<void> {
    const bound = this.release;
    this.release?.();
    this.release = undefined;
    // What was heard before is reported before the database goes.
    if (bound && this.app.container.has(studioDelegationsToken))
      await this.app.container.resolve(studioDelegationsToken).settled();
  }
}
