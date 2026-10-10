import { describe, expect, it } from 'vitest';

import flow from './fixtures/instruction-coverage/workflow.js';

describe('instruction coverage fixture', () => {
  it('compiles every current node type into one flat block order', () => {
    const ir = flow.compile();
    expect(ir.nodes.map((node) => node.type)).toEqual([
      'run',
      'condition',
      'terminate',
      'run',
    ]);
    expect(ir.nodes.filter((node) => node.branchKey === 'yes')).toHaveLength(1);
    expect(ir.nodes.find((node) => node.key === 'stop')).toMatchObject({
      config: { outcome: 'success' },
      upstreamKey: 'route',
      branchKey: 'no',
    });
  });

  it('serializes handler modules without node input mappings or result schemas', () => {
    for (const node of flow
      .compile()
      .nodes.filter((node) => node.type === 'run')) {
      expect(Object.keys(node.config)).toEqual(['module']);
      expect(node).not.toHaveProperty('result');
    }
  });

  it('names a static module for the condition instead of an expression', () => {
    const ir = flow.compile();
    expect(ir.nodes.find((node) => node.key === 'route')?.config).toEqual({
      module: './runtime/check',
    });
  });

  it('lowers the authored parameter schema to the runtime declaration map', () => {
    expect(flow.compile().parameters).toEqual({ limit: { type: 'number' } });
  });

  it('keeps the finalized definition JSON-serializable', () => {
    expect(JSON.parse(JSON.stringify(flow.finalize()))).toEqual(
      flow.finalize(),
    );
  });
});
