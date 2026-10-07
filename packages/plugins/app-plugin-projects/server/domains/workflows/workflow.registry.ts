/**
 * The rules a workflow of this plugin may name (`shared/workflows.ts`), registered on the lifecycle registry that
 * validates definitions and moves issues. Rules run in the transaction of the move: `context` is its `Tx`.
 *
 * Every status rule type, this plugin's own (`built-in-rule-types.ts`) and those other plugins contribute
 * (`rule-types.ts`), is looked up in one `StatusRuleTypes` on each use and adapted here to a lifecycle state rule.
 *
 * Approvers (`APPROVER_ROLES`): `owner` is the issue's owner, `projectLead` the lead of its project (nobody without a
 * project), `admin` every active holder of the admin or owner role.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type {
  Executor,
  Issue,
  StatusCategory,
} from '../../../shared/issues.js';
import type { ActivityRecorder } from '../../kernel/activity.js';
import type { Actor } from '../../kernel/actor.js';
import type { Tx } from '../../kernel/tx.js';
import {
  createLifecycleRegistry,
  type RuleConfig,
  type RuleContext,
  type StateRule,
} from '../../lifecycle/index.js';
import { findIssue, updateIssue, type IssueRules } from '../issues/index.js';
import type {
  EnteredStatus,
  StatusRuleCheck,
  StatusRuleType,
  StatusRuleTypes,
} from './rule-types.js';

export type { RelationChecks } from './built-in-rule-types.js';

/** The lifecycle actor as the activity log records it: its kind and id, as they are. */
function actorOf(actor: {
  readonly type: string;
  readonly id: string | null;
}): Actor {
  return { type: actor.type, id: actor.id };
}

/** Who the approver roles are, read in the transaction of the move. */
export interface ApproverDirectory {
  projectLead(
    conn: DatabaseConnection,
    projectId: string,
  ): Promise<string | null>;
  admins(conn: DatabaseConnection): Promise<readonly string[]>;
}

/** The status a move leads to, as a rule type sees it. */
function enteredStatus(ctx: RuleContext<Issue, Tx>): EnteredStatus {
  return {
    key: ctx.to,
    name:
      ctx.machine.states.find((item) => item.key === ctx.to)?.name ?? ctx.to,
    category: (ctx.machine.category(ctx.to) ?? 'started') as StatusCategory,
  };
}

/** What a condition is asked about a move: the issue as it is before it. */
function checkOf(ctx: RuleContext<Issue, Tx>): StatusRuleCheck {
  return {
    tx: ctx.context,
    issue: ctx.subject,
    from: ctx.from,
    status: enteredStatus(ctx),
    actor: actorOf(ctx.actor),
    event: ctx.event ?? null,
  };
}

/**
 * A status rule type as a lifecycle state rule: its conditions guard entering and leaving, with the issue as it is
 * before the move; its action runs on entering, with the issue as it is after it.
 */
function stateRuleOf(
  type: StatusRuleType,
  activity: ActivityRecorder,
): StateRule<Issue, Tx> {
  const canEnter = type.canEnter?.bind(type);
  const canLeave = type.canLeave?.bind(type);
  const entered = type.entered?.bind(type);
  return {
    ...(type.validate
      ? { validate: (config: RuleConfig) => type.validate!(config) }
      : {}),
    ...(canEnter
      ? {
          canEnter: (ctx: RuleContext<Issue, Tx>, config: RuleConfig) =>
            canEnter(checkOf(ctx), config),
        }
      : {}),
    ...(canLeave
      ? {
          canLeave: (ctx: RuleContext<Issue, Tx>, config: RuleConfig) =>
            canLeave(checkOf(ctx), config),
        }
      : {}),
    ...(entered
      ? {
          entered: (ctx: RuleContext<Issue, Tx>, config: RuleConfig) =>
            enter(entered, ctx, config),
        }
      : {}),
  };

  async function enter(
    run: NonNullable<StatusRuleType['entered']>,
    ctx: RuleContext<Issue, Tx>,
    config: RuleConfig,
  ) {
    const tx = ctx.context;
    let issue = (await findIssue(tx.conn, ctx.subject.id)) ?? ctx.subject;
    const actor = actorOf(ctx.actor);
    const outcome = await run(
      {
        tx,
        get issue() {
          return issue;
        },
        from: ctx.from,
        status: enteredStatus(ctx),
        actor,
        async setExecutor(executor: Executor) {
          if (
            issue.executor?.type === executor.type &&
            issue.executor.id === executor.id
          )
            return issue;
          const now = new Date().toISOString();
          await updateIssue(tx.conn, issue.id, {
            executorType: executor.type,
            executorId: executor.id,
            updatedAt: now,
            lastActivityAt: now,
          });
          await activity.record(tx.conn, {
            issueId: issue.id,
            actor,
            action: 'executor_changed',
            details: {
              from: issue.executor,
              to: executor,
              trigger: 'stageEntered',
              rule: type.type,
            },
          });
          issue = (await findIssue(tx.conn, issue.id)) ?? issue;
          return issue;
        },
      },
      config,
    );
    return outcome;
  }
}

export function createIssueRegistry(deps: {
  readonly activity: ActivityRecorder;
  readonly approvers: ApproverDirectory;
  /** Every status rule type: this plugin's own and those other plugins contribute (`withBuiltInTypes`). */
  readonly types: StatusRuleTypes;
}): IssueRules {
  const approvers = approverRegistry(deps.approvers);
  const adapted = new WeakMap<StatusRuleType, StateRule<Issue, Tx>>();
  return {
    ...approvers,
    findStateRule(type) {
      const found = deps.types.get(type);
      if (!found) return undefined;
      let rule = adapted.get(found);
      if (!rule) {
        rule = stateRuleOf(found, deps.activity);
        adapted.set(found, rule);
      }
      return rule;
    },
  };
}

function approverRegistry(directory: ApproverDirectory): IssueRules {
  return createLifecycleRegistry<Issue, Tx>()
    .approver('owner', {
      resolve: (ctx) => Promise.resolve([ctx.subject.ownerUserId]),
    })
    .approver('projectLead', {
      async resolve(ctx) {
        if (!ctx.subject.projectId) return [];
        const lead = await directory.projectLead(
          ctx.context.conn,
          ctx.subject.projectId,
        );
        return lead ? [lead] : [];
      },
    })
    .approver('admin', {
      resolve: (ctx) => directory.admins(ctx.context.conn),
    });
}
