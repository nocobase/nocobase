import type { RunDetail } from '@nocobase/app-plugin-agents/shared/runs';

/** Retries retain unhandled history, so select the input for this retry only. */
export function runTriggerActor(
  detail: Pick<RunDetail, 'retryOfRunId' | 'inputs'>,
) {
  return detail.retryOfRunId
    ? (detail.inputs.find(
        (input) =>
          input.type === 'retry' &&
          (input.payload as { retryOfRunId?: string } | null)?.retryOfRunId ===
            detail.retryOfRunId,
      )?.actor ?? detail.inputs[0]?.actor)
    : detail.inputs[0]?.actor;
}
