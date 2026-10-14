/**
 * Studio's join of the agents plugin and the projects plugin; neither plugin knows the other. The agents plugin knows
 * no domain of its own, so Studio fills its extension points with projects and issues. Binding it:
 *
 * - registers `agent` as a kind of principal (`kind.ts`), whose work handler queues runs (`work.ts`);
 * - makes issues a subject of runs (`issue-subject.ts`): their context, brief and guidance at claim time, the names of
 *   their triggers and their preview, and what the reports say about them (`../reports/issue-facts.ts`);
 * - keeps the project manager (`manager/`), every issue's executor, which hands each step to an agent discovered from
 *   runners: its agent, the instructions and actions every agent gets, and the roster of agents each of its turns
 *   lists (`manager/roster.ts`);
 * - offers the catalog (`catalog/`): the business actions an agent may be given, the `project` and `workdir` scopes, the
 *   conversation sources;
 * - decides who may run the CLI's commands (`commands/permissions.ts`), the gate that also bounds a run calling Studio's
 *   API (`run-principal.ts`), with the report actions (`../reports/text.ts`) and the release actions each identity
 *   holds when Studio assembles release management (`../releases/caller.ts`);
 * - makes a conversation's run act for the person who asked (`conversation/acting.ts`), within the direct-write quota
 *   (`conversation/quota.ts`) when it writes through the API (`run-principal.ts`), and tells its agent the rules of
 *   that (`conversation/rules.ts`) and who is asking (`conversation/asker.ts`);
 * - hears operation plans being decided, to count direct writes and wake the agent that proposed
 *   (`conversation/plan-hooks.ts`), and follows the issues a conversation's plan handed to agents, reporting their
 *   milestones back to it (`conversation/delegation.ts`);
 * - resolves issues, projects and inbox items in a page context (`conversation/context-kinds.ts`);
 * - relays the agents plugin's events announced in projects transactions, and asks people what next when a run on an
 *   issue fails for good (`notices.ts`, a card that folds away once the issue moves on) or when an agent reports itself
 *   blocked (`blocked.ts`), or when agents' comments reached the issue's run limit (`comment-run-limit.ts`), and has
 *   each run an agent's comment started answer in that comment's thread (`run-report.ts`);
 * - organises requirement intake with AI (`intake/`): a request is a run of an agent the person picks (the team's
 *   default chat agent unless they pick another) on the private `intake` subject, which hands its drafts back with
 *   `intake drafts`, bound as the projects plugin's organiser;
 * - clears a disabled agent as executor of the unfinished issues it was given (`removal.ts`).
 *
 * The projects plugin's services are resolved lazily, so binding may happen before they are first used.
 */
import type {
  IntakeOrganizer,
  KindRegistry,
  NoticeRules,
  PlanHooks,
  Projects,
  ProjectsAccess,
} from '@nocobase/app-plugin-projects/server/tokens';
import {
  noAbilities,
  noSettings,
  businessKey,
} from '@nocobase/app-plugin-projects/shared/access';

import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';

