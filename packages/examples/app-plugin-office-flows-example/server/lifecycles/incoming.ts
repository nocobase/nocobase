import {
  defineEffect,
  defineLifecycle,
  LifecycleError,
  type EffectDefinition,
  type Lifecycle,
  type LifecycleRecord,
  type TransitionContext,
} from '@nocobase/lifecycle';

import { COLLECTIONS } from '../scope.js';
import { idOf, people } from '../services/store.js';
import type { OfficeServices } from './data-request.js';
import { text } from '../../shared/text.js';

export type IncomingState =
  'draft' | 'headReview' | 'leaderReview' | 'dispatching' | 'closed';

export interface Incoming extends LifecycleRecord {
  readonly title: string;
  readonly registrarId: string;
  readonly officeHeadId: string;
  readonly officeLeaderId: string;
  readonly status: IncomingState;
}

export interface IncomingTypes {
  record: Incoming;
  state: IncomingState;
  services: OfficeServices;
}

type Context = TransitionContext<IncomingTypes>;

export const INCOMING_REQUIRED: readonly (readonly [string, string])[] = [
  ['title', 'title'],
  ['code', 'document code'],
  ['sender', 'sender'],
  ['senderRef', "sender's reference"],
  ['summary', 'summary'],
  ['officeOpinion', 'office opinion'],
  ['distributionType', 'distribution type'],
  ['officeHeadId', 'office head'],
  ['officeLeaderId', 'office leader'],
];

function isRegistrar({ record, actor }: Context): boolean {
  return actor.id === record.registrarId;
}

function rowIds(input: Record<string, unknown>): number[] {
  return Array.isArray(input.rowIds) ? input.rowIds.map(idOf) : [];
}

function rowsRequired(input: Record<string, unknown>): string | null {
  return rowIds(input).length ? null : 'There are no rows to dispatch.';
}

/** Each pending department row becomes a task; its people are reminded once. */
export const dispatchClerks: EffectDefinition<IncomingTypes> =
  defineEffect<IncomingTypes>({
    name: 'incoming.dispatchClerks',
    retry: { attempts: 3, backoffMs: 1_000 },
    async run({ record, input, services, transition, idempotencyKey }) {
      const result = await services.store.dispatch(1, rowIds(input));
      if (result.created.length)
        await services.store.trace({
          key: idempotencyKey,
          docKind: 'incoming',
          docId: idOf(record.id),
          actorId: record.registrarId,
          action: transition === 'dispatchClerks' ? '派发办事人员' : transition,
          detail: {
            departments: result.created.map((item) => item.departmentName),
            numbers: result.created.map((item) => item.number),
            notified: result.notified,
            skipped: result.skipped,
          },
        });
      return { created: result.created.length, notified: result.notified };
    },
  });

/** Pending management rows are forwarded; their members are reminded once. */
export const forwardManagement: EffectDefinition<IncomingTypes> =
  defineEffect<IncomingTypes>({
    name: 'incoming.forwardManagement',
    retry: { attempts: 3, backoffMs: 1_000 },
    async run({ record, input, services, idempotencyKey }) {
      const recipients: string[] = [];
      const groups: string[] = [];
      for (const id of rowIds(input)) {
        await services.store.repository(COLLECTIONS.managementCc).updateMany({
          filter: { id, forwarded: false },
          values: { forwarded: true },
        });
        // A row an earlier attempt forwarded counts too: if that attempt
        // stopped before reminding, this one reminds; the reminders and the
        // trace each happen once however many attempts run.
        const row = await services.store.find(COLLECTIONS.managementCc, id);
        if (row?.forwarded !== true) continue;
        groups.push(text(row.groupName));
        recipients.push(...people(row.members));
      }
      const notified = await services.store.notify({
        rootKind: 'incoming',
        rootId: idOf(record.id),
        level: '1',
        recipients,
        message: `收文《${record.title}》已转发公司管理层（${groups.join('、')}）`,
        sourceKind: 'incoming',
        sourceId: idOf(record.id),
      });
      if (groups.length)
        await services.store.trace({
          key: idempotencyKey,
          docKind: 'incoming',
          docId: idOf(record.id),
          actorId: record.registrarId,
          action: '转发管理人员',
          detail: {
            groups,
            notified,
            skipped: [...new Set(recipients)].filter(
              (person) => !notified.includes(person),
            ),
          },
        });
      return { notified };
    },
  });

/**
 * An incoming document: the office records it, its head and its leader
 * approve it, and its registrar distributes it to departments. Re-approval
 * sends it back to the head; reminders already sent are not sent again.
 */
export const incomingLifecycle: Lifecycle<IncomingTypes> =
  defineLifecycle<IncomingTypes>({
    name: 'incoming',
    collection: COLLECTIONS.incoming,
    initial: 'draft',
    states: [
      'draft',
      'headReview',
      'leaderReview',
      'dispatching',
      { name: 'closed', final: true },
    ],
    transitions: {
      submit: {
        title: '提交',
        from: 'draft',
        to: 'headReview',
        guard: isRegistrar,
        set: ({ record }) => {
          const missing = INCOMING_REQUIRED.filter(
            ([field]) => !record[field],
          ).map(([, label]) => label);
          // Unfilled fields are the document's state: 400 FAILED_PRECONDITION.
          if (missing.length)
            throw new LifecycleError(
              'INVALID_STATE',
              `Fill in before submitting: ${missing.join(', ')}.`,
            );
          return { returnReason: null };
        },
      },
      approve: {
        title: '同意',
        from: ['headReview', 'leaderReview'],
        to: ['leaderReview', 'dispatching'],
        route: ({ record }) =>
          record.status === 'headReview' ? 'leaderReview' : 'dispatching',
        guard: ({ record, actor }) =>
          actor.id ===
          (record.status === 'headReview'
            ? record.officeHeadId
            : record.officeLeaderId),
      },
      returnToRegistrar: {
        title: '退回',
        from: ['headReview', 'leaderReview'],
        to: 'draft',
        guard: ({ record, actor }) =>
          actor.id ===
          (record.status === 'headReview'
            ? record.officeHeadId
            : record.officeLeaderId),
        validate: (input) =>
          typeof input.reason === 'string' && input.reason.trim()
            ? null
            : 'Give a reason for returning the document.',
        set: ({ input }) => ({ returnReason: text(input.reason) }),
      },
      dispatchClerks: {
        title: '派发办事人员',
        from: 'dispatching',
        to: 'dispatching',
        guard: isRegistrar,
        validate: rowsRequired,
        effects: [dispatchClerks],
      },
      forwardManagement: {
        title: '转发管理人员',
        from: 'dispatching',
        to: 'dispatching',
        guard: isRegistrar,
        validate: rowsRequired,
        effects: [forwardManagement],
      },
      reapprove: {
        title: '[N] 重新审批分派',
        from: 'dispatching',
        to: 'headReview',
        guard: isRegistrar,
      },
      close: {
        title: '办结',
        from: 'dispatching',
        to: 'closed',
        guard: isRegistrar,
      },
    },
  });
