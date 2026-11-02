import { expect, it } from 'vitest';

import { ConversationLinkSchema } from '../server/routes/schemas.js';

it('preserves optional target update times without requiring them on older link kinds', () => {
  const link = {
    id: 'l',
    conversationId: 'c',
    kind: 'issue',
    targetId: 'i',
    origin: 'user',
    createdAt: '2026-11-01T00:00:00Z',
    view: {
      key: 'ST-1',
      title: 'Task',
      status: 'In review',
      url: '/issues/ST-1',
    },
  };
  expect(ConversationLinkSchema.parse(link)).toEqual(link);
  const updated = {
    ...link,
    view: { ...link.view, targetUpdatedAt: '2026-11-01T01:00:00Z' },
  };
  expect(ConversationLinkSchema.parse(updated)).toEqual(updated);
  expect(
    ConversationLinkSchema.safeParse({
      ...updated,
      view: { ...updated.view, targetUpdatedAt: 42 },
    }).success,
  ).toBe(false);
});
