/**
 * Studio's join of the agents plugin and the projects plugin; neither plugin knows the other. The agents plugin knows
 * no domain of its own, so Studio fills its extension points with projects and issues. Binding it:
 *
 * - registers `agent` as a kind of principal (`kind.ts`), whose work handler queues runs (`work.ts`);
 * - makes issues a subject of runs (`issue-subject.ts`): their context, brief and guidance at claim time, the names of
 *   their triggers and their preview, and what the reports say about them (`../reports/issue-facts.ts`);
 * - offers the catalog (`catalog/`): the business actions an agent may be given, the project lead and assistant presets, the
 *   `project` and `workdir` scopes, the conversation sources;
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
 *   blocked (`blocked.ts`);
 * - organises requirement intake with AI (`intake/`): a request is a run of the person's online agent on the private
 *   `intake` subject, which hands its drafts back with `intake drafts`, bound as the projects plugin's organiser;
 * - clears an archived or deleted agent as executor of the unfinished issues it was given (`removal.ts`);
 * - contributes the workflow status rules `runAgent` and `suggestExecutor` (whose suggestion is a decision card for
 *   the issue's owner) and tells owners what they skipped (`stage-rules.ts`), and the "Software development" workflow
 *   template that uses them (`catalog/workflow-templates.ts`), with its design-first proposals (`design.ts`).
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
  StatusRuleTypes,
  WorkflowTemplates,
} from '@nocobase/app-plugin-projects/server/tokens';
import {
  noAbilities,
  noSettings,
} from '@nocobase/app-plugin-projects/shared/access';

import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';

import { issueReports } from '../reports/issue-facts.js';
import { reportActionsOf } from '../reports/text.js';
import type { Catalog } from '../access/catalog.js';
import { agentActionOptions } from './capabilities.js';
import { PRESETS } from './catalog/presets.js';
import { studioScopes } from './catalog/scopes.js';
import { CONVERSATION_SOURCES } from './catalog/sources.js';
import {
  AI_REVIEW_TEMPLATE,
  SOFTWARE_TEMPLATE,
} from './catalog/workflow-templates.js';
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
import { createDesignService } from './design.js';
import type { Delegations } from './conversation/delegation.js';
import { createPlanHooks } from './conversation/plan-hooks.js';
import { createDirectWrites } from './conversation/quota.js';
import { consultationRules, conversationRules } from './conversation/rules.js';
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
import {
  createStageRules,
  proposeSuggestions,
  settleSuggestions,
  stageNoticeRule,
} from './stage-rules.js';
import { relayAnnouncements } from './tx.js';
import { inactiveUsers } from './users.js';
import { createAgentWork, startHandedOverStages } from './work.js';

export interface StudioAgentsDeps {
  readonly agents: Agents;
  readonly kinds: KindRegistry;
  readonly projects: () => Projects;
  readonly noticeRules?: NoticeRules;
  /** Where the stage rules go; without it workflows cannot name them. */
  readonly statusRules?: StatusRuleTypes;
  /** Where the "Software development" template goes; without it the template is not installed. */
  readonly templates?: WorkflowTemplates;
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
  const work = createAgentWork({ agents, projects: deps.projects });
  const askerOf = createAskerLookup(agents);
  const permissions = createPermissionSource(deps.access, askerOf);
  const viewerOf = (userId: string) =>
    permissions.viewerOf({ kind: 'user', userId, displayName: userId });
  const direct = createDirectWrites({ agents, projects: deps.projects });
  const design = createDesignService({
    projects: deps.projects,
    inbox: deps.inboxPort ?? (() => undefined),
  });
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
    deps.kinds.add(createAgentKind({ agents, work })),
    agents.subjects.register({
      ...issueBinding(
        agents,
        deps.projects,
        // A run told its issue moved to another project is followed by a run there.
        { onRunFinished: work.onRunFinished },
        deps.queuedExpiryMs ?? DEFAULT_QUEUED_EXPIRY_HOURS * 3_600_000,
      ),
      reports: issueReports(deps.projects, viewerOf),
      // Runners remove the working directories of finished issues (`issue-workspaces.ts`).
      workspaces: issueWorkspaces(deps.projects),
    }),
    agents.subjects.register(intakeBinding(deps.projects)),
    watchIntakeRuns(agents, deps.projects, (error) =>
      onError('Agents could not end an intake request.', error),
    ),
    agents.actions.provide(() => {
      const catalog = deps.catalog?.();
      return catalog ? agentActionOptions(catalog) : [];
    }),
    ...PRESETS.map((preset) => agents.presets.register(preset)),
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
    agents.consultations.rules.provide(consultationRules()),
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
    releaseRemovedAgents(agents, deps.projects, (error) =>
      onError('Agents could not clear a removed agent as executor.', error),
    ),
    // The owner's card of a design proposal, while the issue waits in Proposal review.
    design.bindCards((error) =>
      onError('Agents could not update a design review card.', error),
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
      deps.noticeRules.add(stageNoticeRule()),
    );
  // The rule types before the template, which names them and is validated when it is installed.
  if (deps.statusRules) {
    for (const type of createStageRules({ agents, projects: deps.projects }))
      releases.push(deps.statusRules.add(type));
    releases.push(
      // Creating an issue enters its status by no move, so no status rule runs, and a release without an agent executor
      // reaches no kind: the stage a status hands to an agent starts here.
      startHandedOverStages(deps.projects(), work, (error) =>
        onError('Agents could not start the stage of an issue.', error),
      ),
      proposeSuggestions(deps.projects(), (error) =>
        onError('Agents could not propose a suggested executor.', error),
      ),
      settleSuggestions(
        deps.projects(),
        deps.inboxPort ?? (() => undefined),
        (error) =>
          onError('Agents could not settle a suggested executor.', error),
      ),
    );
    if (deps.templates) {
      releases.push(deps.templates.add(AI_REVIEW_TEMPLATE));
      releases.push(deps.templates.add(SOFTWARE_TEMPLATE));
    }
  }
  return () => {
    for (const release of releases.splice(0).reverse()) release();
  };
}
