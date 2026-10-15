// @vitest-environment node
import { expect, it } from 'vitest';

import { linkWait, statusIcon } from '../../server/agent-sessions/links.js';

it('gives each fixed status the shape the task lists draw', () => {
  expect(
    ['backlog', 'in_progress', 'blocked', 'in_review', 'done', 'cancelled'].map(
      statusIcon,
    ),
  ).toEqual(['backlog', 'started', 'blocked', 'review', 'done', 'closed']);
});

it('says a task waits for its owner to accept it or to answer it', () => {
  const owned = { ownerUserId: 'me', blockedCount: 0 };
  expect(linkWait({ ...owned, statusKey: 'in_review' }, 'me')).toBe('accept');
  expect(linkWait({ ...owned, statusKey: 'blocked' }, 'me')).toBe('answer');
  // Waiting for another task is no question for the owner.
  expect(
    linkWait({ ...owned, statusKey: 'blocked', blockedCount: 2 }, 'me'),
  ).toBeNull();
  expect(linkWait({ ...owned, statusKey: 'in_review' }, 'someone')).toBeNull();
  expect(linkWait({ ...owned, statusKey: 'in_progress' }, 'me')).toBeNull();
});
