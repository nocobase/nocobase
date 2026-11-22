import { expect, it, vi } from 'vitest';

import { WebPushChannel } from '../../server/channel.js';
import { webPushServiceToken } from '../../server/tokens.js';

function channel(ready = true) {
  const forUsers = vi.fn(async (userIds: readonly string[]) =>
    [
      { id: 'phone', userId: 'alice' },
      { id: 'laptop', userId: 'alice' },
      { id: 'tablet', userId: 'carol' },
    ].filter((row) => userIds.includes(row.userId)),
  );
  const service = { subscriptions: { ready, forUsers } };
  const context = {
    container: {
      resolve: (token: unknown) => {
        expect(token).toBe(webPushServiceToken);
        return service;
      },
    },
  };
  return { push: new WebPushChannel(context as never), forUsers };
}

it('resolves each user to their enabled devices in one lookup', async () => {
  const { push, forUsers } = channel();
  const found = await push.resolveUsers(['alice', 'bob', 'carol']);
  expect(Object.fromEntries(found)).toEqual({
    alice: [
      { id: 'phone', userId: 'alice' },
      { id: 'laptop', userId: 'alice' },
    ],
    carol: [{ id: 'tablet', userId: 'carol' }],
  });
  expect(forUsers).toHaveBeenCalledOnce();
});

it('reaches nobody while its keys are not ready', async () => {
  const { push, forUsers } = channel(false);
  expect((await push.resolveUsers(['alice'])).size).toBe(0);
  expect(forUsers).not.toHaveBeenCalled();
});

it('composes a push that opens the route, or the home page for an external link', () => {
  const { push } = channel();
  const device = { id: 'phone', userId: 'alice' };
  const base = {
    kind: 'approval.requested',
    category: 'approvals',
    title: 'Approve budget',
    body: 'Alice asks',
    key: 'request-1',
  };
  expect(
    push.compose({ ...base, target: { type: 'route', path: '/approvals/1' } }, [
      device,
    ]),
  ).toEqual({
    to: [device],
    title: 'Approve budget',
    body: 'Alice asks',
    url: '/approvals/1',
    dedupeKey: 'approval.requested:request-1',
  });
  expect(
    push.compose(
      { ...base, target: { type: 'url', url: 'https://example.com/x' } },
      [device],
    ).url,
  ).toBe('/');
  expect(WebPushChannel.summarize()).toEqual([]);
});

it('files each push delivery under its device id', () => {
  const { push } = channel();
  expect(push.recipientKey({ id: 'phone', userId: 'alice' })).toBe('phone');
  expect(push.recipientKey({ id: 'laptop', userId: 'alice' })).toBe('laptop');
});
