import { describe, expect, it } from 'vitest';
import { Type } from '@sinclair/typebox';

import {
  createConditionInstruction,
  createNode,
  createRunInstruction,
  createTerminateInstruction,
  defineHandler,
  workflow,
  type AnyWorkflowNode,
} from '../../dsl/index.js';

const handler =
  defineHandler<() => Promise<Record<string, never>>>('./runtime/handler');
const check = defineHandler<() => Promise<boolean>>('./runtime/check');

function flow(key: string = 'builder') {
  return workflow({
    key,
    title: 'Builder',
    input: { schema: Type.Object({ route: Type.String() }) },
  });
}

describe('workflow builder', () => {
  it('creates a context handler node without argument mappings or result schemas', () => {
    const withFirst = flow().addNode(
      createRunInstruction({ key: 'first' }).run(handler),
    );
    expect(withFirst.compile().nodes[0]).toMatchObject({
      key: 'first',
      config: { module: './runtime/handler' },
    });
    expect(withFirst.compile().nodes[0]).not.toHaveProperty('result');
    expect(withFirst.compile().nodes[0].config).not.toHaveProperty('args');
  });

  it('refuses to finalize a workflow whose addNode() result was discarded', () => {
    const f = flow();
    f.addNode(createRunInstruction({ key: 'dropped' }).run(handler));
    const kept = f.addNode(createRunInstruction({ key: 'kept' }).run(handler));
    // The accumulated handler contract and the compiled nodes are the same
    // list, so a discarded result would otherwise compile a workflow silently
    // missing the node — and missing every context requirement it carried.
    expect(kept).not.toBe(f);
    expect(() => f.finalize()).toThrow(/never compiled "dropped"/);
    expect(() => f.compile()).toThrow(/never compiled "dropped"/);
    expect(() => kept.finalize()).toThrow(/never compiled "dropped"/);
  });

  it('names every discarded node, including one nested in a branch', () => {
    const f = flow();
    f.addNode(
      createConditionInstruction({ key: 'route' })
        .check(check)
        .yes([createRunInstruction({ key: 'inner' }).run(handler)]),
    );
    expect(() => f.finalize()).toThrow(/"route", "inner"/);
  });

  it('finalizes normally when every claimed node is kept', () => {
    const chained = flow()
      .addNode(createRunInstruction({ key: 'first' }).run(handler))
      .addNode(
        createConditionInstruction({ key: 'route' })
          .check(check)
          .yes([createRunInstruction({ key: 'inner' }).run(handler)]),
      );
    expect(() => chained.finalize()).not.toThrow();
    expect(chained.compile().nodes.map((node) => node.key)).toEqual([
      'first',
      'route',
      'inner',
    ]);
  });

  it('accumulates chained nodes in document order', () => {
    const chained = flow()
      .addNode(createRunInstruction({ key: 'one' }).run(handler))
      .addNode(createRunInstruction({ key: 'two' }).run(handler));
    expect(chained.compile().nodes.map((node) => node.key)).toEqual([
      'one',
      'two',
    ]);
  });

  it('hands out no binding handles on the builder or its nodes', () => {
    // A handler reads upstream values from its context, so there is nothing to bind.
    const f = flow();
    expect(f).not.toHaveProperty('input');
    expect(f).not.toHaveProperty('parameters');
    expect(createRunInstruction({ key: 'n' }).run(handler)).not.toHaveProperty(
      'output',
    );
  });

  it('preserves branches and the common successor without argument bindings', () => {
    const f = flow()
      .addNode(
        createConditionInstruction({ key: 'decide' })
          .check(check)
          .branch({
            yes: [createRunInstruction({ key: 'inside' }).run(handler)],
          }),
      )
      .addNode(createRunInstruction({ key: 'after' }).run(handler));
    expect(f.compile().nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'decide', downstreamKey: 'after' }),
        expect.objectContaining({
          key: 'inside',
          upstreamKey: 'decide',
          branchKey: 'yes',
        }),
        expect.objectContaining({ key: 'after', upstreamKey: 'decide' }),
      ]),
    );
  });

  it('chains either branch order and compiles the same topology as branch()', () => {
    const yes = createRunInstruction({ key: 'yesNode' }).run(handler);
    const no = createRunInstruction({ key: 'noNode' }).run(handler);
    const condition = createConditionInstruction({ key: 'decide' }).check(
      check,
    );
    const expected = flow().addNode(condition.branch({ yes: [yes], no: [no] }));
    // Use fresh child nodes because ownership is specific to each workflow.
    const actual = flow().addNode(
      condition
        .no([createRunInstruction({ key: 'noNode' }).run(handler)])
        .yes([createRunInstruction({ key: 'yesNode' }).run(handler)]),
    );
    expect(actual.compile()).toEqual(expected.compile());
  });

  it('keeps previous nodes immutable and supports omitted and empty branches', () => {
    const condition = createConditionInstruction({ key: 'decide' }).check(
      check,
    );
    const withYes = condition.yes([
      createRunInstruction({ key: 'inside' }).run(handler),
    ]);
    const withBoth = withYes.no([]);
    const original = flow().addNode(condition);
    expect(original.compile().nodes).toHaveLength(1);
    const branched = flow().addNode(withBoth);
    expect(branched.compile().nodes).toHaveLength(2);
    expect(withYes).not.toBe(withBoth);
    expect(Object.isFrozen(withBoth)).toBe(true);
    const empty = flow().addNode(
      createConditionInstruction({ key: 'empty' }).check(check).yes([]).no([]),
    );
    expect(empty.finalize().nodes[0].branches).toBeUndefined();
  });

  it('rejects repeated declarations across dedicated and generic methods', () => {
    const condition = createConditionInstruction({ key: 'decide' }).check(
      check,
    );
    expect(() => condition.yes([]).yes([])).toThrow('already declared');
    expect(() => condition.no([]).no([])).toThrow('already declared');
    expect(() => condition.branch({ yes: [] }).yes([])).toThrow(
      'already declared',
    );
    expect(() => condition.no([]).branch({ no: [] })).toThrow(
      'already declared',
    );
  });

  it('validates dedicated branch contents and requires a check handler', () => {
    const condition = createConditionInstruction({ key: 'decide' }).check(
      check,
    );
    const invalid = [null, {}, [null], [{ key: 'fake' }], new Array(1)];
    for (const value of invalid) {
      expect(() => condition.yes(value as readonly AnyWorkflowNode[])).toThrow(
        'array of workflow nodes',
      );
      expect(() => condition.no(value as readonly AnyWorkflowNode[])).toThrow(
        'array of workflow nodes',
      );
    }
    expect(() => createConditionInstruction({ key: 'decide' }).yes([])).toThrow(
      'check module is required',
    );
    expect(() => createConditionInstruction({ key: 'decide' }).no([])).toThrow(
      'check module is required',
    );
  });

  it('leaves generic branch names to source validation', () => {
    const f = flow().addNode(
      createConditionInstruction({ key: 'decide' })
        .check(check)
        .branch({
          yes: [],
          other: [createRunInstruction({ key: 'inside' }).run(handler)],
        }),
    );
    expect(f.finalize().nodes[0].branches).toHaveProperty('other');
  });

  it('rejects adding one node to two workflows', () => {
    const node = createTerminateInstruction({ key: 'stop' }).outcome();
    flow('first').addNode(node);
    expect(() => flow('second').addNode(node)).toThrow(
      'already belongs to another workflow',
    );
  });

  it('claims nested nodes so they cannot be reused by another workflow', () => {
    const f = flow();
    const inner = createRunInstruction({ key: 'inner' }).run(handler);
    f.addNode(
      createConditionInstruction({ key: 'decide' })
        .check(check)
        .branch({ yes: [inner] }),
    );
    expect(() => flow('other').addNode(inner)).toThrow(
      'already belongs to another workflow',
    );
  });

  it('requires a check module before a condition can branch', () => {
    expect(() =>
      createConditionInstruction({ key: 'decide' }).branch({ yes: [] }),
    ).toThrow('Condition check module is required');
  });

  it('normalizes input and parameter forms into client metadata', () => {
    const f = workflow({
      key: 'forms',
      title: 'Forms',
      input: { schema: { type: 'object' }, form: './client/inputForm.tsx' },
      parameters: {
        schema: { type: 'object', properties: { limit: { type: 'number' } } },
        form: './client/parametersForm.tsx',
      },
    });
    expect(f.finalize()).toMatchObject({
      inputSchema: { type: 'object' },
      parameters: { type: 'object' },
      client: {
        inputForm: './client/inputForm.tsx',
        parameterForm: './client/parametersForm.tsx',
      },
    });
    expect(f.compile().parameters).toEqual({ limit: { type: 'number' } });
  });

  it('omits client metadata when no form is declared', () => {
    expect(flow().finalize().client).toBeUndefined();
  });

  // An application registers its own Instruction class on the server and
  // builds nodes for it with `createNode()`. The builder has no table of known
  // types, so those nodes compile exactly like the built-in ones.
  it('compiles a node type the plugin does not ship', () => {
    const approve = createNode<{ approved: boolean }>(
      'example-approval',
      { key: 'approve', title: 'Approve' },
      { approvers: ['ops'] },
      { options: { timeout: 30_000 } },
    );
    const ir = flow().addNode(approve).compile();
    expect(ir.nodes).toEqual([
      expect.objectContaining({
        key: 'approve',
        title: 'Approve',
        type: 'example-approval',
        config: { approvers: ['ops'] },
        options: { timeout: 30_000 },
        upstreamKey: null,
        downstreamKey: null,
      }),
    ]);
  });

  it('compiles a custom branching node and claims its branch children', () => {
    const inner = createRunInstruction({ key: 'inner' }).run(handler);
    const gate = createNode<null>(
      'example-gate',
      { key: 'gate' },
      { mode: 'strict' },
      { branches: { allowed: [inner] } },
    );
    const built = flow().addNode(gate);
    expect(built.compile().nodes).toEqual([
      expect.objectContaining({ key: 'gate', type: 'example-gate' }),
      expect.objectContaining({
        key: 'inner',
        upstreamKey: 'gate',
        branchKey: 'allowed',
      }),
    ]);
    expect(() => flow('other').addNode(inner)).toThrow(
      'already belongs to another workflow',
    );
  });
});
