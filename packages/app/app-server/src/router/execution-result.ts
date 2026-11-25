import type { Context } from 'hono';

interface ExecutionEnv {
  Variables: { apiExecutionResult: { value?: unknown } };
}

export function enableApiExecutionResult(context: Context): void {
  (context as Context<ExecutionEnv>).set('apiExecutionResult', {});
}

/** Retain an in-process framework result if an observer requested it. */
export function setApiExecutionResult(context: Context, result: unknown): void {
  const slot = (context as Context<ExecutionEnv>).get('apiExecutionResult');
  if (slot) slot.value = result;
}

export function apiExecutionResultOf(context: Context): unknown {
  return (context as Context<ExecutionEnv>).get('apiExecutionResult')?.value;
}
