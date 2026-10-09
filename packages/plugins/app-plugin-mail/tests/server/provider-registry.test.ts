import { describe, expect, it } from 'vitest';

import { createMailProviderRegistry } from '../../server/registry.js';
import type {
  MailProviderConfig,
  MailProviderDefinition,
} from '../../server/types.js';

describe('Mail Provider Registry', () => {
  it('keeps definitions addressable by their unique type', () => {
    const gmail = providerDefinition('gmail');
    const microsoft = providerDefinition('microsoft');
    const registry = createMailProviderRegistry()
      .register(gmail)
      .register(microsoft);

    expect(registry.definition('gmail')).toBe(gmail);
    expect(registry.definition('microsoft')).toBe(microsoft);
    expect(registry.definitions()).toEqual([gmail, microsoft]);
  });

  it('rejects duplicate Provider types', () => {
    const registry = createMailProviderRegistry().register(
      providerDefinition('gmail'),
    );

    expect(() => registry.register(providerDefinition('gmail'))).toThrow(
      'Mail Provider definition "gmail" is already registered.',
    );
  });
});

function providerDefinition(type: string): MailProviderDefinition {
  const notImplemented = (): never => {
    throw new Error('Provider API is outside this contract test.');
  };
  return {
    type,
    label: type,
    capabilities: {
      receive: true,
      send: true,
      incrementalSync: true,
      pushNotifications: false,
      folders: true,
      labels: false,
      drafts: true,
      moveMessage: true,
      aliases: false,
    },
    authorization: {
      start: notImplemented,
      complete: notImplemented,
    },
    createAdapter: notImplemented,
    validateConfig(_config: MailProviderConfig): void {},
  };
}
