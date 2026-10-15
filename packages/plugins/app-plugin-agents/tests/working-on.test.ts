import { afterEach, describe, expect, it } from 'vitest';
import type { RunRecord } from '../server/core/runs/run.store.js';
import { createHarness, type Harness } from './harness.js';

describe('scoped agent work', () => {
  let h: Harness;
  afterEach(() => h?.close());

  it('aggregates active pairs once, excluding queued, ended and other subjects', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const runs = h.database.connection().repository<RunRecord>('agRuns');
    for (const [index, status] of [
      'dispatched',
      'running',
      'queued',
      'completed',
      'failed',
      'cancelled',
    ].entries()) {
      const id = await h.enqueue(agentId, `subject-${index}`);
      await runs.updateOne({ filter: { id }, values: { status } });
    }
    const duplicate = await h.enqueue(agentId, 'duplicate');
    await runs.updateOne({
      filter: { id: duplicate },
      values: { subjectId: 'subject-0', status: 'running' },
    });
    const otherKind = await h.enqueue(agentId, 'different-kind');
    await runs.updateOne({
      filter: { id: otherKind },
      values: {
        subjectId: 'subject-0',
        subjectKind: 'other',
        status: 'running',
      },
    });
    expect(
      await h.services.runs.workingOn('sample', [
        'subject-0',
        'subject-1',
        'subject-2',
        'subject-3',
        'subject-4',
        'subject-5',
        'subject-0',
      ]),
    ).toEqual(
      expect.arrayContaining([
        { subjectId: 'subject-0', agentId, working: true },
        { subjectId: 'subject-1', agentId, working: true },
      ]),
    );
    expect(
      await h.services.runs.workingOn('sample', [
        'subject-0',
        'subject-1',
        'subject-2',
        'subject-3',
        'subject-4',
        'subject-5',
      ]),
    ).toHaveLength(2);
    expect(await h.services.runs.workingOn('sample', [])).toEqual([]);
    expect(await h.services.runs.workingOn('sample', ['missing'])).toEqual([]);
  });

  it('finds requested work despite more than 500 unrelated active runs', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const id = await h.enqueue(agentId, 'wanted');
    const query = h.database.connection().repository<RunRecord>('agRuns');
    await query.updateOne({ filter: { id }, values: { status: 'running' } });
    const original = await query.findOne({ filter: { id } });
    const { revision: _revision, ...copy } = original!;
    for (let offset = 0; offset < 510; offset += 30) {
      await query.createMany({
        values: Array.from({ length: 30 }, (_, index) => ({
          ...copy,
          id: `unrelated-${offset + index}`,
          subjectId: `other-${offset + index}`,
        })),
      });
    }
    expect(await h.services.runs.workingOn('sample', ['wanted'])).toEqual([
      { subjectId: 'wanted', agentId, working: true },
    ]);
  });
});
