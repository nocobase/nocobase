import { AsyncLocalStorage } from 'node:async_hooks';

export class DeploymentCancelledError extends Error {
  readonly code = 'DEPLOYMENT_CANCELLED';
  constructor() {
    super('Deployment cancelled.');
  }
}

export interface DeploymentControl {
  cancelled: boolean;
  switching: boolean;
  signal?: AbortSignal;
}
const context = new AsyncLocalStorage<DeploymentControl>();
const preparation = new AsyncLocalStorage<AbortSignal>();
export const withDeploymentControl = <T>(
  control: DeploymentControl,
  work: () => Promise<T>,
): Promise<T> => context.run(control, work);
export function deploymentCheckpoint(): void {
  if (context.getStore()?.cancelled) throw new DeploymentCancelledError();
}
export function beginDeploymentSwitch(): void {
  deploymentCheckpoint();
  const control = context.getStore();
  if (control) control.switching = true;
}

/** Cancellation of long-running preparation work in the current deployment. */
export function deploymentSignal(): AbortSignal | undefined {
  return preparation.getStore() ?? context.getStore()?.signal;
}

/** Adds a startup deadline to archive work without changing a deployment's switching/cancellation boundary. */
export function withPreparationSignal<T>(
  signal: AbortSignal,
  work: () => Promise<T>,
): Promise<T> {
  return preparation.run(signal, work);
}
