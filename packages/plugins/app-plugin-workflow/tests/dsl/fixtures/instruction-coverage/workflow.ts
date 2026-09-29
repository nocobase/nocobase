import { Type } from '@sinclair/typebox';

import {
  createConditionInstruction,
  createRunInstruction,
  createTerminateInstruction,
  defineHandler,
  workflow,
} from '../../../../dsl/index.js';

const inputSchema = Type.Object({ route: Type.String() });
const parametersSchema = Type.Object({ limit: Type.Number() });

/** Type contracts for the runtime modules supplied by the engine fixture. */
const initializeHandler = defineHandler<
  () => Promise<{ recorded: boolean; route: string }>
>('./runtime/initialize');
const checkHandler = defineHandler<() => Promise<boolean>>('./runtime/check');
const recordHandler =
  defineHandler<() => Promise<{ recorded: boolean }>>('./runtime/record');

const source = workflow({
  key: 'instruction-coverage',
  title: 'Instruction coverage',
  input: { schema: inputSchema },
  parameters: { schema: parametersSchema },
});

export const flow = source
  .addNode(
    createRunInstruction({ key: 'initialize', title: 'Initialize' }).run(
      initializeHandler,
    ),
  )
  .addNode(
    createConditionInstruction({ key: 'route', title: 'Choose route' })
      .check(checkHandler)
      .yes([
        createRunInstruction({ key: 'record', title: 'Record coverage' }).run(
          recordHandler,
        ),
      ])
      .no([createTerminateInstruction({ key: 'stop' }).outcome('success')]),
  );

export default flow;
