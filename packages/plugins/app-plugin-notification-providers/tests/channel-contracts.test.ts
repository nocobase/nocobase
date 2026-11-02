import type { NotificationChannelContext } from '@nocobase/app-plugin-notification';
import { expect, it } from 'vitest';
import { createImChannelDefinition } from '../server/im/channel.js';

it('accepts webhook messages with complete HTTP(S) targets and rejects all recipients', async () => {
  const channel = await createImChannelDefinition().createChannel(
    { logger: {} } as NotificationChannelContext,
    { provider: 'feishu-webhook' },
  );
  const message = {
    text: 'Review',
    target: { type: 'url', url: 'https://example.com/main/topics/123' },
  };
  expect(channel.validateMessage(message)).toMatchObject({
    message,
    recipients: [{ webhook: true }],
  });
  for (const to of [undefined, '123', [], { type: 'user', id: '123' }])
    expect(() => channel.validateMessage({ ...message, to })).toThrow(
      'do not accept to',
    );
  for (const target of [
    { type: 'route', path: '/topic' },
    { type: 'url', url: 'javascript:alert(1)' },
  ])
    expect(() => channel.validateMessage({ ...message, target })).toThrow();
  expect(() => channel.validateMessage({ text: '' })).toThrow();
  expect(
    channel.validateMessage({ text: 'Hello', actionUrl: '/ignored' }).message,
  ).not.toHaveProperty('actionUrl');
});
