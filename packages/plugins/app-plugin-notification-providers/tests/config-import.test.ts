import { expect, it, vi } from 'vitest';

vi.mock('@nocobase/mailer', () => {
  throw new Error('Mailer runtime loaded by configuration.');
});
vi.mock('nodemailer', () => {
  throw new Error('SMTP SDK loaded by configuration.');
});
vi.mock('resend', () => {
  throw new Error('Resend SDK loaded by configuration.');
});
vi.mock('@nocobase/app-plugin-notification', () => {
  throw new Error('Notification runtime loaded by configuration.');
});

it('declares configuration through its public export without loading senders or notification runtime', async () => {
  const { defineMailChannelsConfig } =
    await import('@nocobase/app-plugin-notification-providers/config');
  const { isMailChannelConfig } = await import('@nocobase/mailer/config');
  expect(
    defineMailChannelsConfig({ defaults: { channels: {} } }).rules?.public,
  ).toEqual([]);
  expect(
    isMailChannelConfig({ provider: 'smtp', host: 'localhost', port: 25 }),
  ).toBe(true);
});
