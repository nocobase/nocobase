import { Type } from '@sinclair/typebox';
import {
  createConditionInstruction,
  createRunInstruction,
  createTerminateInstruction,
  defineHandler,
  workflow,
  type ContextOf,
} from '../../../dsl/index.js';
import type { calculate, check, nested } from './context-handlers.js';

const condition = createConditionInstruction({ key: 'decide' })
  .check(defineHandler<typeof check>('./server/check'))
  .yes([
    createRunInstruction({ key: 'yesBranch' }).run(
      defineHandler<() => string>('./server/yes'),
    ),
    createConditionInstruction({ key: 'nestedCondition' })
      .check(defineHandler<() => Promise<boolean>>('./server/nested-check'))
      .branch({
        yes: [
          createRunInstruction({ key: 'nestedResult' }).run(
            defineHandler<typeof nested>('./server/nested'),
          ),
        ],
      }),
  ])
  .no([
    createRunInstruction({ key: 'noBranch' }).run(
      defineHandler<() => number>('./server/no'),
    ),
  ]);

const flow = workflow({
  key: 'context-contract',
  title: 'Context contract',
  input: { schema: Type.Object({ amount: Type.Number() }) },
  parameters: { schema: Type.Object({ limit: Type.Number() }) },
})
  // Forward reads are allowed: results are always optional.
  .addNode(condition)
  .addNode(
    createRunInstruction({ key: 'calculate' }).run(
      defineHandler<typeof calculate>('./server/calculate'),
    ),
  )
  .addNode(
    createRunInstruction({ key: 'after' }).run(
      defineHandler<() => string>('./server/after'),
    ),
  )
  .addNode(
    createRunInstruction({ key: 'voidResult' }).run(
      defineHandler<() => void>('./server/void'),
    ),
  )
  .addNode(createTerminateInstruction({ key: 'stop' }).outcome());

// Member-level indirection keeps the handler/context cycle lazy.
export interface FlowContext {
  input: ContextOf<typeof flow>['input'];
  parameters: ContextOf<typeof flow>['parameters'];
  nodeResults: ContextOf<typeof flow>['nodeResults'];
}

flow.finalize();
flow.compile();
declare const context: FlowContext;
const key: 'decide' = condition.key;
const amount: number = context.input.amount;
const limit: number = context.parameters.limit;
const total: number | undefined = context.nodeResults.calculate?.total;
const decision: boolean | undefined = context.nodeResults.decide;
const yes: string | undefined = context.nodeResults.yesBranch;
const no: number | undefined = context.nodeResults.noBranch;
const nestedDecision: boolean | undefined = context.nodeResults.nestedCondition;
const label: string | undefined = context.nodeResults.nestedResult?.label;
const empty: null | undefined = context.nodeResults.voidResult;
void [
  key,
  amount,
  limit,
  total,
  decision,
  yes,
  no,
  nestedDecision,
  label,
  empty,
];
// @ts-expect-error Unknown node names do not fall back to an index signature.
context.nodeResults.missing;
// @ts-expect-error Termination does not contribute a readable result.
context.nodeResults.stop;
// @ts-expect-error Fields are inferred from the asynchronous handler return type.
context.nodeResults.calculate?.missing;
// @ts-expect-error A result may not exist yet, regardless of declaration order.
context.nodeResults.calculate.total;
// @ts-expect-error Results preserve their value types.
const wrong: string | undefined = context.nodeResults.calculate?.total;
void wrong;
// @ts-expect-error Results are read-only snapshots.
context.nodeResults.calculate = { total: 1 };
// @ts-expect-error Workflow input remains typed.
context.input.missing;
// @ts-expect-error Workflow parameters remain typed.
context.parameters.missing;

const invalid = flow.addNode(
  createRunInstruction({ key: 'invalid' }).run(
    defineHandler<
      (ctx: { nodeResults: { calculate: { total: number } } }) => number
    >('./server/invalid'),
  ),
);
// @ts-expect-error Even an earlier node's result cannot be required unconditionally.
invalid.finalize();
// @ts-expect-error compile must not bypass the same validation.
invalid.compile();

const wrongResult = flow.addNode(
  createRunInstruction({ key: 'wrongResult' }).run(
    defineHandler<
      (ctx: {
        nodeResults: { calculate?: { total: string } };
      }) => string | undefined
    >('./server/wrong-result'),
  ),
);
// @ts-expect-error Handler context must agree with the actual producer's return type.
wrongResult.finalize();

const unknownNode = flow.addNode(
  createRunInstruction({ key: 'unknownNode' }).run(
    defineHandler<(ctx: { nodeResults: { missing: number } }) => number>(
      './server/unknown-node',
    ),
  ),
);
// @ts-expect-error A handler cannot require results absent from the workflow.
unknownNode.finalize();
