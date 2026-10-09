import { describe, expect, it, vi } from 'vitest';

import { DefaultMailService } from '../../server/service.js';
import { createMailProviderRegistry } from '../../server/registry.js';
import type {
  MailProviderDefinition,
  MailProviderCapabilities,
  MailStore,
  MailProviderAdapterResolver,
} from '../../server/types.js';

const capabilities: MailProviderCapabilities = {
  receive: true,
  send: true,
  incrementalSync: true,
  pushNotifications: false,
  folders: true,
  labels: false,
  drafts: false,
  moveMessage: false,
  aliases: false,
};

describe('Mail Provider listing', () => {
  it('returns registered credential Providers that still need server setup', async () => {
    const registry = createMailProviderRegistry()
      .register(providerDefinition('gmail', 'Gmail', 'oauth'))
      .register(providerDefinition('imap-smtp', 'IMAP / SMTP', 'credentials'));
    const service = new DefaultMailService({
      store: {} as MailStore,
      adapters: {} as MailProviderAdapterResolver,
      outbox: { kick: vi.fn() },
      registry,
      listProviderConfigs: () => [{ type: 'gmail', name: 'google' }],
    });

    await expect(service.listProviders()).resolves.toEqual([
      expect.objectContaining({
        type: 'gmail',
        name: 'google',
        configured: true,
        connection: 'oauth',
      }),
      expect.objectContaining({
        type: 'imap-smtp',
        name: 'imap-smtp',
        configured: false,
        connection: 'credentials',
      }),
    ]);
  });
});

function providerDefinition(
  type: string,
  label: string,
  connection: 'oauth' | 'credentials',
): MailProviderDefinition {
  return {
    type,
    label,
    capabilities,
    ...(connection === 'oauth' ? { authorization: {} } : { connection: {} }),
    createAdapter: vi.fn(),
  } as unknown as MailProviderDefinition;
}
