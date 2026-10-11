/**
 * What Studio does when the projects plugin decides an operation plan (`PlanHooks.onPlanDecided`, bound through
 * `projectsPlanHooksToken`), in the transaction that records the decision:
 *
 * - a direct write's plan is counted against its turn's quota (`quota.ts`), which may still refuse it;
 * - a plan an agent proposed in a conversation (source kinds `conversation` and `intake`) writes the outcome to the
 *   conversation as news (`news` of type `planDecided`, worded by Studio's chat extension) and wakes its agent with a
 *   `planDecided` input carrying every row's result, so it reports back;
 *   an undone plan is only written to the conversation, and a voided one changes nothing;
 * - an executed one of those also makes the conversation follow each issue a row handed to an agent
 *   (`delegation.ts`), so the work's milestones come back to it;
 *
 * Plans are proposed in conversations only (`POST /api/projects/plans`, sourced by `run-principal.ts`); plans
 * from status rules and intake drafts nobody's agent proposed wake nobody.
 */
import type { ActorRef } from '@nocobase/agent-protocol';
import type {
  PlanHooks,
  ProjectsTx,
} from '@nocobase/app-plugin-projects/server/tokens';
import type {
  PlanDecided,
  PlanObjectRef,
} from '@nocobase/app-plugin-projects/shared/plans';

import type {
  Agents,
  NewInput,
} from '@nocobase/app-plugin-agents/server/tokens';
import { agentsTx } from '../tx.js';
import { userName } from '../work.js';
import type { Delegations } from './delegation.js';
import type { DirectWrites } from './quota.js';

/** The source kinds of plans proposed in a conversation. */
export const CONVERSATION_PLAN_SOURCES: readonly string[] = [
  'conversation',
  'intake',
];

/** The trigger of the input a decided plan wakes its agent with, and the type of its news in a conversation. */
export const PLAN_DECIDED_TRIGGER = 'planDecided';

/** The news's English line, as the conversation keeps it. */
const NEWS_WORDS: Readonly<
  Record<Exclude<PlanDecided['outcome'], 'voided'>, string>
> = {
  executed: 'executed',
  failed: 'not executed: a row failed',
  stale: 'not executed: something it changes was changed meanwhile',
  undone: 'undone',
};

const OUTCOME_WORDS: Readonly<Record<PlanDecided['outcome'], string>> = {
  executed: 'executed: every row was applied',
  failed: 'not executed: a row failed, so nothing was applied',
  stale:
    'not executed: something it changes was changed meanwhile, so nothing was applied',
  voided: 'voided',
  undone: 'undone',
};

function named(ref: PlanObjectRef | null): string {
  if (!ref) return '';
  const label = [ref.identifier, ref.title].filter(Boolean).join(' ');
  return label || `${ref.type} ${ref.id ?? ''}`.trim();
}

/** The input text: the outcome and each row, for the agent to report. */
export function renderPlanDecided(
  decided: PlanDecided,
  deciderName: string,
): string {
  const lines = [
    `${deciderName} decided your operation plan "${decided.title}" (plan ${decided.planId}): it was ${OUTCOME_WORDS[decided.outcome]}.`,
  ];
  if (decided.failure)
    lines.push(`Why: ${decided.failure.code}: ${decided.failure.message}`);
  lines.push('', 'Rows:');
  for (const row of decided.rows) {
    const what = row.created
      ? `created ${named(row.created)}`
      : row.target
        ? `on ${named(row.target)}`
        : '';
    const state =
      decided.outcome === 'executed' || decided.outcome === 'undone'
        ? 'done'
        : row.ok
          ? 'not applied'
          : `failed: ${row.error?.code ?? 'ERROR'} ${row.error?.message ?? ''}`.trim();
    lines.push(
      `${row.position + 1}. ${row.op}${what ? ` ${what}` : ''} — ${state}`,
    );
  }
  lines.push(
    '',
    decided.outcome === 'executed'
      ? 'Tell the person briefly what changed. Do not repeat what the plan did.'
      : 'Tell the person briefly what happened. Nothing of the plan was applied; propose a corrected plan only if they still want it.',
  );
  return lines.join('\n');
}

function payloadOf(decided: PlanDecided): Readonly<Record<string, unknown>> {
  return {
    trigger: PLAN_DECIDED_TRIGGER,
    planId: decided.planId,
    outcome: decided.outcome,
    failure: decided.failure,
    rows: decided.rows,
  };
}

export function createPlanHooks(deps: {
  readonly agents: Pick<Agents, 'conversations' | 'runs' | 'agents'>;
  readonly direct: Pick<DirectWrites, 'onPlanDecided' | 'isDirect'>;
  /** Follows the work a conversation's plan handed to agents; nobody follows it without. */
  readonly delegations?: Pick<Delegations, 'onPlanDecided'>;
  /** Waking the agent is not worth failing the decision for: what goes wrong is reported here. */
  readonly onError?: (error: unknown) => void;
}): PlanHooks {
  const { agents } = deps;

  async function input(
    tx: ProjectsTx,
    decided: PlanDecided,
  ): Promise<NewInput> {
    const name = await userName(tx.conn, decided.decidedById);
    const actor: ActorRef = {
      kind: 'user',
      id: decided.decidedById,
      name,
    };
    return {
      type: 'planDecided',
      actor,
      text: renderPlanDecided(decided, name),
      payload: payloadOf(decided),
    };
  }

  async function toConversation(
    tx: ProjectsTx,
    decided: PlanDecided,
    conversationId: string,
  ): Promise<void> {
    if (decided.outcome === 'voided') return;
    await agents.conversations.deliver(agentsTx(tx), conversationId, {
      notice: {
        code: 'news',
        type: PLAN_DECIDED_TRIGGER,
        title: `The plan "${decided.title}" was ${NEWS_WORDS[decided.outcome]}.`,
        params: {
          planId: decided.planId,
          outcome: decided.outcome,
          title: decided.title,
        },
      },
      ...(decided.outcome === 'undone'
        ? {}
        : { input: await input(tx, decided) }),
    });
  }

  return {
    async onPlanDecided(tx, decided) {
      if (deps.direct.isDirect(decided)) {
        await deps.direct.onPlanDecided(tx, decided);
        return;
      }
      const data = decided.source.data as
        { conversationId?: unknown } | null | undefined;
      try {
        if (
          CONVERSATION_PLAN_SOURCES.includes(decided.source.kind) &&
          typeof data?.conversationId === 'string'
        ) {
          await toConversation(tx, decided, data.conversationId);
          await deps.delegations?.onPlanDecided(
            tx,
            decided,
            data.conversationId,
          );
        }
      } catch (error) {
        deps.onError?.(error);
      }
    },
  };
}
