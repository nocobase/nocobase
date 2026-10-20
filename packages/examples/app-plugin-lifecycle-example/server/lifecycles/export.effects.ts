import { defineEffect, type EffectDefinition } from '@nocobase/lifecycle';

import { VENDOR_OUTCOMES, type VendorOutcome } from '../../shared/flows.js';
import type { ExportTypes } from './export.js';
import { fireIfStill } from './flow-services.js';

function outcomeOf(value: unknown): VendorOutcome {
  return VENDOR_OUTCOMES.find((outcome) => outcome === value) ?? 'success';
}

/** Asks the vendor to render the export, once per round. */
export const startJob: EffectDefinition<ExportTypes> =
  defineEffect<ExportTypes>({
    name: 'exports.startJob',
    retry: { attempts: 3, backoffMs: 2_000, factor: 2 },
    timeoutMs: 10_000,
    onSuccess: 'jobStarted',
    onFailure: 'startFailed',
    run: ({ record, services }) =>
      services.sandbox.startJob({
        idempotencyKey: `export-job:${record.id}:${record.jobAttempt}`,
        durationSeconds: record.durationSeconds,
        outcome: outcomeOf(record.vendorOutcome),
      }),
  });

/**
 * Looks at the vendor's job once. It runs every time the export enters
 * `processing`, which the `poll` trigger does every few seconds, so this is
 * the body of the polling loop. While the job runs it only reports what it
 * saw; when the job has ended it fires the transition the ending maps to —
 * a choice a fixed `onSuccess` could not make — under a key named after the
 * job and its ending, so two polls that both see the end fire it once.
 */
export const checkJob: EffectDefinition<ExportTypes> =
  defineEffect<ExportTypes>({
    name: 'exports.checkJob',
    retry: { attempts: 3, backoffMs: 1_000 },
    timeoutMs: 10_000,
    async run({ record, services }) {
      if (!record.jobId) return { status: 'notStarted' };
      const job = await services.sandbox.job(record.jobId);
      if (job.status === 'running')
        return { status: job.status, progress: job.progress };
      const fired = await fireIfStill(
        services,
        'exports',
        record.id,
        job.status === 'succeeded' ? 'jobDone' : 'jobFailed',
        {
          requestId: `vendor-job:${job.jobId}:${job.status}`,
          input:
            job.status === 'succeeded'
              ? { outputUrl: job.url ?? '' }
              : { error: job.error ?? `The job was ${job.status}.` },
        },
      );
      return { status: job.status, progress: job.progress, fired };
    },
  });

/** Tells the vendor to stop: the export timed out or was cancelled. */
export const cancelJob: EffectDefinition<ExportTypes> =
  defineEffect<ExportTypes>({
    name: 'exports.cancelJob',
    retry: { attempts: 5, backoffMs: 2_000, factor: 2 },
    async run({ record, services }) {
      if (!record.jobId) return { cancelled: false };
      const job = await services.sandbox.cancelJob(record.jobId);
      return { status: job.status };
    },
  });
