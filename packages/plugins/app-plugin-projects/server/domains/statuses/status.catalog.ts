/**
 * The fixed statuses as a lifecycle machine (`server/lifecycle`), so every move still goes through one path: who may,
 * then the entry actions, each in its own savepoint.
 *
 * - People (`user`) move an issue between any two statuses.
 * - A registered kind moves it only along its own `moves`, and only when its `mayMove`, if any, agrees.
 * - The system moves it only along a registered status event (`event-types.ts`).
 * - Entering `blocked` or `in_review` tells the issue's owner, unless the owner moved it.
 *
 * Kinds and events may be registered after the services are created, so the machine is compiled again whenever either
 * list changes.
 */
import type { Issue, StatusDefinition } from '../../../shared/issues.js';
import {
  FIXED_STATUSES,
  OWNER_NOTIFIED_STATUSES,
  statusCategory,
} from '../../../shared/statuses.js';
import { SYSTEM_KIND, USER_KIND } from '../../../shared/kinds.js';
import type { ActivityRecorder } from '../../kernel/activity.js';
import type { Actor } from '../../kernel/actor.js';
import type { KindRegistry, PrincipalKind } from '../../kernel/kinds.js';
import type { Tx } from '../../kernel/tx.js';
import {
  ANY_STATE,
  compile,
  createLifecycleRegistry,
  type LifecycleTransition,
} from '../../lifecycle/index.js';
import { findIssue } from '../issues/issue.store.js';
import type {
  IssueRules,
  StatusCatalog,
  StatusService,
} from '../issues/ports.js';
import type { StatusEventType, StatusEventTypes } from './event-types.js';
import './status.events.js';

/** The entry action of the statuses whose owner is told. */
export const NOTIFY_OWNER_RULE = 'notifyOwner';
/** The "who may" rule a kind's `mayMove` answers through. */
export const KIND_MAY_MOVE_RULE = 'kindMayMove';

function rulesOf(deps: {
  readonly kinds: KindRegistry;
  readonly activity: ActivityRecorder;
}): IssueRules {
  return createLifecycleRegistry<Issue, Tx>()
    .stateRule(NOTIFY_OWNER_RULE, {
      async entered(ctx) {
        const tx = ctx.context;
        const actor: Actor = ctx.sourceActor ?? ctx.actor;
        const issue = (await findIssue(tx.conn, ctx.subject.id)) ?? ctx.subject;
        if (actor.type === USER_KIND && actor.id === issue.ownerUserId)
          return { status: 'skipped', reason: 'ownerMovedIt' };
        const status = FIXED_STATUSES.find((item) => item.key === ctx.to);
        await deps.activity.record(tx.conn, {
          issueId: issue.id,
          actor,
          action: 'owner_notified',
          details: { statusKey: ctx.to, ownerUserId: issue.ownerUserId },
        });
        tx.emit({
          type: 'status.ownerNotified',
          issueId: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          ownerUserId: issue.ownerUserId,
          statusKey: ctx.to,
          statusName: status?.name ?? ctx.to,
        });
        return undefined;
      },
    })
    .whoRule(KIND_MAY_MOVE_RULE, {
      async allows(ctx) {
        const kind = deps.kinds.get(ctx.actor.type);
        if (!kind?.mayMove) return true;
        return kind.mayMove(ctx.context.conn, ctx.actor, {
          issue: ctx.subject,
          from: ctx.from,
          to: ctx.to,
        });
      },
    });
}

function transitionsOf(
  kinds: readonly PrincipalKind[],
  events: readonly StatusEventType[],
): LifecycleTransition[] {
  const transitions: LifecycleTransition[] = [
    { from: ANY_STATE, to: ANY_STATE, actors: [USER_KIND] },
  ];
  for (const kind of kinds) {
    if (kind.key === USER_KIND || kind.key === SYSTEM_KIND) continue;
    for (const move of kind.moves ?? [])
      transitions.push({
        from: move.from,
        to: move.to,
        actors: [kind.key],
        ...(kind.mayMove ? { who: { type: KIND_MAY_MOVE_RULE } } : {}),
      });
  }
  for (const event of events)
    for (const from of event.from)
      if (from !== event.to)
        transitions.push({
          from,
          to: event.to,
          actors: [SYSTEM_KIND],
          on: event.key,
        });
  return transitions;
}

const sameItems = <T>(a: readonly T[], b: readonly T[]) =>
  a.length === b.length && a.every((item, index) => item === b[index]);

export function createStatusService(deps: {
  readonly kinds: KindRegistry;
  readonly events: StatusEventTypes;
  readonly activity: ActivityRecorder;
}): StatusService {
  const rules = rulesOf(deps);
  let built:
    | {
        readonly kinds: readonly PrincipalKind[];
        readonly events: readonly StatusEventType[];
        readonly catalog: StatusCatalog;
      }
    | undefined;

  function catalog(): StatusCatalog {
    const kinds = deps.kinds.list();
    const events = deps.events.list();
    if (
      built &&
      sameItems(built.kinds, kinds) &&
      sameItems(built.events, events)
    )
      return built.catalog;
    const machine = compile({
      states: FIXED_STATUSES.map((status) => ({
        ...status,
        builtIn: true,
        ...(OWNER_NOTIFIED_STATUSES.includes(status.key)
          ? { rules: [{ type: NOTIFY_OWNER_RULE }] }
          : {}),
      })),
      transitions: transitionsOf(kinds, events),
    });
    built = {
      kinds,
      events,
      catalog: {
        statuses: FIXED_STATUSES,
        category: statusCategory,
        machine,
        rules,
      },
    };
    return built.catalog;
  }

  return {
    list: (): readonly StatusDefinition[] => FIXED_STATUSES,
    category: statusCategory,
    allowedMoves: (kind, from) => [
      ...catalog().machine.allowedMoves(from, kind),
    ],
    catalog,
  };
}
