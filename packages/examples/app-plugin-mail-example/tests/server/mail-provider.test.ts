import {
  createMailProviderRegistry,
  mailProviderRegistryToken,
  type MailCredentialVault,
  type MailProviderContext,
  type MailProviderDefinition,
  type MailProviderAccount,
} from '@nocobase/app-plugin-mail/server';
import { ServiceContainer } from '@nocobase/service-provider';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MailExampleProvider } from '../../server/providers/mail-example.js';
import {
  createDemoMailProviderDefinition,
  type MailExampleProviderConfig,
} from '../../server/providers/demo-mail-provider.js';
import { DemoMailboxes } from '../../server/providers/demo-mailboxes.js';

const DEMO_ACCOUNT = 'sam@example.test';
const PROVIDER_CONFIG: MailExampleProviderConfig = {
  type: 'mail-example',
  name: 'demo',
};

class MemoryCredentialVault implements MailCredentialVault {
  private readonly values: Map<string, unknown> = new Map();
  private nextReference: number = 1;

  public async put(value: unknown): Promise<string> {
    const reference = 'demo-credential-' + String(this.nextReference);
    this.nextReference += 1;
    this.values.set(reference, value);
    return reference;
  }

  public async get<T>(reference: string): Promise<T> {
    return this.values.get(reference) as T;
  }

  public async replace(reference: string, value: unknown): Promise<void> {
    this.values.set(reference, value);
  }

  public async getOrRefresh<T>(
    reference: string,
    isFresh: (value: T) => boolean,
    refresh: (value: T, signal?: AbortSignal) => Promise<T>,
    signal?: AbortSignal,
  ): Promise<T> {
    const value = await this.get<T>(reference);
    if (isFresh(value)) return value;
    const refreshed = await refresh(value, signal);
    await this.replace(reference, refreshed);
    return refreshed;
  }

  public async delete(reference: string): Promise<void> {
    this.values.delete(reference);
  }

  public async deleteExpired(): Promise<number> {
    return 0;
  }

  public snapshot(): readonly unknown[] {
    return [...this.values.values()];
  }
}

function createContext(credentials: MailCredentialVault): MailProviderContext {
  return { publicBasePath: '/main', credentials };
}

function createAccount(address: string): MailProviderAccount {
  return {
    id: 'account-1',
    userId: 'user-1',
    provider: { type: PROVIDER_CONFIG.type, name: PROVIDER_CONFIG.name },
    address,
    displayName: 'Demo Mailbox',
    credentialReference: 'demo-credential-1',
    scopes: [],
    status: 'active',
  };
}

