import { describe, expect, it } from 'vitest';

import { createReference, type ReferenceOwner } from '../../dsl/expressions.js';
import {
  lowerBindingObject,
  lowerBindings,
  type LoweringScope,
} from '../../dsl/lowering.js';

const identity = Object.freeze({});
const owner: ReferenceOwner = { identity };
const scope: LoweringScope = {
  identity,
  availableNodes: new Set(['initialize']),
};

describe('lowering bindings', () => {
  it('lowers every namespace to the template the value resolver reads', () => {
    const input = createReference<{ route: string }>(owner, {
      namespace: 'input',
      path: [],
    });
    const parameters = createReference<{ limit: number }>(owner, {
      namespace: 'parameters',
      path: [],
    });
    const output = createReference<{ amount: number }>(owner, {
      namespace: 'output',
      nodeKey: 'initialize',
      path: [],
    });
    expect(
      lowerBindings(
        {
          route: input.route,
          limit: parameters.limit,
          amount: output.amount,
          whole: output,
          nested: [input.route, true, 4, null],
        },
        scope,
      ),
    ).toEqual({
      route: '{{$input.route}}',
      limit: '{{$parameters.limit}}',
      amount: '{{$nodeResults.initialize.amount}}',
      whole: '{{$nodeResults.initialize}}',
      nested: ['{{$input.route}}', true, 4, null],
    });
  });

  it('rejects a reference that belongs to another workflow', () => {
    const foreign = createReference<string>(
      { identity: Object.freeze({}) },
      { namespace: 'input', path: ['name'] },
    );
    expect(() => lowerBindings(foreign, scope)).toThrow(
      'belongs to a different workflow',
    );
  });

  it('rejects a node that was never added to a workflow', () => {
    const detached = createReference<string>(
      { identity: null },
      { namespace: 'output', nodeKey: 'orphan', path: [] },
    );
    expect(() => lowerBindings(detached, scope)).toThrow('never added');
  });

  it('rejects a result that is not available at this position', () => {
    const future = createReference<string>(owner, {
      namespace: 'output',
      nodeKey: 'later',
      path: [],
    });
    expect(() => lowerBindings({ value: future }, scope)).toThrow(
      'no result available at this position',
    );
  });

  it('rejects a nested parameter reference, which the resolver cannot read', () => {
    const parameters = createReference<{ nested: { deep: string } }>(owner, {
      namespace: 'parameters',
      path: [],
    });
    expect(() => lowerBindings(parameters.nested.deep, scope)).toThrow(
      'exactly one declared parameter',
    );
  });

  it('rejects a hand-written template so it cannot skip the checks above', () => {
    expect(() => lowerBindings({ literal: '{{$input.name}}' }, scope)).toThrow(
      'template-looking string',
    );
    expect(lowerBindings({ plain: 'a { b } c' }, scope)).toEqual({
      plain: 'a { b } c',
    });
  });

  it('rejects values JSON cannot carry, naming where they were found', () => {
    expect(() => lowerBindings({ when: new Date() }, scope)).toThrow(
      'args.when must be a plain object',
    );
    expect(() => lowerBindings({ run: () => 1 }, scope)).toThrow(
      'args.run cannot hold a function value',
    );
    expect(() => lowerBindings({ nan: Number.NaN }, scope)).toThrow(
      'args.nan must be a finite number',
    );
  });

  it('requires an object where the caller asked for one', () => {
    expect(lowerBindingObject({ a: 1 }, scope, 'config.args')).toEqual({
      a: 1,
    });
    expect(() =>
      lowerBindingObject(
        [] as unknown as Record<string, unknown>,
        scope,
        'config.args',
      ),
    ).toThrow('config.args must be an object');
  });
});
