import type { JsonObject } from '../server/instructions/types.js';

/** Data snapshots supplied to every context-based workflow handler. */
export interface WorkflowHandlerContext<
  TInput = JsonObject,
  TParameters = Readonly<Record<string, string | number | boolean>>,
  TNodeResults = Readonly<Record<string, unknown>>,
> {
  readonly input: TInput;
  readonly parameters: TParameters;
  readonly nodeResults: TNodeResults;
}
