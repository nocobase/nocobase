/**
 * What entering a status does for agents: two status rule types Studio contributes to the projects plugin's
 * workflows (`projectsStatusRulesToken`).
 *
 * | type              | on entering the status                                                                          |
 * | ----------------- | ----------------------------------------------------------------------------------------------- |
 * | `runAgent`        | the agent is `agentId`, or else the issue's agent executor; it becomes the executor (unless      |
 * |                   | `assign` is false: a reviewer, say) and a run starts with the rendered `instruction` as the      |
 * |                   | workflow stage instruction of its task                                                          |
 * | `suggestExecutor` | the issue's owner gets a suggestion card in their inbox ("‹Agent› is suggested for PM-12"):     |
 * |                   | Accept makes `agentId` the executor and starts its work, Dismiss drops it                       |
 *
 * `runAgent` acts for whoever caused the move (`sourceActor`: a workflow event moves the issue as the system, for the
 * person or run that fired it), as any wake does (`work-source.ts`): the owner's own move, or one of a run whose chain
 * the owner started or confirmed, runs as the owner; anyone else's asks the owner to confirm it (a run request), and
 * the system's acts for the owner. When the person who caused it may not wake the agent, the owner gets a suggestion
 * instead. The loop guard defaults to `STAGE_RUN_LIMIT` actual runs
 * per issue and status within `STAGE_RUN_WINDOW_HOURS` hours, configurable on each rule. It guards against agents and
 * the system moving an issue in a loop, so it never stops a person: a person's move (a user actor not acting through an
 * agent) starts the run, is not counted, and restarts the count. Environment failures and cancelled or unstarted runs
 * do not count either. After suppression a person who may edit the issue may continue once and reset the count.
 *
 * An issue that waits for unfinished issues starts no stage run (`blocked`, with the issues it waits for): its agent is
 * woken with the stage's instruction once nothing holds it (`work.ts`). The run's claim order follows the issue's
 * priority.
 *
 * A skip is recorded on the issue by the projects plugin (`stage_action_skipped` with its reason). Those that need the
 * owner's attention are told to them through a notice rule (`stageNoticeRule`); the expected ones are not: the agent
 * moved the issue itself (`selfTriggered`), the suggested agent executes the issue already (`alreadyExecutor`).
 *
 * A suggestion is accepted in one click. The change behind the card
 * is a one-row operation plan (source `statusRule`, `proposeSuggestions`), so accepting is checked like any change and
 * is applied as the owner; the card executes or voids it, and nothing lists it as a plan. Its decision settles once
 * the plan is no longer open, whoever or whatever closed it (`settleSuggestions`).
 */
