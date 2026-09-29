import type { WorkflowRunOptions } from '@nocobase/app-plugin-workflow';
import type { FlowContext } from '../workflow.js';
export function run(
  { input }: FlowContext,
  options: WorkflowRunOptions,
): { reference: string; completed: boolean } {
  options.signal.throwIfAborted();
  const args = input;
  if (
    !args ||
    typeof args.reference !== 'string' ||
    typeof args.simulateFailure !== 'boolean'
  )
    throw new Error('Invalid diagnostic input.');
  options.logger.info('Controlled operation started', {
    reference: args.reference,
    simulateFailure: args.simulateFailure,
  });
  if (args.simulateFailure)
    throw new Error(
      'Intentional example failure. Start a new run with simulateFailure=false to complete the workflow.',
    );
  return { reference: args.reference, completed: true };
}
