import { describe, expect, it } from 'vitest';
import {
  compileToFlatIr,
  createNodeExpression,
  defineWorkflow,
  restoreFromFlatIr,
} from '../dsl/definition.js';
import type {
  NodeExpression,
  WorkflowNodeSourceInput,
} from '../server/instructions/types.js';

class LeafInstruction {
  static readonly type: 'leaf' = 'leaf';
  static readonly branches: null = null;
  static create(
    source: WorkflowNodeSourceInput<{ value: string }>,
  ): NodeExpression {
    return createNodeExpression(LeafInstruction, source);
  }
}
class BranchInstruction {
  static readonly type: 'branch' = 'branch';
  static readonly branches: readonly ['yes', 'no'] = ['yes', 'no'];
  static create(
    source: WorkflowNodeSourceInput<{ enabled: boolean }>,
  ): NodeExpression<'yes' | 'no'> {
    return createNodeExpression(BranchInstruction, source);
  }
}
const leaf: typeof LeafInstruction.create =
  LeafInstruction.create.bind(LeafInstruction);
const branch: typeof BranchInstruction.create =
  BranchInstruction.create.bind(BranchInstruction);

describe('workflow source authoring', () => {
  it('builds an immutable canonical AST and omits empty branches', () => {
    const original = branch({ key: 'choose', config: { enabled: true } });
    const expression = original.branch({
      no: [],
      yes: [leaf({ key: 'inside', config: { value: 'branch' } })],
    });
    const ast = defineWorkflow({
      title: 'Example',
      nodes: [expression, leaf({ key: 'after', config: { value: 'common' } })],
    });
    expect(Object.hasOwn(original, 'branches')).toBe(false);
    expect(ast.nodes[0].branches).toEqual({
      yes: [{ key: 'inside', type: 'leaf', config: { value: 'branch' } }],
    });
  });

  it('compiles tree blocks to deterministic flat IR without mutating the AST', () => {
    const ast = defineWorkflow({
      title: 'Example',
      nodes: [
        branch({ key: 'choose', config: { enabled: true } }).branch({
          yes: [leaf({ key: 'inside', config: { value: 'x' } })],
        }),
        leaf({ key: 'after', config: { value: 'y' } }),
      ],
    });
    const before = JSON.stringify(ast);
    expect(compileToFlatIr(ast).nodes).toEqual([
      {
        key: 'choose',
        type: 'branch',
        config: { enabled: true },
        upstreamKey: null,
        downstreamKey: 'after',
        branchKey: null,
      },
      {
        key: 'inside',
        type: 'leaf',
        config: { value: 'x' },
        upstreamKey: 'choose',
        downstreamKey: null,
        branchKey: 'yes',
      },
      {
        key: 'after',
        type: 'leaf',
        config: { value: 'y' },
        upstreamKey: 'choose',
        downstreamKey: null,
        branchKey: null,
      },
    ]);
    expect(JSON.stringify(ast)).toBe(before);
    expect(restoreFromFlatIr(compileToFlatIr(ast))).toEqual(ast);
  });

  it.each([new Date(), new Map(), { bad: () => true }])(
    'rejects non-JSON config %#',
    (bad) => {
      expect(() =>
        defineWorkflow({
          title: 'Bad',
          nodes: [leaf({ key: 'bad', config: { value: bad } as never })],
        }),
      ).toThrow(/JSON-compatible|class instances/);
    },
  );

  it('rejects duplicate keys while compiling', () => {
    const ast = defineWorkflow({
      title: 'Bad',
      nodes: [
        leaf({ key: 'same', config: { value: 'a' } }),
        leaf({ key: 'same', config: { value: 'b' } }),
      ],
    });
    expect(() => compileToFlatIr(ast)).toThrow('Duplicate workflow node key');
  });

  it('preserves node options through AST and flat IR', () => {
    const ast = defineWorkflow({
      title: 'Timeout slot',
      nodes: [
        leaf({
          key: 'limited',
          config: { value: 'x' },
          options: { timeout: 30_000 },
        }),
      ],
    });
    expect(ast.nodes[0].options).toEqual({ timeout: 30_000 });
    expect(compileToFlatIr(ast).nodes[0].options).toEqual({ timeout: 30_000 });
    expect(restoreFromFlatIr(compileToFlatIr(ast))).toEqual(ast);
  });

  it('preserves an explicit result schema through AST and flat IR restoration', () => {
    const ast = defineWorkflow({
      title: 'Result',
      nodes: [
        leaf({
          key: 'value',
          result: { type: 'string', description: 'A value' },
          config: { value: 'x' },
        }),
      ],
    });
    expect(ast.nodes[0].result).toEqual({
      type: 'string',
      description: 'A value',
    });
    expect(restoreFromFlatIr(compileToFlatIr(ast))).toEqual(ast);
  });

  it.each([0, -1, Number.POSITIVE_INFINITY])(
    'rejects invalid node timeout %s',
    (timeout) => {
      expect(() =>
        defineWorkflow({
          title: 'Invalid timeout',
          nodes: [
            leaf({
              key: 'limited',
              config: { value: 'x' },
              options: { timeout },
            }),
          ],
        }),
      ).toThrow('timeout must be a finite positive number');
    },
  );
});
