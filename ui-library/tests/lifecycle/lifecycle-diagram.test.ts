// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { LifecycleDescription } from '@nocobase/lifecycle';
import { lifecycleDiagramGraph } from '../../registry/lifecycle/lifecycle-diagram-model.js';

const description: LifecycleDescription = {
  name: 'review',
  initial: 'draft',
  initialStates: ['draft'],
  states: ['draft', 'review', 'done'],
  stateInfo: [
    { name: 'draft', title: 'Draft', final: false, meta: {} },
    { name: 'review', title: 'Review', final: false, meta: {} },
    { name: 'done', title: 'Done', final: true, meta: {} },
  ],
  transitions: [
    {
      name: 'submit',
      title: 'Submit',
      from: ['draft'],
      to: ['review'],
      manual: true,
      effects: [],
      accept: [],
      meta: {},
    },
    {
      name: 'decide',
      title: 'Decide',
      from: ['draft', 'review'],
      to: ['review', 'done'],
      manual: true,
      effects: [],
      accept: [],
      meta: {},
    },
    {
      name: 'expire',
      title: 'Expire',
      from: ['review'],
      to: ['done'],
      manual: false,
      effects: [],
      accept: [],
      meta: {},
    },
  ],
  triggers: [],
  continuations: [],
  onEnter: {},
};

it('marks configurable states and transitions only for real parameter bindings', () => {
  const graph = lifecycleDiagramGraph({
    ...description,
    parameterConfiguration: {
      readMode: 'live',
      groups: [
        {
          key: 'review',
          title: 'Review',
          schemaVersion: 1,
          fields: {
            limit: {
              type: 'number',
              title: 'Limit',
              bindings: [{ state: 'review' }, { transition: 'submit' }],
            },
          },
        },
      ],
    },
  });
  expect(graph.nodes.find((node) => node.id === 'review')?.configurable).toBe(
    true,
  );
  expect(graph.nodes.find((node) => node.id === 'draft')?.configurable).toBe(
    false,
  );
  expect(
    graph.edges.find((edge) => edge.label === 'Submit')?.configurable,
  ).toBe(true);
  expect(
    graph.edges.find((edge) => edge.label === 'Expire')?.configurable,
  ).toBe(false);
});

describe('lifecycle diagram projection', () => {
  it('preserves all source/destination pairs, self-transitions and parallel transitions', () => {
    const graph = lifecycleDiagramGraph(description, {
      currentState: 'review',
      availableTransitions: ['decide'],
    });
    expect(graph.edges).toHaveLength(6);
    expect(new Set(graph.edges.map((edge) => edge.id)).size).toBe(6);
    expect(
      graph.edges.some(
        (edge) => edge.source === 'review' && edge.target === 'review',
      ),
    ).toBe(true);
    expect(
      graph.edges.filter((edge) => edge.highlighted).map((edge) => edge.source),
    ).toEqual(['review', 'review']);
    expect(
      graph.nodes.filter((node) => node.highlighted).map((node) => node.id),
    ).toEqual(['review']);
    expect(
      graph.edges.find((edge) => edge.label === 'Expire')?.dashed,
    ).toBeUndefined();
  });

  it('highlights only the exact historical path and explicit final endings', () => {
    const graph = lifecycleDiagramGraph(description, {
      currentState: 'done',
      history: [
        { transition: '$create', from: null, to: 'draft' },
        { transition: 'submit', from: 'draft', to: 'review' },
        { transition: 'decide', from: 'review', to: 'done' },
      ],
      endLabel: 'End',
    });
    expect(
      graph.edges
        .filter((edge) => edge.visited && !edge.decorative)
        .map((edge) => edge.id),
    ).toEqual([
      JSON.stringify(['submit', 'draft', 'review']),
      JSON.stringify(['decide', 'review', 'done']),
    ]);
    expect(graph.edges.find((edge) => edge.label === 'Expire')?.visited).toBe(
      false,
    );
    expect(
      graph.nodes
        .filter((node) => node.visited && !node.decorative)
        .map((node) => node.id),
    ).toEqual(['draft', 'review', 'done']);
    expect(graph.nodes.filter((node) => node.decorative)).toEqual([
      expect.objectContaining({ label: '◎ End', visited: true }),
    ]);
    expect(graph.edges.filter((edge) => edge.decorative)).toEqual([
      expect.objectContaining({ source: 'done', visited: true }),
    ]);
    expect(
      lifecycleDiagramGraph(
        { ...description, transitions: [] },
        { endLabel: 'End' },
      ).nodes.filter((node) => node.decorative),
    ).toHaveLength(1);
    expect(
      lifecycleDiagramGraph(description, {
        visitedStates: ['draft', 'review'],
      }).edges.some((edge) => edge.visited),
    ).toBe(false);
  });

  it('translates labels without changing identity or inferring visited paths', () => {
    const graph = lifecycleDiagramGraph(description, {
      currentState: 'done',
      stateLabel: (state) => `state.${state.name}`,
      transitionLabel: (transition) => `transition.${transition.name}`,
    });
    expect(graph.nodes[0]).toMatchObject({
      id: 'draft',
      label: 'state.draft',
      highlighted: false,
    });
    expect(graph.edges[0]).toMatchObject({
      label: 'transition.submit',
      highlighted: false,
    });
    expect(graph.edges.every((edge) => !edge.highlighted)).toBe(true);
  });
});
