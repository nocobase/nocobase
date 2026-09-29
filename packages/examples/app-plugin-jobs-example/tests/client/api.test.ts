import { describe, expect, it } from 'vitest';

import { mergeJobTask, type JobTask } from '../../client/lib/api.js';

function task(overrides: Partial<JobTask>): JobTask {
  return {
    jobId: 'a',
    status: 'queued',
    progress: 0,
    attempt: 0,
    createdAt: '2030-01-01T00:00:00.000Z',
    updatedAt: '2030-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('mergeJobTask', () => {
  it('adds a new task newest first', () => {
    const older = task({ jobId: 'a' });
    const newer = task({
      jobId: 'b',
      createdAt: '2030-01-01T00:00:01.000Z',
    });
    expect(mergeJobTask([older], newer)).toEqual([newer, older]);
  });

  it('keeps the later version whichever arrives last', () => {
    const running = task({
      status: 'running',
      progress: 30,
      updatedAt: '2030-01-01T00:00:03.000Z',
    });
    // A create response that lost the race to a pushed update.
    const stale = task({});
    expect(mergeJobTask([running], stale)).toEqual([running]);
    const done = task({
      status: 'completed',
      progress: 100,
      updatedAt: '2030-01-01T00:00:10.000Z',
    });
    expect(mergeJobTask([running], done)).toEqual([done]);
  });
});
