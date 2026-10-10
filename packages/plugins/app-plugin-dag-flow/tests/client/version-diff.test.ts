import { describe, expect, it } from 'vitest';
import {
  compareVersions,
  diffFields,
} from '../../client/workflow-management/version-diff.js';
import { node, version } from './version-fixtures.js';
describe('workflow definition comparison', () => {
  it('matches stable node keys and ignores database identity, runtime state, and object property order', () => {
    const before = version({
      nodes: [node('task', { config: { a: 1, b: 2 } })],
    });
    const after = version({
      id: 'new',
      enabled: true,
      executed: 12,
      parameterValues: { secret: 'runtime' },
      nodes: [node('task', { id: 'new-node', config: { b: 2, a: 1 } })],
    });
    expect(compareVersions(before, after)).toMatchObject({
      fields: [],
      nodes: [{ status: 'unchanged', connectionsChanged: false, fields: [] }],
    });
  });
  it('reports nested configuration, connection, and workflow schema changes', () => {
    const diff = compareVersions(
      version(),
      version({
        nodes: [
          node('task', { config: { retry: { limit: 3 } }, branchKey: 'yes' }),
        ],
        inputSchema: { required: ['name'] },
      }),
    );
    expect(diff.nodes[0]).toMatchObject({
      status: 'changed',
      connectionsChanged: false,
      fields: [
        { path: '/branchKey', before: null, after: 'yes' },
        { path: '/config/retry', before: undefined, after: { limit: 3 } },
      ],
    });
    expect(diff.fields).toEqual([
      { path: '/inputSchema/required', before: undefined, after: ['name'] },
    ]);
  });
  it('does not mark the predecessor changed when inserting a downstream node', () => {
    const before = version({ nodes: [node('task')] });
    const after = version({
      nodes: [
        node('task', { downstreamKey: 'inserted' }),
        node('inserted', { upstreamKey: 'task' }),
      ],
    });
    const result = compareVersions(before, after);
    expect(result.nodes[0]).toMatchObject({
      status: 'unchanged',
      connectionsChanged: false,
      fields: [{ path: '/downstreamKey', before: null, after: 'inserted' }],
    });
    expect(result.nodes[1].status).toBe('added');
    expect(compareVersions(after, before).nodes[0].status).toBe('unchanged');
  });
  it('still marks configuration changes when downstream also changes', () => {
    const result = compareVersions(
      version(),
      version({
        nodes: [node('task', { downstreamKey: 'next', config: { limit: 2 } })],
      }),
    );
    expect(result.nodes[0].status).toBe('changed');
  });
  it('ignores an inserted upstream chain and symmetrically ignores its deletion', () => {
    const before = version({
      nodes: [
        node('start', { downstreamKey: 'task' }),
        node('task', { upstreamKey: 'start' }),
      ],
    });
    const after = version({
      nodes: [
        node('start', { downstreamKey: 'new1' }),
        node('new1', { upstreamKey: 'start', downstreamKey: 'new2' }),
        node('new2', { upstreamKey: 'new1', downstreamKey: 'task' }),
        node('task', { upstreamKey: 'new2' }),
      ],
    });
    for (const [left, right] of [
      [before, after],
      [after, before],
    ]) {
      const task = compareVersions(left, right).nodes.find(
        (item) => item.key === 'task',
      );
      expect(task).toMatchObject({
        status: 'unchanged',
        connectionsChanged: false,
      });
      expect(task?.fields).toEqual([
        expect.objectContaining({ path: '/upstreamKey' }),
      ]);
    }
  });
  it('ignores insertion before a root but retains a simultaneous config change', () => {
    const after = version({
      nodes: [node('new'), node('task', { upstreamKey: 'new' })],
    });
    expect(
      compareVersions(version(), after).nodes.find(
        (item) => item.key === 'task',
      ),
    ).toMatchObject({ status: 'unchanged', connectionsChanged: false });
    after.nodes[1].config = { limit: 3 };
    expect(
      compareVersions(version(), after).nodes.find(
        (item) => item.key === 'task',
      ),
    ).toMatchObject({ status: 'changed', connectionsChanged: false });
  });
  it('detects a move to a different common ancestor even through a new node', () => {
    const before = version({
      nodes: [node('a'), node('b'), node('task', { upstreamKey: 'a' })],
    });
    const after = version({
      nodes: [
        node('a'),
        node('b'),
        node('new', { upstreamKey: 'b' }),
        node('task', { upstreamKey: 'new' }),
      ],
    });
    expect(
      compareVersions(before, after).nodes.find((item) => item.key === 'task'),
    ).toMatchObject({ status: 'changed', connectionsChanged: true });
  });
  it('terminates when a malformed inserted upstream chain cycles', () => {
    const after = version({
      nodes: [
        node('x', { upstreamKey: 'y' }),
        node('y', { upstreamKey: 'x' }),
        node('task', { upstreamKey: 'x' }),
      ],
    });
    expect(
      compareVersions(version(), after).nodes.find(
        (item) => item.key === 'task',
      )?.connectionsChanged,
    ).toBe(true);
  });
  it.each([
    ['previous', 'next', true],
    [null, 'next', true],
    ['previous', null, true],
    ['previous', 'previous', false],
  ] as const)(
    'marks upstream changes from %s to %s',
    (before, after, expected) => {
      const result = compareVersions(
        version({
          nodes: [
            node('task', {
              upstreamKey: before,
              downstreamKey: 'old-next',
              branchKey: 'yes',
            }),
          ],
        }),
        version({
          nodes: [
            node('task', {
              upstreamKey: after,
              downstreamKey: 'new-next',
              branchKey: 'no',
            }),
          ],
        }),
      );
      expect(result.nodes[0].connectionsChanged).toBe(expected);
      expect(result.nodes[0].fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: '/downstreamKey' }),
          expect.objectContaining({ path: '/branchKey' }),
        ]),
      );
    },
  );
  it('reports additions and removals and reverses their meaning when swapped', () => {
    const before = version({ nodes: [node('removed')] }),
      after = version({ nodes: [node('added')] });
    expect(
      compareVersions(before, after).nodes.map((n) => [n.key, n.status]),
    ).toEqual([
      ['removed', 'removed'],
      ['added', 'added'],
    ]);
    expect(
      compareVersions(after, before).nodes.map((n) => [n.key, n.status]),
    ).toEqual([
      ['added', 'removed'],
      ['removed', 'added'],
    ]);
  });
  it('distinguishes null, missing values, ordered arrays, and ambiguous field paths', () => {
    expect(
      diffFields(
        { 'a/b': null, list: [1, 2], '~key': {} },
        { list: [2, 1], '~key': [] },
      ),
    ).toEqual([
      { path: '/a~1b', before: null, after: undefined },
      { path: '/list/0', before: 1, after: 2 },
      { path: '/list/1', before: 2, after: 1 },
      { path: '/~0key', before: {}, after: [] },
    ]);
  });
});