import { issueReports } from '../reports/issue-facts.js';
import { reportActionsOf } from '../reports/text.js';
import type { Catalog } from '../access/catalog.js';
import { agentActionOptions } from './capabilities.js';
import { studioScopes } from './catalog/scopes.js';
import { CONVERSATION_SOURCES } from './catalog/sources.js';
import {
  createActionGate,
  createPermissionSource,
  NO_READER_GRANTS,
  type ActionSource,
  type ReaderGrantsOf,
} from './commands/permissions.js';
import { createAskerLookup } from './conversation/acting.js';
import { askerBriefSection, type RolesOf } from './conversation/asker.js';
import {
  PAGE_CONTEXT_KINDS,
  pageContextResolvers,
} from './conversation/context-kinds.js';
import type { StudioInboxPort } from '../inbox/port.js';
import type { InboxSource } from './conversation/inbox.js';
import type { Delegations } from './conversation/delegation.js';
import { createPlanHooks } from './conversation/plan-hooks.js';
import { createDirectWrites } from './conversation/quota.js';
import { conversationRules } from './conversation/rules.js';
import { createRunPrincipal, type RunPrincipal } from './run-principal.js';
import {
  releaseActionsOf,
  type ReleaseCallerDeps,
} from '../releases/caller.js';
import { createIntakeOrganizer, watchIntakeRuns } from './intake/organizer.js';
import { intakeBinding } from './intake/subject.js';
import { issueBinding } from './issue-subject.js';
import { issueWorkspaces } from './issue-workspaces.js';
import { createAgentKind } from './kind.js';
import { agentBlockedRule, settleBlockedCards } from './blocked.js';
import {
  announceFailedRuns,
  runFailedRule,
  settleFailedRunCards,
} from './notices.js';
import { releaseRemovedAgents } from './removal.js';
import { managerRoster } from './manager/roster.js';
import type { ProjectManager } from './manager/service.js';
import { relayAnnouncements, refreshRunIssues } from './tx.js';
import { inactiveUsers } from './users.js';
import { createAgentWork } from './work.js';
import { commentRunNoticeRule } from './comment-run-limit.js';
import { delegationTimeout } from './delegated-queue.js';
import { stageRunReport, reportCommentRuns } from './run-report.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import { bindCommentConsentInbox } from './comment-consent-inbox.js';
import {
  OWNER_HANDOFF_NOTICE,
  ownerHandoffNoticeRule,
  settleOwnerHandoffNotice,
  type HandoffAnnouncement,
} from '../issues/owner-handoff-notices.js';

export interface StudioAgentsDeps {
  readonly checkoutPullRequests?: (
    issueId: string,
  ) => Promise<ReadonlyMap<string, string>>;
  readonly agents: Agents;
  readonly kinds: KindRegistry;
  readonly projects: () => Projects;
  readonly noticeRules?: NoticeRules;
  /** The project manager, kept up to date when an agent it runs with changes; none without it. */
  readonly manager?: ProjectManager;
  /** The application's roles; without them no command with a business action is offered. */
  readonly access: () => Pick<ProjectsAccess, 'permissionsOfUser'> | undefined;
  /** What the plugins registered with the authorization plugin, which the agent editor offers from; none without. */
  readonly catalog?: () => Catalog | undefined;
  /**
   * Hands Studio's plan hooks to the projects plugin (`projectsPlanHooksToken`); returns what takes them back.
   * Without it plans are decided without waking anyone, and direct writes are not possible.
   */
  readonly bindPlanHooks?: (hooks: PlanHooks) => () => void;
  /**
   * Hands how a run acts in Studio's API (`run-principal.ts`) to the application: who acts for it, and its writes in a
   * conversation; returns what takes them back. Without it a run acts as the person over the API.
   */
  readonly bindRunPrincipal?: (principal: RunPrincipal) => () => void;
  /**
   * Hands Studio's organiser of intake with AI to the projects plugin (`projectsIntakeOrganizerToken`); returns what
   * takes it back. Without it the AI draft tab offers the rule split only.
   */
  readonly bindIntakeOrganizer?: (organizer: IntakeOrganizer) => () => void;
  /** Studio's inbox, for `inbox list` and inbox items in a page context; undefined without one. */
  readonly inbox?: () => InboxSource | undefined;
  /** Studio's inbox port, to settle the cards it sends (a suggested executor's); undefined without one. */
  readonly inboxPort?: () => StudioInboxPort | undefined;
  /** Release management, when assembled: the release actions each identity holds. */
  readonly releases?: ReleaseCallerDeps;
  /** More business actions identities hold for the command gate, such as Studio's knowledge base's. */
  readonly actionSources?: readonly ActionSource[];
  /** Who may read the reports and every run (Studio's roles); nobody beyond their own runs without it. */
  readonly grantsOf?: ReaderGrantsOf;
  /** The roles a person holds, for the conversation brief's summary of who is asking. */
  readonly rolesOf?: RolesOf;
  /** How many decisions wait on a person in Studio's inbox; undefined without one. */
  readonly pendingOf?: () => ((userId: string) => Promise<number>) | undefined;
  /**
   * How long an issue's run may wait for a runner before it fails as `queuedExpired` and its owner is asked what next
   * (`notices.ts`); 0 waits forever. `DEFAULT_QUEUED_EXPIRY_HOURS` when left out.
   */
  readonly queuedExpiryMs?: number;
  /** Follows the work conversations hand to agents (`conversation/delegation.ts`); nothing is followed without. */
  readonly delegations?: Delegations;
  readonly onError?: (message: string, error: unknown) => void;
}

