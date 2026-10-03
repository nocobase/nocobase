import { describe, expect, it } from 'vitest';
import { MutationRecorder } from '../../../../src/repository/internal/events/recorder.js';

describe('MutationRecorder', () => {
  it('reports a row written several times once, uniting its fields', () => {
    const recorder = new MutationRecorder(true);
    recorder.record({
      collection: 'tasks',
      kind: 'created',
      key: { id: 't1' },
      fields: ['id', 'title'],
      values: { id: 't1', title: 'A' },
    });
    recorder.record({
      collection: 'tasks',
      kind: 'updated',
      key: { id: 't1' },
      fields: ['projectId'],
      values: { projectId: 'p1' },
    });
    recorder.record({
      collection: 'projects',
      kind: 'updated',
      key: { id: 1 },
      fields: ['status'],
    });
    // A key read as a string elsewhere names the same row.
    recorder.record({
      collection: 'projects',
      kind: 'updated',
      key: { id: '1' },
      fields: ['version'],
    });

    expect(recorder.changes).toEqual([
      {
        collection: 'tasks',
        kind: 'created',
        key: { id: 't1' },
        fields: ['id', 'title', 'projectId'],
        values: { id: 't1', title: 'A', projectId: 'p1' },
      },
      {
        collection: 'projects',
        kind: 'updated',
        key: { id: 1 },
        fields: ['status', 'version'],
      },
    ]);
  });

  it('drops a row created and deleted within the call, and turns an update then delete into a delete', () => {
    const recorder = new MutationRecorder(false);
    recorder.record({ collection: 'a', kind: 'created', key: { id: 1 } });
    recorder.record({ collection: 'a', kind: 'deleted', key: { id: 1 } });
    recorder.record({
      collection: 'a',
      kind: 'updated',
      key: { id: 2 },
      fields: ['x'],
      values: { x: 1 },
    });
    recorder.record({ collection: 'a', kind: 'deleted', key: { id: 2 } });

    expect(recorder.changes).toEqual([
      { collection: 'a', kind: 'deleted', key: { id: 2 } },
    ]);
  });

  it('keeps values out unless a subscription asked for them', () => {
    const recorder = new MutationRecorder(false);
    recorder.record({
      collection: 'a',
      kind: 'created',
      key: { id: 1 },
      fields: ['secret'],
      values: { secret: 'x' },
    });
    recorder.recordBulk([
      {
        collection: 'a',
        kind: 'updated',
        key: { id: 2 },
        fields: ['secret'],
        values: { secret: 'y' },
      },
    ]);

    expect(recorder.changes).toEqual([
      { collection: 'a', kind: 'created', key: { id: 1 }, fields: ['secret'] },
      { collection: 'a', kind: 'updated', key: { id: 2 }, fields: ['secret'] },
    ]);
  });

  it('merges a savepoint child only when it is absorbed', () => {
    const recorder = new MutationRecorder(false);
    recorder.record({ collection: 'a', kind: 'created', key: { id: 1 } });
    const released = recorder.child();
    released.record({ collection: 'a', kind: 'created', key: { id: 2 } });
    const rolledBack = recorder.child();
    rolledBack.record({ collection: 'a', kind: 'created', key: { id: 3 } });

    recorder.absorb(released);

    expect(recorder.changes.map((change) => change.key)).toEqual([
      { id: 1 },
      { id: 2 },
    ]);
  });
});
