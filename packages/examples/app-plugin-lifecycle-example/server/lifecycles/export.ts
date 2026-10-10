import {
  defineLifecycle,
  type InputProblem,
  type Lifecycle,
  type LifecycleRecord,
} from '@nocobase/lifecycle';

import { VENDOR_OUTCOMES } from '../../shared/flows.js';
import { text } from '../../shared/text.js';
import { LIFECYCLE_EXAMPLE_COLLECTIONS } from '../scope.js';
import { cancelJob, checkJob, startJob } from './export.effects.js';
import {
  errorText,
  millis,
  required,
  type FlowServices,
} from './flow-services.js';

export type ExportState =
  | 'draft'
  | 'starting'
  | 'processing'
  | 'done'
  | 'failed'
  | 'timedOut'
  | 'cancelled';

export interface DataExport extends LifecycleRecord {
  readonly title: string;
  readonly durationSeconds: number;
  readonly vendorOutcome: string;
  readonly jobAttempt: number;
  readonly jobId: string | null;
  readonly deadlineAt: string | null;
  readonly pollCount: number;
  readonly status: ExportState;
  readonly statusChangedAt: string;
}

export interface ExportTypes {
  record: DataExport;
  state: ExportState;
  parameters: { pollSeconds: number; maxMinutes: number };
  services: FlowServices;
}

function exportProblems(
  values: Readonly<Record<string, unknown>>,
): InputProblem[] {
  const seconds = Number(values.durationSeconds);
  return [
    ...required(values, 'title', 'Name the export.'),
    ...(Number.isInteger(seconds) && seconds >= 5 && seconds <= 600
      ? []
      : [
          {
            field: 'durationSeconds',
            message: 'The vendor takes between 5 and 600 seconds.',
          },
        ]),
    ...((VENDOR_OUTCOMES as readonly string[]).includes(
      text(values.vendorOutcome),
    )
      ? []
      : [{ field: 'vendorOutcome', message: 'Choose how the job ends.' }]),
  ];
}

/** Starting a round: a new job under a new key, with nothing left from the last. */
function newRound({ record }: { readonly record: DataExport }) {
  return {
    jobAttempt: record.jobAttempt + 1,
    jobId: null,
    deadlineAt: null,
    pollCount: 0,
    outputUrl: null,
    lastError: null,
  };
}

/**
 * A data export rendered by a vendor that sends no webhook. Nothing calls
 * back, so the lifecycle asks: the `poll` trigger fires a self-transition
 * on an export idle in `processing` for `pollSeconds`, and entering
 * `processing` again runs `checkJob`, which looks at the vendor's job. The
 * wait between two polls is the trigger's idle time, which every poll
 * restarts — that is what makes it an interval. The overall deadline cannot
 * be a second trigger for the same reason, so it is written onto the
 * export when the job starts and read by the poll's own `route`.
 */
export const exportLifecycle: Lifecycle<ExportTypes> =
  defineLifecycle<ExportTypes>({
    name: 'exports',
    collection: LIFECYCLE_EXAMPLE_COLLECTIONS.exports,
    initial: 'draft',
    create: { validate: exportProblems },
    states: [
      'draft',
      'starting',
      'processing',
      { name: 'done', final: true },
      'failed',
      'timedOut',
      { name: 'cancelled', final: true },
    ],
    parameters: { pollSeconds: 15, maxMinutes: 3 },
    transitions: {
      submit: {
        title: '开始导出',
        from: 'draft',
        to: 'starting',
        set: newRound,
      },
      retry: {
        title: '重新导出',
        from: ['failed', 'timedOut'],
        to: 'starting',
        set: newRound,
      },
      jobStarted: {
        title: '任务已提交',
        manual: false,
        from: 'starting',
        to: 'processing',
        accept: ['jobId'],
        // The deadline is the record's own, fixed when the job starts.
        set: ({ now, parameters }) => ({
          deadlineAt: new Date(
            now.getTime() + parameters.maxMinutes * 60_000,
          ).toISOString(),
        }),
      },
      startFailed: {
        title: '提交失败',
        manual: false,
        from: 'starting',
        to: 'failed',
        set: ({ input }) => ({ lastError: errorText(input) }),
      },
      poll: {
        title: '轮询',
        manual: false,
        from: 'processing',
        to: ['processing', 'timedOut'],
        route: ({ record, now }) =>
          now.getTime() >= millis(record.deadlineAt)
            ? 'timedOut'
            : 'processing',
        set: ({ record, to }) =>
          to === 'timedOut'
            ? { lastError: 'The vendor did not finish before the deadline.' }
            : { pollCount: record.pollCount + 1 },
      },
      jobDone: {
        title: '导出完成',
        manual: false,
        from: 'processing',
        to: 'done',
        accept: ['outputUrl'],
      },
      jobFailed: {
        title: '导出失败',
        manual: false,
        from: 'processing',
        to: 'failed',
        set: ({ input }) => ({ lastError: errorText(input) }),
      },
      cancel: {
        title: '取消',
        from: 'processing',
        to: 'cancelled',
      },
    },
    onEnter: {
      starting: [startJob],
      // Every poll re-enters the state, so this is the loop's body.
      processing: [checkJob],
      timedOut: [cancelJob],
      cancelled: [cancelJob],
    },
    triggers: {
      pollProcessing: {
        transition: 'poll',
        when: 'processing',
        after: ({ pollSeconds }) => pollSeconds * 1000,
      },
    },
  });
