import type { WorkflowRunOptions } from '@nocobase/app-plugin-workflow';
import type { FlowContext } from '../workflow.js';
export function run(
  { input }: FlowContext,
  options: WorkflowRunOptions,
): { reference: string } {
  options.signal.throwIfAborted();
  const reference = input.reference;
  if (typeof reference !== 'string' || !reference.trim())
    throw new Error('Diagnostic reference is required.');
  options.logger.info('Diagnostic run prepared', { reference });
  return { reference };
}
