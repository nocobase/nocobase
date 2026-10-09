import {
  defineLifecycle,
  LifecycleError,
  type Lifecycle,
  type LifecycleRecord,
} from '@nocobase/lifecycle';

import { DATA_REQUEST_ROLES } from '../../shared/people.js';
import { COLLECTIONS } from '../scope.js';
import { people } from '../services/store.js';
import type { OfficeServices } from './data-request.js';
import { text } from '../../shared/text.js';

export type ExtractionState = 'pending' | 'completed' | 'voided';

export interface Extraction extends LifecycleRecord {
  readonly status: ExtractionState;
  readonly executorIds: unknown;
}

export interface ExtractionTypes {
  record: Extraction;
  state: ExtractionState;
  services: OfficeServices;
}

/** The processing fields a task must have before it can be submitted. */
export const EXTRACTION_REQUIRED: readonly (readonly [string, string])[] = [
  ['category', 'implementation category'],
  ['complexity', 'extraction complexity'],
  ['agreedDeliveryAt', 'delivery time agreed with the user'],
  ['sourceSystem', 'source system'],
  ['needsDownload', 'whether the data is downloaded'],
  ['feedbackNote', 'feedback note'],
  ['managerId', 'extraction manager'],
  ['confirmerId', 'business confirmer'],
];

/**
 * One extraction task of a data usage request. Its approval has no
 * requirements, so it is processed once and submitted, or voided by the
 * acceptor.
 */
export const extractionLifecycle: Lifecycle<ExtractionTypes> =
  defineLifecycle<ExtractionTypes>({
    name: 'extractions',
    collection: COLLECTIONS.extractions,
    initial: 'pending',
    states: [
      'pending',
      { name: 'completed', final: true },
      { name: 'voided', final: true },
    ],
    transitions: {
      submit: {
        title: '提交反馈',
        from: 'pending',
        to: 'completed',
        guard: ({ record, actor }) =>
          people(record.executorIds).includes(actor.id) ||
          actor.id === DATA_REQUEST_ROLES.acceptor,
        set: ({ record }) => {
          const missing = EXTRACTION_REQUIRED.filter(
            ([field]) =>
              record[field] === null ||
              record[field] === undefined ||
              record[field] === '',
          ).map(([, label]) => label);
          // Unfilled fields are the task's state: 400 FAILED_PRECONDITION.
          if (missing.length)
            throw new LifecycleError(
              'INVALID_STATE',
              `Fill in before submitting: ${missing.join(', ')}.`,
            );
          return {};
        },
      },
      void: {
        title: '作废',
        from: 'pending',
        to: 'voided',
        guard: ({ actor }) => actor.id === DATA_REQUEST_ROLES.acceptor,
        validate: (input) =>
          typeof input.reason === 'string' && input.reason.trim()
            ? null
            : 'Give a reason for voiding the task.',
        set: ({ input }) => ({ voidReason: text(input.reason) }),
      },
    },
  });