import { randomUUID } from 'node:crypto';
import type {
  Actor,
  NoticeRule,
  Projects,
  ProjectsTx,
  StatusRuleEntry,
  StatusRuleOutcome,
  StatusRuleType,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { PLAN_DESCRIPTION_MAX } from '@nocobase/app-plugin-projects/shared/plans';
import type { DatabaseConnection } from '@nocobase/db';

import type { StudioInboxPort } from '../inbox/port.js';
import { PROJECTS_SOURCE } from '../inbox/projects.js';
import { systemViewer } from '../previews/sources.js';

import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type { I18nText } from '@nocobase/app-plugin-agents/shared/i18n';
import { agentNameParams } from './agent-name.js';
import { ISSUE_SUBJECT } from './catalog/triggers.js';
import { AGENT_KIND, agentsTx } from './tx.js';
import { runPriorityOf, userName } from './work.js';
import {
  recentStageRunCount,
  stageGuardId,
  stageGuards,
} from './stage-run-guard.js';
import { workSourceOf } from './work-source.js';

const SYSTEM_ACTOR: Actor = { type: 'system', id: null };

export const RUN_AGENT = 'runAgent';
export const SUGGEST_EXECUTOR = 'suggestExecutor';

/** The trigger of a run a status started, in its input's payload. */
export const STAGE_TRIGGER = 'stageEntered';

/** The loop guard: stage runs per issue and status within the window. */
export const STAGE_RUN_LIMIT = 3;
export const STAGE_RUN_WINDOW_HOURS = 24;

export const INSTRUCTION_MAX = 4000;
export const SUGGEST_REASON_MAX = 500;

/** The placeholders an instruction may use: `{{issue.identifier}}`, with optional spaces inside the braces. */
export const STAGE_INSTRUCTION_VARIABLES = [
  'issue.identifier',
  'issue.title',
  'from',
  'to',
  'owner.name',
] as const;

const PLACEHOLDER = /\{\{\s*([^{}]*?)\s*\}\}/gu;

/** The instruction with its placeholders filled; an unknown one stays as written. */
export function renderInstruction(
  template: string,
  values: Readonly<Record<string, string>>,
): string {
  return template
    .replace(PLACEHOLDER, (match, name: string) =>
      Object.hasOwn(values, name) ? (values[name] ?? '') : match,
    )
    .trim();
}

/**
 * The stage of the status an issue is in now, for `agentId` (its agent executor, or `''` for none): the `runAgent` rule
 * of that status in the issue's workflow that names the agent or no agent, which is the executor's own stage; else a
 * rule that hands the status to another agent without making it the executor (`assign: false`: a solution designer
 * in Analysis, say), which is that agent's stage, and the executor waits for a status of its own. The executor's own
 * rule is chosen first, whether or not it carries an instruction, so another agent's rule never takes its place. The
 * instruction is rendered, or null when the rule has none; null when the status runs no agent. An issue created in a
 * status, or given to an agent there, never entered it by a move, so this is how its stage starts.
 */
export async function currentStage(
  projects: Pick<Projects, 'workflows'>,
  conn: DatabaseConnection,
  issue: Issue,
  agentId: string,
): Promise<{
  readonly agentId: string;
  readonly instruction: string | null;
} | null> {
  const catalog = await projects.workflows.catalogs.forProject(
    conn,
    issue.projectId,
  );
  const rules = (
    catalog.machine.states.find((state) => state.key === issue.statusKey)
      ?.rules ?? []
  ).filter((item) => item.type === RUN_AGENT);
  const own = rules.find(
    (item) =>
      !textOf(item.config?.agentId) ||
      (agentId !== '' && item.config?.agentId === agentId),
  );
  const rule =
    own ??
    rules.find(
      (item) => textOf(item.config?.agentId) && item.config?.assign === false,
    );
  if (!rule) return null;
  const template = textOf(rule.config?.instruction);
  return {
    agentId: textOf(rule.config?.agentId) ?? agentId,
    instruction: template
      ? renderInstruction(template, {
          'issue.identifier': issue.identifier,
          'issue.title': issue.title,
          from: issue.statusKey,
          to: issue.statusKey,
          'owner.name': await userName(conn, issue.ownerUserId),
        })
      : null,
  };
}

/** The announcement a skip makes in the move's transaction, for `stageNoticeRule`. */
export const STAGE_NOTICE_KIND = 'agent.stage';

/** The notice types. */
export const STAGE_ACTION_PROBLEM = 'stage_action_problem';
export const EXECUTOR_SUGGESTED = 'executor_suggested';

interface StageNotice {
  readonly notice: typeof STAGE_ACTION_PROBLEM | typeof EXECUTOR_SUGGESTED;
  readonly issue: Pick<Issue, 'id' | 'identifier' | 'title' | 'ownerUserId'>;
  readonly rule: string;
  readonly statusKey: string;
  readonly statusName: string;
  readonly reason?: string;
  readonly agentId?: string;
  readonly agentName?: string;
  /** A built-in agent's name as an i18n reference. */
  readonly agentNameText?: I18nText | null;
  readonly suggestReason?: string;
  /** A suggestion's operation plan, once proposed (`proposeSuggestions`): the owner is notified of it. */
  readonly planId?: string;
  /** Tells notices of separate entries apart. */
  readonly at: string;
  readonly limit?: number;
  readonly windowHours?: number;
  readonly continueToken?: string;
}

/** Why a skip happened, in words for the owner. */
const REASONS: Readonly<Record<string, string>> = {
  ownerCannotInvoke: 'the owner may not give work to the agent',
  noAgentExecutor: 'no executor is assigned: assign one and it starts at once',
  agentUnavailable: 'the agent is archived or deleted',
  cannotInvoke: 'the person who moved the issue may not wake the agent',
};

/** Skips the owner does not need to hear about (a blocked issue starts once it is released). */
const QUIET_SKIPS: ReadonlySet<string> = new Set([
  'selfTriggered',
  'alreadyExecutor',
  'blocked',
]);

type Config = Readonly<Record<string, unknown>>;

const textOf = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

function unknownFields(config: Config, allowed: readonly string[]) {
  return Object.keys(config)
    .filter((field) => !allowed.includes(field))
    .map((field) => ({ path: field, message: 'Unknown field.' }));
}

function agentIdIssues(value: unknown, required: boolean) {
  if (value === undefined || value === null || value === '')
    return required ? [{ path: 'agentId', message: 'Choose an agent.' }] : [];
  return typeof value === 'string' && value.length <= 64
    ? []
    : [{ path: 'agentId', message: 'agentId names an agent.' }];
}

function instructionIssues(value: unknown) {
  if (value === undefined) return [];
  if (typeof value !== 'string' || value.length > INSTRUCTION_MAX)
    return [
      {
        path: 'instruction',
        message: `An instruction is at most ${INSTRUCTION_MAX} characters.`,
      },
    ];
  const unknown = [...value.matchAll(PLACEHOLDER)]
    .map((match) => match[1] ?? '')
    .filter(
      (name) =>
        !(STAGE_INSTRUCTION_VARIABLES as readonly string[]).includes(name),
    );
  return unknown.length === 0
    ? []
    : [
        {
          path: 'instruction',
          message: `Unknown placeholders: ${[...new Set(unknown)].join(', ')}. Use ${STAGE_INSTRUCTION_VARIABLES.map((name) => `{{${name}}}`).join(', ')}.`,
        },
      ];
}

/** A person moved the issue by hand, not an agent, the system, or an agent acting for the person. */
function movedByPerson(actor: Actor): boolean {
  return actor.type === 'user' && actor.via !== 'agent';
}

function positiveIntegerIssues(config: Config, field: string) {
  const value = config[field];
  return value === undefined ||
    (typeof value === 'number' && Number.isSafeInteger(value) && value > 0)
    ? []
    : [
        {
          path: field,
          message: `${field} is a positive safe integer.`,
        },
      ];
}

/** Where a rule of the agents may sit: never where an issue is finished. */
const OPEN_CATEGORIES = ['unstarted', 'started'] as const;

export function createStageRules(deps: {
  readonly agents: Pick<Agents, 'runs' | 'agents'>;
  readonly projects: () => Pick<Projects, 'subtasks'>;
  /** A manually resumed entry, recorded in its input so the owner's decision remains traceable. */
  readonly continuedFrom?: string;
}): readonly StatusRuleType[] {
  const { runs } = deps.agents;
  const skip = (
    reason: string,
    details?: Readonly<Record<string, unknown>>,
  ): StatusRuleOutcome => ({
    status: 'skipped',
    reason,
    ...(details ? { details } : {}),
  });

  /** Tells the owner, once the move commits, unless the skip is an expected one. */
  function report(
    entry: StatusRuleEntry,
    rule: string,
    outcome: StatusRuleOutcome,
    extra: Partial<StageNotice> = {},
  ): StatusRuleOutcome {
    if (outcome?.status !== 'skipped' || QUIET_SKIPS.has(outcome.reason))
      return outcome;
    announce(entry.tx, {
      notice: STAGE_ACTION_PROBLEM,
      issue: entry.issue,
      rule,
      statusKey: entry.status.key,
      statusName: entry.status.name,
      reason: outcome.reason,
      at: new Date().toISOString(),
      ...extra,
    });
    return outcome;
  }

  function announce(tx: ProjectsTx, notice: StageNotice): void {
    tx.emit({
      type: 'work.announced',
      kind: STAGE_NOTICE_KIND,
      payload: notice,
    });
  }

  /**
   * The suggestion: once the move commits, the owner gets an operation plan that makes the agent the executor
   * (`proposeSuggestions`); they decide whether it executes the issue.
   */
  async function suggest(
    entry: StatusRuleEntry,
    agentId: string,
    reason: string | null,
  ): Promise<StatusRuleOutcome> {
    const agent = await deps.agents.agents.findWorkable(entry.tx.conn, agentId);
    if (!agent) return skip('agentUnavailable', { agentId });
    const { issue } = entry;
    if (issue.executor?.type === AGENT_KIND && issue.executor.id === agentId)
      return skip('alreadyExecutor', { agentId });
    if (!deps.agents.agents.mayInvoke(agent, issue.ownerUserId))
      return skip('ownerCannotInvoke', {
        agentId,
        userId: issue.ownerUserId,
      });
    announce(entry.tx, {
      notice: EXECUTOR_SUGGESTED,
      issue,
      rule: SUGGEST_EXECUTOR,
      statusKey: entry.status.key,
      statusName: entry.status.name,
      agentId,
      agentName: agent.name,
      agentNameText: agent.nameText,
      ...(reason ? { suggestReason: reason } : {}),
      at: new Date().toISOString(),
    });
    return { status: 'applied', details: { agentId } };
  }

  const runAgent: StatusRuleType = {
    type: RUN_AGENT,
    categories: OPEN_CATEGORIES,
    validate: (config) => [
      ...unknownFields(config, [
        'agentId',
        'instruction',
        'assign',
        'maxRuns',
        'windowHours',
      ]),
      ...agentIdIssues(config.agentId, false),
      ...instructionIssues(config.instruction),
      ...positiveIntegerIssues(config, 'maxRuns'),
      ...positiveIntegerIssues(config, 'windowHours'),
      ...(config.assign === undefined || typeof config.assign === 'boolean'
        ? []
        : [{ path: 'assign', message: 'assign is true or false.' }]),
    ],
    describe(config) {
      const instruction = textOf(config.instruction);
      const agentId = textOf(config.agentId);
      let summary = 'Creates a run for the current agent executor';
      if (agentId)
        summary =
          config.assign === false
            ? `Creates a run for agent ${agentId}, without making it the executor`
            : `Sets agent ${agentId} as the executor (without the owner's confirmation) and creates a run`;
      return {
        summary: `${summary}${instruction ? ', with a stage instruction' : ''}. At most ${Number(config.maxRuns ?? STAGE_RUN_LIMIT)} runs per ${Number(config.windowHours ?? STAGE_RUN_WINDOW_HOURS)} hours from agent or system moves; a person's move always runs.`,
        attention: true,
      };
    },
    async entered(entry, config) {
      const { tx, status } = entry;
      // Who caused the move: a workflow event moves as the system, for the person or run that fired it.
      const actor = entry.sourceActor ?? entry.actor;
      let { issue } = entry;
      const guardId = stageGuardId(issue.id, status.key);
      // Every new entry replaces the previous entry's continuation, even when this entry skips for another reason.
      await stageGuards(tx.conn).updateMany({
        filter: { id: guardId },
        values: { pendingToken: null },
      });
      const preset = textOf(config.agentId);
      const agentId =
        preset ??
        (issue.executor?.type === AGENT_KIND ? issue.executor.id : null);
      if (!agentId) return report(entry, RUN_AGENT, skip('noAgentExecutor'));
      const agent = await deps.agents.agents.findWorkable(tx.conn, agentId);
      if (!agent)
        return report(entry, RUN_AGENT, skip('agentUnavailable', { agentId }), {
          agentId,
        });
      if (actor.type === AGENT_KIND && actor.id === agentId)
        return skip('selfTriggered', { agentId });
      const limit = Number(config.maxRuns ?? STAGE_RUN_LIMIT);
      const windowHours = Number(config.windowHours ?? STAGE_RUN_WINDOW_HOURS);
      const byPerson = movedByPerson(actor);
      if (byPerson)
        // A person's move restarts the count, so the agent entries after it get a fresh window.
        await stageGuards(tx.conn).upsertOne({
          filter: { id: guardId },
          create: {
            id: guardId,
            issueId: issue.id,
            statusKey: status.key,
            resetAt: new Date().toISOString(),
            pendingToken: null,
            agentId: null,
            fromStatus: null,
            ruleConfig: null,
          },
          update: { resetAt: new Date().toISOString(), pendingToken: null },
        });
      else if (
        (await recentStageRunCount(
          tx.conn,
          issue.id,
          status.key,
          windowHours,
        )) >= limit
      ) {
        const continueToken = randomUUID();
        await stageGuards(tx.conn).upsertOne({
          filter: { id: guardId },
          create: {
            id: guardId,
            issueId: issue.id,
            statusKey: status.key,
            resetAt: null,
            pendingToken: continueToken,
            agentId,
            fromStatus: entry.from,
            ruleConfig: config,
          },
          update: {
            pendingToken: continueToken,
            agentId,
            fromStatus: entry.from,
            ruleConfig: config,
          },
        });
        return report(
          entry,
          RUN_AGENT,
          skip('suppressed', {
            agentId,
            limit,
            windowHours,
            continueToken,
          }),
          { agentId, agentName: agent.name, limit, windowHours, continueToken },
        );
      }
      // The work comes from whoever caused the move (a run's move: its chain's source; the system's: the owner), and
      // the owner answers for it: anyone else's asks the owner to confirm it (`work-source.ts`).
      const source = await workSourceOf(tx.conn, actor, issue);
      const moverId = source.userId;
      const isExecutor =
        issue.executor?.type === AGENT_KIND && issue.executor.id === agentId;
      const assign = config.assign !== false;
      if (
        moverId !== issue.ownerUserId &&
        !deps.agents.agents.mayInvoke(agent, issue.ownerUserId)
      )
        return report(
          entry,
          RUN_AGENT,
          skip('ownerCannotInvoke', { agentId, userId: issue.ownerUserId }),
          { agentId, agentName: agent.name },
        );
      if (!deps.agents.agents.mayInvoke(agent, moverId)) {
        if (isExecutor || !assign)
          return report(
            entry,
            RUN_AGENT,
            skip('cannotInvoke', { agentId, userId: moverId }),
            { agentId, agentName: agent.name },
          );
        // As before: the owner decides instead.
        const suggested = await suggest(entry, agentId, null);
        return report(
          entry,
          RUN_AGENT,
          skip('cannotInvoke', {
            agentId,
            userId: moverId,
            downgradedTo: SUGGEST_EXECUTOR,
            suggested: suggested?.status === 'applied',
          }),
          { agentId, agentName: agent.name },
        );
      }
      if (!isExecutor && assign)
        issue = await entry.setExecutor({ type: AGENT_KIND, id: agentId });
      const blockers = await deps
        .projects()
        .subtasks.blockersOf(tx.conn, issue);
      if (blockers.length > 0)
        return report(
          entry,
          RUN_AGENT,
          skip('blocked', {
            agentId,
            blockers: blockers.map((blocker) => ({
              issueId: blocker.issueId,
              identifier: blocker.identifier,
            })),
          }),
        );
      const ownerName = await userName(tx.conn, issue.ownerUserId);
      const template = textOf(config.instruction);
      const instruction = template
        ? renderInstruction(template, {
            'issue.identifier': issue.identifier,
            'issue.title': issue.title,
            from: entry.from,
            to: status.key,
            'owner.name': ownerName,
          })
        : null;
      const result = await runs.enqueue(
        {
          agentId,
          subject: { kind: ISSUE_SUBJECT, id: issue.id },
          actorUserId: moverId,
          responsibleUserId: issue.ownerUserId,
          ...(source.causedByRunId
            ? { causedByRunId: source.causedByRunId }
            : { requestedByUserId: moverId }),
          ownerUserId: issue.ownerUserId,
          priority: runPriorityOf(issue.priority),
          input: {
            type: 'signal',
            actor: source.ref,
            text: [
              `${issue.identifier} entered \`${status.key}\` (from \`${entry.from}\`) and the workflow asked you to work on this stage.`,
              ...(deps.continuedFrom
                ? [
                    'A person continued this stage action past its run limit and restarted its loop guard.',
                  ]
                : []),
              ...(instruction
                ? ['', 'Workflow stage instruction:', '', quote(instruction)]
                : []),
            ].join('\n'),
            payload: {
              trigger: STAGE_TRIGGER,
              from: entry.from,
              to: status.key,
              statusName: status.name,
              instruction,
              ...(deps.continuedFrom
                ? { continuedFrom: deps.continuedFrom }
                : {}),
              ...(byPerson ? { byPerson: true } : {}),
            },
          },
        },
        agentsTx(tx),
      );
      // Someone else's move asks the owner: the rule did its part, the run starts once they confirm it.
      if (result.outcome === 'pending')
        return {
          status: 'applied',
          details: { agentId, requestId: result.requestId },
        };
      return {
        status: 'applied',
        details: { agentId, runId: result.runId },
      };
    },
  };

  const suggestExecutor: StatusRuleType = {
    type: SUGGEST_EXECUTOR,
    categories: OPEN_CATEGORIES,
    validate: (config) => [
      ...unknownFields(config, ['agentId', 'reason']),
      ...agentIdIssues(config.agentId, true),
      ...(config.reason === undefined ||
      (typeof config.reason === 'string' &&
        config.reason.length <= SUGGEST_REASON_MAX)
        ? []
        : [
            {
              path: 'reason',
              message: `A reason is at most ${SUGGEST_REASON_MAX} characters.`,
            },
          ]),
    ],
    describe: (config) => ({
      summary: `Proposes a plan to the owner that makes agent ${textOf(config.agentId) ?? '?'} the executor.`,
    }),
    async entered(entry, config) {
      const agentId = textOf(config.agentId);
      if (!agentId)
        return report(entry, SUGGEST_EXECUTOR, skip('noAgentExecutor'));
      const outcome = await suggest(entry, agentId, textOf(config.reason));
      return report(entry, SUGGEST_EXECUTOR, outcome, { agentId });
    },
  };

  return [runAgent, suggestExecutor];
}

/** A text as a Markdown quote. */
function quote(text: string): string {
  return text
    .split('\n')
    .map((line) => `> ${line}`.trimEnd())
    .join('\n');
}

/**
 * The notices of the stage rules, planned in the transaction of the move: a skip that needs the owner's attention,
 * and a suggestion for the owner to decide. Worded in English, as the other agent notices.
 */
export function stageNoticeRule(): NoticeRule {
  return (context) => {
    const notices = [];
    for (const event of context.events) {
      if (event.type !== 'work.announced' || event.kind !== STAGE_NOTICE_KIND)
        continue;
      const notice = event.payload as StageNotice;
      const { issue } = notice;
      const base = {
        issue: {
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
        },
        userIds: [issue.ownerUserId],
        // The workflow speaks, so the owner hears it even after their own move.
        actor: { type: 'system', id: null, name: 'Studio' },
        slot: 'change' as const,
      };
      // A suggestion reaches the owner as a decision card, once the change behind it is proposed (`proposeSuggestions`):
      // accepting executes that one-row plan, dismissing voids it.
      if (notice.notice === EXECUTOR_SUGGESTED) {
        if (!notice.planId) continue;
        const agentName = notice.agentName ?? notice.agentId ?? 'An agent';
        notices.push({
          ...base,
          key: suggestionDecisionKey(notice.planId),
          kind: 'decision' as const,
          type: EXECUTOR_SUGGESTED,
          params: {
            title: `${agentName} is suggested to work on ${issue.identifier}`,
            body: `${issue.identifier} entered ${notice.statusName}, whose workflow suggests ${agentName} as the executor. Accept or dismiss it in your inbox.`,
            identifier: issue.identifier,
            status: notice.statusKey,
            statusName: notice.statusName,
            planId: notice.planId,
            agentName,
            ...agentNameParams(notice.agentNameText),
            ...(notice.agentId ? { agentId: notice.agentId } : {}),
          },
        });
        continue;
      }
      const reason = notice.reason ?? 'unknown';
      const why =
        reason === 'suppressed'
          ? `${notice.limit ?? STAGE_RUN_LIMIT} runs started for this status within ${notice.windowHours ?? STAGE_RUN_WINDOW_HOURS} hours. Continue on the issue to start another run and reset the count`
          : REASONS[reason];
      notices.push({
        ...base,
        key: `agents:stage:${issue.id}:${notice.statusKey}:${notice.rule}:${notice.at}`,
        kind: 'info' as const,
        type: STAGE_ACTION_PROBLEM,
        params: {
          title: `A stage action of ${issue.identifier} was skipped`,
          body: `The ${notice.rule} action of ${notice.statusName} was skipped (${reason})${why ? `: ${why}` : ''}.`,
          identifier: issue.identifier,
          status: notice.statusKey,
          statusName: notice.statusName,
          rule: notice.rule,
          reason,
          ...(notice.continueToken
            ? {
                continueToken: notice.continueToken,
                limit: String(notice.limit ?? STAGE_RUN_LIMIT),
                windowHours: String(
                  notice.windowHours ?? STAGE_RUN_WINDOW_HOURS,
                ),
              }
            : {}),
          ...(notice.agentId ? { agentId: notice.agentId } : {}),
          ...(notice.agentName ? { agentName: notice.agentName } : {}),
        },
      });
    }
    return Promise.resolve(notices);
  };
}

/** The source kind of the plans the `suggestExecutor` rule proposes. */
export const STATUS_RULE_PLAN_SOURCE = 'statusRule';

/** The owner's decision card of a suggestion, keyed by the plan behind it. */
export function suggestionDecisionKey(planId: string): string {
  return `agents:suggested:${planId}`;
}

/** Plan states in which a suggestion still waits for the owner (a failed or stale one is checked again on Accept). */
const OPEN_SUGGESTION: ReadonlySet<string> = new Set([
  'pending',
  'executing',
  'failed',
  'stale',
]);

/**
 * Settles a suggestion's card in every recipient's inbox once its plan is no longer open: accepted (executed),
 * dismissed (voided), replaced by a newer suggestion for the issue, or expired. Returns what stops it.
 */
export function settleSuggestions(
  projects: Pick<Projects, 'events' | 'plans'>,
  inbox: () => StudioInboxPort | undefined,
  onError: (error: unknown) => void,
): () => void {
  return projects.events.on('plan.changed', (event) => {
    const port = inbox();
    if (!port) return;
    void projects.plans
      .get(systemViewer(), event.planId)
      .then(async (plan) => {
        if (plan.source.kind !== STATUS_RULE_PLAN_SOURCE) return;
        if (OPEN_SUGGESTION.has(plan.status)) return;
        await port.resolve({
          source: PROJECTS_SOURCE,
          decisionKey: suggestionDecisionKey(plan.id),
          outcome:
            plan.status === 'executed'
              ? 'accepted'
              : plan.status === 'voided' && plan.voidReason === 'person'
                ? 'dismissed'
                : plan.status === 'voided'
                  ? 'superseded'
                  : plan.status,
        });
      })
      .catch(onError);
  });
}

/**
 * Once a move that suggested an executor commits, proposes the change behind the suggestion to the issue's owner: a
 * one-row operation plan that makes the agent the executor and starts its work, accepted or dismissed from the
 * owner's inbox card. A newer suggestion for the issue
 * replaces an open one (key `statusRule:<issueId>`). The owner is then notified (`stageNoticeRule`, type
 * `executor_suggested`, with the plan's id). Returns what stops it.
 */
export function proposeSuggestions(
  projects: Pick<Projects, 'events' | 'plans' | 'tx'>,
  onError: (error: unknown) => void,
): () => void {
  return projects.events.on('work.announced', (event) => {
    if (event.kind !== STAGE_NOTICE_KIND) return;
    const notice = event.payload as StageNotice;
    if (
      notice.notice !== EXECUTOR_SUGGESTED ||
      !notice.agentId ||
      notice.planId
    )
      return;
    const { issue } = notice;
    const agentName = notice.agentName ?? notice.agentId;
    projects.plans
      .propose(
        {
          title: `Let ${agentName} work on ${issue.identifier}`,
          description: [
            `${issue.identifier} (${issue.title}) entered ${notice.statusName}, whose workflow suggests ${agentName} as the executor.`,
            ...(notice.suggestReason ? [notice.suggestReason] : []),
          ]
            .join(' ')
            .slice(0, PLAN_DESCRIPTION_MAX),
          source: {
            kind: STATUS_RULE_PLAN_SOURCE,
            key: `${STATUS_RULE_PLAN_SOURCE}:${issue.id}`,
            issueId: issue.id,
            // What a page needs to word the plan in its reader's language (title and description are English).
            data: {
              rule: SUGGEST_EXECUTOR,
              statusKey: notice.statusKey,
              statusName: notice.statusName,
              agentId: notice.agentId,
              agentName,
              ...agentNameParams(notice.agentNameText),
              identifier: issue.identifier,
              issueTitle: issue.title,
              ...(notice.suggestReason ? { reason: notice.suggestReason } : {}),
            },
          },
          deciderUserId: issue.ownerUserId,
          rows: [
            {
              op: 'issue.update',
              params: {
                issue: issue.id,
                set: { executor: { type: AGENT_KIND, id: notice.agentId } },
                start: true,
              },
            },
          ],
        },
        SYSTEM_ACTOR,
      )
      // Announced again with the plan, so `stageNoticeRule` notifies the owner (there is no push yet).
      .then((plan) =>
        projects.tx.run((tx) => {
          tx.emit({
            type: 'work.announced',
            kind: STAGE_NOTICE_KIND,
            payload: { ...notice, planId: plan.id } satisfies StageNotice,
          });
          return Promise.resolve();
        }),
      )
      .catch(onError);
  });
}
