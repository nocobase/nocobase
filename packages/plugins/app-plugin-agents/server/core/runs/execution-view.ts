import type { Run, RunExecution } from '../../../shared/runs.js';

/** An application's permission decision, using the same rules as its runner machine views. */
export interface RunMachineViewer {
  readonly userId: string;
  readonly seesMachines: boolean;
}

export function executionForViewer(
  execution: RunExecution,
  viewer: RunMachineViewer,
): RunExecution {
  if (viewer.seesMachines || execution.runnerOwnerUserId === viewer.userId)
    return execution;
  return {
    ...execution,
    runnerName: null,
    runnerOwnerName: null,
    runnerTrust: null,
    machineHidden: true,
  };
}

/** Apply at every user-facing boundary; internal claim/report reads retain the original snapshot. */
export function runForViewer<T extends Run>(
  run: T,
  viewer: RunMachineViewer,
): T {
  const executions = run.executions?.map((execution) =>
    executionForViewer(execution, viewer),
  );
  const latest = executions?.at(-1);
  const hidden =
    !viewer.seesMachines && (!latest || latest.machineHidden === true);
  return {
    ...run,
    ...(executions ? { executions } : {}),
    ...(hidden
      ? { runnerName: null, runnerOwnerName: null, machineHidden: true }
      : {}),
  };
}
