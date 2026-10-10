import { expect, it } from 'vitest';

import {
  createConditionInstruction,
  createRunInstruction,
  defineHandler,
  workflow,
} from '../../dsl/index.js';
import type { WorkflowSourceAst } from '../../dsl/definition.js';

it('creates immutable descriptors without a runtime implementation or type metadata', () => {
  type Run = () => boolean;
  const first = defineHandler<Run>('./server/check.js');
  const second = defineHandler<Run>('./server/check');

  expect(first).not.toBe(second);
  expect(Object.keys(first)).toEqual(['module']);
  expect(Object.getOwnPropertySymbols(first)).toHaveLength(1);
  expect(first).not.toHaveProperty('handler');
  expect(first.module).toBe('./server/check');
  expect(second.module).toBe('./server/check');
  expect(Object.isFrozen(first)).toBe(true);
});

it('keeps shared handler references independent and serializes only their module paths', () => {
  type Run = () => boolean;
  const first = defineHandler<Run>('./server/first');
  const second = defineHandler<Run>('./server/second');
  const flow = workflow({ key: 'shared', title: 'Shared handler' })
    .addNode(createRunInstruction({ key: 'first' }).run(first))
    .addNode(
      createConditionInstruction({ key: 'second' }).check(second).branch({}),
    );

  const serialized = JSON.parse(
    JSON.stringify(flow.finalize()),
  ) as WorkflowSourceAst;
  expect(serialized.nodes.map((node) => node.config)).toEqual([
    { module: './server/first' },
    { module: './server/second' },
  ]);
});
