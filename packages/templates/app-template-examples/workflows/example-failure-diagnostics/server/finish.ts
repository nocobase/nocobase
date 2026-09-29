import type { WorkflowRunOptions } from '@nocobase/app-plugin-workflow';
import type { FlowContext } from '../workflow.js';
export function run(
  { nodeResults }: FlowContext,
  options: WorkflowRunOptions,
): { reference: string; completed: boolean } {
  options.signal.throwIfAborted();
  const result = nodeResults.execute;
  if (!result || result.completed !== true)
    throw new Error('Operation did not complete.');
  options.logger.info('Diagnostic workflow completed');
  return result;
}
