import {
  createRunInstruction,
  defineHandler,
  workflow,
  type WorkflowSourceAst,
  type ContextOf,
} from '@nocobase/app-plugin-workflow/dsl';

import type { run as waitFiveSeconds } from './server/wait-five-seconds.js';

const waitFiveSecondsHandler = defineHandler<typeof waitFiveSeconds>(
  './server/wait-five-seconds',
);

const source = workflow({
  key: 'scheduled-test-workflow',
  title: 'Scheduled test workflow',
  description:
    'A test workflow invoked by the five-minute scheduled task; it waits five seconds before completing.',
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
});

const flow = source.addNode(
  createRunInstruction({
    key: 'waitFiveSeconds',
    title: 'Wait five seconds',
  }).run(waitFiveSecondsHandler),
);

// Keep member-level indirection so handler signatures can refer to this workflow.
export interface FlowContext {
  input: ContextOf<typeof flow>['input'];
  parameters: ContextOf<typeof flow>['parameters'];
  nodeResults: ContextOf<typeof flow>['nodeResults'];
}

const definition: WorkflowSourceAst = flow.finalize();
export default definition;