describe('@nocobase/app-plugin-mail-example Provider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers its fake Provider with the real Mail Provider registry', async () => {
    const container = new ServiceContainer();
    const registry = createMailProviderRegistry();
    container.instance(mailProviderRegistryToken, registry);
    const provider = new MailExampleProvider({ container });

    await provider.boot();

    expect(registry.definitions().map((definition) => definition.type)).toEqual(
      ['mail-example', 'mail-example-microsoft', 'mail-example-imap-smtp'],
    );
    await provider.shutdown();
  });

  it('connects synthetic accounts and supplies fixture messages without network access', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch');
    const credentials = new MemoryCredentialVault();
    const context = createContext(credentials);
    const mailboxes = new DemoMailboxes(
      () => new Date('2026-09-28T12:00:00.000Z'),
    );
    const definition: MailProviderDefinition<MailExampleProviderConfig> =
      createDemoMailProviderDefinition(mailboxes);
    const connection = definition.connection;
    if (!connection)
      throw new Error('Demo Provider connection was not defined.');

    const connected = await connection.connect(context, PROVIDER_CONFIG, {
      address: ' Sam@Example.Test ',
      displayName: 'Sam Demo',
      username: 'demo-user',
      password: 'not-a-real-secret',
    });
    if (!connected.ok) throw new Error(connected.error.message);

    expect(connected.value.address).toBe(DEMO_ACCOUNT);
    expect(connected.value.identities).toEqual([
      {
        address: DEMO_ACCOUNT,
        displayName: 'Sam Demo',
        isPrimary: true,
        canSend: true,
      },
    ]);
    expect(credentials.snapshot()).toEqual([{ provider: 'mail-example' }]);

    const adapter = await definition.createAdapter(
      context,
      PROVIDER_CONFIG,
      createAccount(DEMO_ACCOUNT),
    );
    if (
      !adapter.listFolders ||
      !adapter.getCurrentSyncCursor ||
      !adapter.listMessages
    ) {
      throw new Error('Demo Provider does not support initial sync.');
    }
    const folders = await adapter.listFolders({ limit: 20 });
    const baseline = await adapter.getCurrentSyncCursor();
    const page = await adapter.listMessages({ limit: 20 });
    if (!folders.ok || !baseline.ok || !page.ok) {
      throw new Error('Demo Provider did not return fixture data.');
    }

    expect(folders.value.folders.map((folder) => folder.type)).toEqual([
      'inbox',
      'sent',
    ]);
    expect(baseline.value).toEqual({ value: 'mail-example-v1' });
    expect(page.value.messages).toHaveLength(6);
    expect(
      page.value.messages.map((message) => message.to[0]?.address),
    ).toContain(DEMO_ACCOUNT);
    expect(page.value.messages.map((message) => message.subject)).toContain(
      'Project update and brief',
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('retrieves a synthetic attachment and records sends in its local mock outbox', async () => {
    const credentials = new MemoryCredentialVault();
    const mailboxes = new DemoMailboxes(
      () => new Date('2026-09-28T12:00:00.000Z'),
    );
    const definition = createDemoMailProviderDefinition(mailboxes);
    const adapter = await definition.createAdapter(
      createContext(credentials),
      PROVIDER_CONFIG,
      createAccount(DEMO_ACCOUNT),
    );
    if (!adapter.getAttachment || !adapter.sendMessage) {
      throw new Error('Demo Provider attachment or send support is missing.');
    }

    const attachment = await adapter.getAttachment(
      'demo-project-update',
      'demo-project-brief',
    );
    if (!attachment.ok) throw new Error(attachment.error.message);
    const attachmentText = await new Response(attachment.value.stream).text();
    expect(attachmentText).toContain('Synthetic content');

    const sendInput = {
      trackingId: 'submission-1',
      identity: {
        id: 'identity-1',
        accountId: 'account-1',
        address: DEMO_ACCOUNT,
        isPrimary: true,
        canSend: true,
      },
      message: {
        to: [{ address: 'recipient@example.test' }],
        cc: [],
        bcc: [],
        subject: 'A local demo send',
        text: 'This message must stay in the mock outbox.',
        attachments: [],
        references: [],
      },
    } as const;
    const first = await adapter.sendMessage(sendInput);
    const retry = await adapter.sendMessage(sendInput);

    expect(first).toMatchObject({
      status: 'accepted',
      providerMessageId: 'demo-sent-001',
    });
    expect(retry).toEqual(first);
    expect(mailboxes.outboxFor(DEMO_ACCOUNT)).toHaveLength(1);
    expect(mailboxes.outboxFor(DEMO_ACCOUNT)[0]).toMatchObject({
      to: [{ address: 'recipient@example.test' }],
      subject: 'A local demo send',
    });
  });

  it('rejects addresses outside the reserved demo domain', async () => {
    const credentials = new MemoryCredentialVault();
    const definition = createDemoMailProviderDefinition(new DemoMailboxes());
    const connection = definition.connection;
    if (!connection)
      throw new Error('Demo Provider connection was not defined.');

    const result = await connection.connect(
      createContext(credentials),
      PROVIDER_CONFIG,
      {
        address: 'person@example.com',
        username: 'demo-user',
        password: 'demo-password',
      },
    );

    expect(result).toMatchObject({
      ok: false,
      error: { code: 'MAIL_EXAMPLE_ADDRESS_REQUIRED' },
    });
    expect(credentials.snapshot()).toEqual([]);
  });
});
