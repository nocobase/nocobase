import {
  createRunInstruction,
  defineHandler,
  workflow,
  type WorkflowSourceAst,
  type ContextOf,
} from '@nocobase/app-plugin-workflow/dsl';

import type { run as execute } from './server/execute.js';
import type { run as finish } from './server/finish.js';
import type { run as prepare } from './server/prepare.js';

const prepareHandler = defineHandler<typeof prepare>('./server/prepare');
const executeHandler = defineHandler<typeof execute>('./server/execute');
const finishHandler = defineHandler<typeof finish>('./server/finish');

const source = workflow({
  key: 'example-failure-diagnostics',
  title: 'Example: Failure diagnostics',
  description:
    'Run with simulateFailure=true to inspect a deliberate error, then start a new run with false. No external side effects.',
  inputSchema: {
    type: 'object',
    required: ['reference', 'simulateFailure'],
    properties: {
      reference: {
        type: 'string',
        title: 'Reference (try DIAG-100)',
        minLength: 1,
        maxLength: 64,
      },
      simulateFailure: { type: 'boolean', title: 'Simulate a failure' },
    },
    additionalProperties: false,
  },
});

const flow = source
  .addNode(
    createRunInstruction({
      key: 'prepare',
      title: 'Prepare diagnostic input',
    }).run(prepareHandler),
  )
  .addNode(
    createRunInstruction({
      key: 'execute',
      title: 'Execute controlled operation',
    }).run(executeHandler),
  )
  .addNode(
    createRunInstruction({
      key: 'finish',
      title: 'Record successful completion',
    }).run(finishHandler),
  );

// Keep member-level indirection so handler signatures can refer to this workflow.
export interface FlowContext {
  input: ContextOf<typeof flow>['input'];
  parameters: ContextOf<typeof flow>['parameters'];
  nodeResults: ContextOf<typeof flow>['nodeResults'];
}

const definition: WorkflowSourceAst = flow.finalize();
export default definition;
