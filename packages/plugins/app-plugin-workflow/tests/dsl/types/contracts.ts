/**
 * Type-level contract for the typed DSL.
 *
 * Nothing here runs. `tsc -p tests/dsl/types/tsconfig.json` is the assertion:
 * every `@ts-expect-error` must be a real error, so a widened type fails the
 * package `typecheck` script rather than silently accepting a wrong binding.
 */

import { Type, type Static } from '@sinclair/typebox';

import {
  createRunInstruction,
  createConditionInstruction,
  defineHandler,
  workflow,
} from '../../../dsl/index.js';

const inputSchema = Type.Object({
  amount: Type.Number(),
  comment: Type.Optional(Type.String()),
  route: Type.Union([Type.Literal('yes'), Type.Literal('no')]),
  values: Type.Array(Type.Number()),
});
type Input = Static<typeof inputSchema>;

const minimal: Input = { amount: 1, route: 'yes', values: [] };
const complete: Input = { ...minimal, comment: 'ok' };
void complete;
// @ts-expect-error amount is required
const missing: Input = { route: 'no', values: [] };
void missing;
// @ts-expect-error optional does not widen to any type
const invalid: Input = { ...minimal, comment: 42 };
void invalid;
// @ts-expect-error the enum is closed
const unknownRoute: Input = { ...minimal, route: 'maybe' };
void unknownRoute;

const flow = workflow({
  key: 'contracts',
  title: 'Contracts',
  input: { schema: inputSchema },
  parameters: { schema: Type.Object({ limit: Type.Number() }) },
});

// A handler reads the invocation through its context, so the builder hands out no
// binding handles. Keeping them would offer a typed value with nowhere to put it.
// @ts-expect-error the builder exposes no input reference
flow.input;
// @ts-expect-error the builder exposes no parameter reference
flow.parameters;

const handler =
  defineHandler<() => Promise<{ total: number; label: string }>>(
    './runtime/handler',
  );

// Descriptors retain the original function type and must be explicit at builder boundaries.
const original = (): boolean => true;
const descriptor = defineHandler<typeof original>('./runtime/check');
// @ts-expect-error descriptors carry no callable implementation
descriptor.handler;
// @ts-expect-error a node hands out no output reference
createRunInstruction({ key: 'typed' }).run(descriptor).output;
// @ts-expect-error raw functions are not module descriptors
createRunInstruction({ key: 'raw' }).run(original);
// @ts-expect-error conditions also require an explicit module descriptor
createConditionInstruction({ key: 'raw-check' }).check(original);

const computed = createRunInstruction({ key: 'computed' }).run(handler);
flow.addNode(computed).finalize();

// @ts-expect-error a handler's result reaches the workflow through context.nodeResults
computed.output;

// Node input/output definitions are not authoring APIs.
// @ts-expect-error handlers consume context without node-level argument mappings
createRunInstruction({ key: 'mapped' }).input({ amount: 1 });
// @ts-expect-error handler return types replace node-level output schemas
createRunInstruction({ key: 'schema' }).output(Type.Number());

// A workflow written against a raw JSON Schema still builds; it just carries the
// generic context surfaces rather than typed ones.
const rawFlow = workflow({
  key: 'raw',
  title: 'Raw',
  inputSchema: { type: 'object', properties: { name: { type: 'string' } } },
});
rawFlow.addNode(createRunInstruction({ key: 'any' }).run(handler)).finalize();

// Context requirements and results come from handler signatures, never node schemas.
const contextual = defineHandler<
  ({
    input,
    parameters,
  }: {
    input: { amount: number };
    parameters: { limit: number };
  }) => Promise<{ total: number }>
>('./runtime/contextual');
const inferred = createRunInstruction({ key: 'contextual' }).run(contextual);
flow.addNode(inferred).finalize();

const wrongInput = createRunInstruction({ key: 'wrongInput' }).run(
  defineHandler<({ input }: { input: { amount: string } }) => string>(
    './runtime/wrong-input',
  ),
);
// @ts-expect-error workflow input.amount is number, not string
flow.addNode(wrongInput).finalize();
const missingInput = createRunInstruction({ key: 'missingInput' }).run(
  defineHandler<({ input }: { input: { absent: number } }) => number>(
    './runtime/missing-input',
  ),
);
// @ts-expect-error the workflow does not provide the required input property
flow.addNode(missingInput).finalize();
const wrongParameter = createRunInstruction({ key: 'wrongParameter' }).run(
  defineHandler<({ parameters }: { parameters: { limit: string } }) => string>(
    './runtime/wrong-parameter',
  ),
);
// @ts-expect-error workflow parameters.limit is number
flow.addNode(wrongParameter).finalize();
const nonBoolean = defineHandler<() => number>('./runtime/not-boolean');
// @ts-expect-error condition handlers must return boolean, including asynchronous results
createConditionInstruction({ key: 'invalidCondition' }).check(nonBoolean);
const asyncNonBoolean = defineHandler<() => Promise<number>>(
  './runtime/not-boolean-async',
);
createConditionInstruction({ key: 'invalidAsyncCondition' }).check(
  // @ts-expect-error asynchronous conditions must also resolve to boolean
  asyncNonBoolean,
);
const wrongCondition = createConditionInstruction({ key: 'wrongCondition' })
  .check(
    defineHandler<({ input }: { input: { amount: string } }) => boolean>(
      './runtime/wrong-condition',
    ),
  )
  .branch({});
// @ts-expect-error condition context requirements are also preserved
flow.addNode(wrongCondition).finalize();

const nestedMismatch = createConditionInstruction({ key: 'nestedMismatch' })
  .check(defineHandler<() => boolean>('./runtime/true'))
  .branch({ yes: [wrongInput] });
// @ts-expect-error nested branch handlers must also accept the workflow context
flow.addNode(nestedMismatch).finalize();

const dedicatedCondition = createConditionInstruction({
  key: 'dedicated',
}).check(defineHandler<() => boolean>('./runtime/true'));
flow.addNode(dedicatedCondition);
flow.addNode(dedicatedCondition.yes([]).no([]));
// @ts-expect-error dedicated branches require workflow nodes
dedicatedCondition.yes([{}]);
// @ts-expect-error dedicated branches require an array
dedicatedCondition.no({});
const yesMismatch = dedicatedCondition.yes([wrongInput]).no([]);
// @ts-expect-error yes context requirements survive subsequent no calls
flow.addNode(yesMismatch).finalize();
const noMismatch = dedicatedCondition.no([wrongParameter]).yes([]);
// @ts-expect-error no context requirements survive subsequent yes calls
flow.addNode(noMismatch).finalize();
const mixedMismatch = dedicatedCondition.branch({ yes: [wrongInput] }).no([]);
// @ts-expect-error generic branch context requirements survive dedicated calls
flow.addNode(mixedMismatch).finalize();
const checkMismatch = wrongCondition.yes([]).no([]);
// @ts-expect-error check handler requirements survive dedicated calls
flow.addNode(checkMismatch).finalize();
