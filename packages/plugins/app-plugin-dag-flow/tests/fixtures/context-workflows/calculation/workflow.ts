import { Type } from '@sinclair/typebox';
import {
  workflow,
  type ContextOf,
  defineHandler,
  createRunInstruction,
  createConditionInstruction,
  createTerminateInstruction,
} from '../../../../dsl/index.js';
import type { run as calculate } from './server/calculate.js';
import type { run as check } from './server/check.js';
import type { run as record } from './server/record.js';

const source = workflow({
  key: 'calculation',
  title: 'Context calculation',
  input: { schema: Type.Object({ amount: Type.Number() }) },
  parameters: {
    schema: Type.Object({
      rate: Type.Number({ default: 2 }),
      limit: Type.Number({ default: 10 }),
    }),
  },
});
const flow = source
  .addNode(
    createRunInstruction({ key: 'calculate', title: 'Calculate' }).run(
      defineHandler<typeof calculate>('./server/calculate'),
    ),
  )
  .addNode(
    createConditionInstruction({ key: 'check', title: 'Check' })
      .check(defineHandler<typeof check>('./server/check'))
      .branch({
        yes: [
          createRunInstruction({ key: 'record', title: 'Record' }).run(
            defineHandler<typeof record>('./server/record'),
          ),
        ],
        no: [
          createTerminateInstruction({ key: 'stop', title: 'Stop' }).outcome(),
        ],
      }),
  );
export interface FlowContext {
  input: ContextOf<typeof flow>['input'];
  parameters: ContextOf<typeof flow>['parameters'];
  nodeResults: ContextOf<typeof flow>['nodeResults'];
}
export default flow.finalize();