/** How long an issue's run waits for a runner by default (`studio.agents.queuedExpiryHours`). */
export const DEFAULT_QUEUED_EXPIRY_HOURS = 24;

/** Connects agents to issues; returns what disconnects them. */
export function bindStudioAgents(deps: StudioAgentsDeps): () => void {
  const { agents } = deps;
  const onError =
    deps.onError ?? ((message, error) => console.error(message, error));
  const askerOf = createAskerLookup(agents);
  const permissions = createPermissionSource(deps.access, askerOf);
  const viewerOf = (userId: string) =>
    permissions.viewerOf({ kind: 'user', userId, displayName: userId });
  const work = createAgentWork({ agents, projects: deps.projects, viewerOf });
  const direct = createDirectWrites({ agents, projects: deps.projects });
  const principal = createRunPrincipal({
    askerOf,
    direct,
    enabled: Boolean(deps.bindPlanHooks),
  });
  const inbox = deps.inbox ?? (() => undefined);
  const grantsOf = deps.grantsOf ?? NO_READER_GRANTS;
  const releaseManagement = deps.releases;
  const resolvers = pageContextResolvers({
    projects: deps.projects,
    permissions,
    inbox,
  });
  const releases: (() => void)[] = [
    bindCommentConsentInbox(
      agents,
      deps.projects,
      deps.inboxPort ?? (() => undefined),
      (error) =>
        onError('Studio could not update a personal runner request.', error),
    ),
    deps.projects().events.on('work.announced', async (event) => {
      const port = deps.inboxPort?.();
      if (port && event.kind === OWNER_HANDOFF_NOTICE)
        await settleOwnerHandoffNotice(
          port,
          event.payload as HandoffAnnouncement,
        );
    }),
    deps.kinds.add(createAgentKind({ agents, work })),
    agents.subjects.register({
      ...issueBinding(
        agents,
        deps.projects,
        // A run told its issue moved to another project is followed by a run there.
        {
          onRunFinished: async (tx, run) => {
            await stageRunReport(tx.conn, run);
            await work.onRunFinished(tx, run);
          },
        },
        deps.queuedExpiryMs ?? DEFAULT_QUEUED_EXPIRY_HOURS * 3_600_000,
        deps.checkoutPullRequests,
        async (issueId, userId) => {
          try {
            await deps
              .projects()
              .issueQueries.detail(await viewerOf(userId), issueId);
            return true;
          } catch {
            return false;
          }
        },
      ),
      queuedTimeout: delegationTimeout(agents),
      reports: issueReports(deps.projects, viewerOf),
      // Runners remove the working directories of finished issues (`issue-workspaces.ts`).
      workspaces: issueWorkspaces(),
    }),
    agents.subjects.register(intakeBinding(deps.projects)),
    watchIntakeRuns(agents, deps.projects, (error) =>
      onError('Agents could not end an intake request.', error),
    ),
    agents.actions.provide(() => {
      const catalog = deps.catalog?.();
      return catalog ? agentActionOptions(catalog) : [];
    }),
    ...studioScopes({ projects: deps.projects, permissions }).map((kind) =>
      agents.scopes.register(kind),
    ),
    agents.gate.set(
      createActionGate(permissions, [
        ...(releaseManagement
          ? [
              (identity: Parameters<ActionSource>[0]) =>
                releaseActionsOf(releaseManagement, identity),
            ]
          : []),
        reportActionsOf(grantsOf),
        ...(deps.actionSources ?? []),
      ]),
    ),
    ...CONVERSATION_SOURCES.map((source) =>
      agents.conversations.sources.register(source),
    ),
    agents.conversations.rules.provide(conversationRules()),
    // Each of the project manager's turns lists the agents it may hand work to.
    agents.briefs.sections.register(managerRoster(agents)),
    agents.briefs.sections.register(
      askerBriefSection({
        agents,
        projects: deps.projects,
        permissions,
        ...(deps.rolesOf ? { rolesOf: deps.rolesOf } : {}),
        ...(deps.pendingOf ? { pendingOf: deps.pendingOf } : {}),
      }),
    ),
    ...PAGE_CONTEXT_KINDS.map((kind) =>
      agents.conversations.contextKinds.register(kind, resolvers[kind]),
    ),
    relayAnnouncements(deps.projects(), agents.events),
    refreshRunIssues(deps.projects(), agents, (error) =>
      onError('Agents could not refresh issue progress.', error),
    ),
    // People: names from the user kind, the members to pick from, and who can no longer act (a runner they own stops).
    agents.people.provide({
      names: (conn, ids) => deps.kinds.names(conn, 'user', ids),
      inactive: inactiveUsers,
      list: async () =>
        (
          await deps.projects().members.list({
            userId: 'agents',
            actor: { type: 'system', id: null },
            permissions: { scopes: noAbilities(), settings: noSettings() },
          })
        ).map((member) => ({ id: member.userId, name: member.name })),
    }),
    announceFailedRuns(agents, deps.projects, (error) =>
      onError('Agents could not announce a failed run.', error),
    ),
    // A run an agent's comment started always answers in that comment's thread.
    reportCommentRuns(
      agents,
      deps.projects,
      (error) =>
        onError(
          'Agents could not report a run an agent comment started.',
          error,
        ),
      async (_conn, run) => {
        const viewer = await viewerOf(run.actorUserId);
        if (
          viewer.permissions.scopes[businessKey('pm.issues', 'comment')] ===
          'none'
        )
          throw new Error(
            'The acting user may no longer comment on this issue.',
          );
        await deps.projects().issueQueries.detail(viewer, run.subject.id);
      },
    ),
    releaseRemovedAgents(agents, deps.projects, (error) =>
      onError('Agents could not clear a removed agent as executor.', error),
    ),
    settleFailedRunCards(
      deps.projects,
      deps.inboxPort ?? (() => undefined),
      (error) => onError('Agents could not settle a failed run card.', error),
    ),
    settleBlockedCards(
      deps.projects(),
      deps.inboxPort ?? (() => undefined),
      (error) => onError('Agents could not settle a blocked card.', error),
    ),
  ];
  if (deps.bindPlanHooks)
    releases.push(
      deps.bindPlanHooks(
        createPlanHooks({
          agents,
          direct,
          ...(deps.delegations ? { delegations: deps.delegations } : {}),
          onError: (error) =>
            onError('Agents could not report a decided plan.', error),
        }),
      ),
    );
  if (deps.delegations) releases.push(deps.delegations.listen());
  if (deps.bindRunPrincipal) releases.push(deps.bindRunPrincipal(principal));
  if (deps.bindIntakeOrganizer)
    releases.push(deps.bindIntakeOrganizer(createIntakeOrganizer(agents)));
  if (deps.noticeRules)
    releases.push(
      deps.noticeRules.add(runFailedRule(agents, deps.projects)),
      deps.noticeRules.add(agentBlockedRule(deps.projects, agents)),
      deps.noticeRules.add(commentRunNoticeRule()),
      deps.noticeRules.add(ownerHandoffNoticeRule()),
    );
  // The project manager runs with the tool and model of the agents it names: one of them changing changes it.
  const manager = deps.manager;
  if (manager)
    releases.push(
      agents.events.on('agent.changed', (event) => {
        if (event.agentId === PROJECT_MANAGER_ID) return;
        manager
          .sync()
          .catch((error: unknown) =>
            onError('Agents could not update the project manager.', error),
          );
      }),
    );
  return () => {
    for (const release of releases.splice(0).reverse()) release();
  };
}
