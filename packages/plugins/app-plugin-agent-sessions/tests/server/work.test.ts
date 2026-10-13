import { describe, expect, it } from 'vitest';

import { workNote, workSnapshot, type WorkItem } from '../../server/work.js';

const item = (refId: string, status: string | null): WorkItem => ({
  kind: 'issue',
  refId,
  key: refId,
  title: `Issue ${refId}`,
  status,
  group: null,
});

describe('workNote', () => {
  it('says nothing of no work', () => {
    expect(workNote([], null)).toBeUndefined();
  });

  it('lists the work the agent was never told about, unmarked', () => {
    expect(workNote([item('ST-1', 'Backlog'), item('ST-2', null)], null)).toBe(
      'Work tied to this session, which the person means by "the tasks" or "the work" unless they name others:\n- #ST-1 Issue ST-1: Backlog\n- #ST-2 Issue ST-2',
    );
  });

  it('marks what is new or changed, and says nothing when nothing changed', () => {
    const told = workSnapshot([item('ST-1', 'Backlog')]);
    expect(workNote([item('ST-1', 'Backlog')], told)).toBeUndefined();
    expect(
      workNote([item('ST-1', 'Done'), item('ST-2', 'Backlog')], told),
    ).toMatch(/: Done \(was Backlog\)\n- #ST-2 Issue ST-2: Backlog \(new\)$/u);
  });
});
