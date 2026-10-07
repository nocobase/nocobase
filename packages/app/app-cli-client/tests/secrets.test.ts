// Where `login` keeps the personal API key: the system keychain through a fake backend, the fallback to config.json,
// and each platform's backend against a fake of its tool (no test touches a real keychain).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { appCliPaths } from '../src/config.ts';
import { readUserConfig, saveUserConfig } from '../src/lib/credentials.ts';
import {
  CredentialManager,
  defaultSecretStore,
  MacKeychain,
  SecretService,
  SecretStoreError,
  type RunTool,
  type SecretStore,
  type SecretStoreKind,
  type ToolResult,
} from '../src/lib/secrets/index.ts';
import { SECURITY } from '../src/lib/secrets/macos.ts';
import { POWERSHELL_ARGS } from '../src/lib/secrets/windows.ts';
import { removeDir, tempDir, TEST_CLI as ACME_CLI } from './helpers.ts';

/** An in-memory keychain; `failWrites` and `failReads` stand for one that refuses. */
class MemorySecretStore implements SecretStore {
  readonly items = new Map<string, string>();
  failWrites = false;
  failReads = false;

  constructor(
    readonly kind: SecretStoreKind = 'keychain',
    private readonly isAvailable = true,
  ) {}

  available(): Promise<boolean> {
    return Promise.resolve(this.isAvailable);
  }
  get(service: string, account: string): Promise<string | undefined> {
    if (this.failReads)
      return Promise.reject(new SecretStoreError('The keychain is locked'));
    return Promise.resolve(this.items.get(`${service}|${account}`));
  }
  set(service: string, account: string, secret: string): Promise<void> {
    if (this.failWrites)
      return Promise.reject(new SecretStoreError('Write refused'));
    this.items.set(`${service}|${account}`, secret);
    return Promise.resolve();
  }
  delete(service: string, account: string): Promise<void> {
    this.items.delete(`${service}|${account}`);
    return Promise.resolve();
  }
}

/** A fake keychain tool: records each call and answers from `answer`. */
function fakeTool(
  answer: (args: readonly string[], input?: string) => Partial<ToolResult>,
) {
  const calls: { command: string; args: readonly string[]; input?: string }[] =
    [];
  const run: RunTool = (command, args, input) => {
    calls.push({ command, args, ...(input === undefined ? {} : { input }) });
    return Promise.resolve({
      code: 0,
      stdout: '',
      stderr: '',
      ...answer(args, input),
    });
  };
  return { run, calls };
}

describe('the personal API key', () => {
  let home = '';
  const server = 'http://acme.test';
  afterEach(() => removeDir(home));

  function options(store: SecretStore | undefined) {
    home = tempDir('acme-secrets-');
    return { paths: appCliPaths(home), config: ACME_CLI, store, env: {} };
  }

  const readConfig = () =>
    JSON.parse(readFileSync(path.join(home, 'config.json'), 'utf8')) as unknown;

  it('goes into the keychain, under acme-cli and the state directory, and not into config.json', async () => {
    const store = new MemorySecretStore();
    const opts = options(store);
    expect(await saveUserConfig(server, 'secret-key', opts)).toEqual({
      storage: 'keychain',
      profile: 'default',
    });
    expect([...store.items]).toEqual([[`acme-cli|${home}`, 'secret-key']]);
    expect(readConfig()).toEqual({
      current: 'default',
      profiles: {
        default: { server, auth: { kind: 'apiKey', storage: 'keychain' } },
      },
    });
    expect(await readUserConfig(opts)).toEqual({
      server,
      key: 'secret-key',
      kind: 'apiKey',
      storage: 'keychain',
      profile: 'default',
    });
    // Another profile is another item: the state directory and the profile's name.
    await saveUserConfig(server, 'staging-key', {
      ...opts,
      profile: 'staging',
    });
    expect(store.items.get(`acme-cli|${home}#staging`)).toBe('staging-key');
  });

  it('goes into config.json with a warning where there is no keychain, and leaves no stale item', async () => {
    const store = new MemorySecretStore('secret-service', false);
    const opts = options(store);
    store.items.set(`acme-cli|${home}`, 'old');
    const saved = await saveUserConfig(server, 'secret-key', opts);
    expect(saved.storage).toBe('file');
    expect(saved.warning).toMatch(
      /^There is no usable system keychain here; the API key is stored in plain text in .*config\.json \(0600\)\.$/u,
    );
    expect(store.items.size).toBe(0);
    expect(readConfig()).toEqual({
      current: 'default',
      profiles: {
        default: {
          server,
          auth: { kind: 'apiKey', storage: 'file', key: 'secret-key' },
        },
      },
    });
    expect((await readUserConfig(opts))?.key).toBe('secret-key');
  });

  it('says why when the keychain refuses the key', async () => {
    const store = new MemorySecretStore();
    store.failWrites = true;
    const saved = await saveUserConfig(server, 'k', options(store));
    expect(saved).toMatchObject({ storage: 'file' });
    expect(saved.warning).toContain('Write refused; the API key is stored');
  });

  it('says ACME_KEYCHAIN turned the keychain off', async () => {
    home = tempDir('acme-secrets-');
    const saved = await saveUserConfig(server, 'k', {
      paths: appCliPaths(home),
      config: ACME_CLI,
      env: { ACME_KEYCHAIN: 'off' },
    });
    expect(saved.warning).toContain(
      'ACME_KEYCHAIN turns the system keychain off',
    );
  });

  it('asks for a new login when the keychain lost the key, is locked, or cannot be used', async () => {
    const store = new MemorySecretStore();
    const opts = options(store);
    await saveUserConfig(server, 'k', opts);

    store.failReads = true;
    await expect(readUserConfig(opts)).rejects.toThrow(
      'The keychain is locked. Unlock it, or run `acme login` again.',
    );
    store.failReads = false;
    store.items.clear();
    await expect(readUserConfig(opts)).rejects.toThrow(
      'The credential is gone from the macOS Keychain. Run `acme login` again.',
    );
    await expect(readUserConfig({ ...opts, store: undefined })).rejects.toThrow(
      'which this process cannot use (ACME_KEYCHAIN=off?)',
    );
  });

  it('is not read inside an agent run', async () => {
    const store = new MemorySecretStore();
    const opts = options(store);
    await saveUserConfig(server, 'k', opts);
    await expect(
      readUserConfig({
        ...opts,
        env: { AGENT_RUN_CREDENTIALS: '/gone/run.json' },
      }),
    ).rejects.toThrow('the run has ended');
  });
});

describe('defaultSecretStore', () => {
  it("picks the platform's keychain unless ACME_KEYCHAIN=off", () => {
    expect(defaultSecretStore(ACME_CLI, {}, 'darwin')?.kind).toBe('keychain');
    expect(defaultSecretStore(ACME_CLI, {}, 'linux')?.kind).toBe(
      'secret-service',
    );
    expect(defaultSecretStore(ACME_CLI, {}, 'win32')?.kind).toBe(
      'credential-manager',
    );
    expect(defaultSecretStore(ACME_CLI, {}, 'freebsd')).toBeUndefined();
    expect(
      defaultSecretStore(ACME_CLI, { ACME_KEYCHAIN: 'off' }, 'darwin'),
    ).toBeUndefined();
  });
});

describe('MacKeychain', () => {
  it('writes through `security -i`, so the key never shows in the process list, and reads it back', async () => {
    let stored = '';
    const tool = fakeTool((args, input) => {
      if (args[0] === '-i') {
        stored = /-w "([^"]*)"/u.exec(input ?? '')?.[1] ?? '';
        return {};
      }
      return { stdout: `${stored}\n` };
    });
    const keychain = new MacKeychain(tool.run, 'darwin');
    await keychain.set('acme-cli', '/home/a/.acme', 'k-123', 'Acme API key');
    expect(tool.calls[0]).toEqual({
      command: SECURITY,
      args: ['-i'],
      input:
        'add-generic-password -U -s "acme-cli" -a "/home/a/.acme" -l "Acme API key" -w "k-123"\n',
    });
    expect(tool.calls[1]?.args).toEqual([
      'find-generic-password',
      '-s',
      'acme-cli',
      '-a',
      '/home/a/.acme',
      '-w',
    ]);
    expect(tool.calls.flatMap((call) => call.args).join(' ')).not.toContain(
      'k-123',
    );
  });

  it('answers undefined for a missing item and refuses what it cannot quote', async () => {
    const keychain = new MacKeychain(
      fakeTool(() => ({ code: 44, stderr: 'not found' })).run,
      'darwin',
    );
    expect(await keychain.get('acme-cli', 'a')).toBeUndefined();
    await keychain.delete('acme-cli', 'a');
    await expect(keychain.set('acme-cli', 'a', 'x"y', 'l')).rejects.toThrow(
      SecretStoreError,
    );
    const locked = new MacKeychain(
      fakeTool(() => ({ code: 51, stderr: 'User interaction is not allowed.' }))
        .run,
      'darwin',
    );
    await expect(locked.get('acme-cli', 'a')).rejects.toThrow(
      'Cannot read the macOS Keychain: User interaction is not allowed.',
    );
    expect(
      await new MacKeychain(fakeTool(() => ({})).run, 'linux').available(),
    ).toBe(false);
  });
});

describe('SecretService', () => {
  it('stores through secret-tool with the key on standard input', async () => {
    let stored = '';
    const tool = fakeTool((args, input) => {
      if (args[0] === 'store') stored = input ?? '';
      return args[0] === 'lookup' ? { stdout: stored } : {};
    });
    const keyring = new SecretService(
      tool.run,
      '/usr/bin/secret-tool',
      {
        DBUS_SESSION_BUS_ADDRESS: 'unix:path=/run/user/1000/bus',
      },
      'linux',
    );
    expect(await keyring.available()).toBe(true);
    await keyring.set('acme-cli', '/home/a/.acme', 'k-123', 'Acme API key');
    expect(tool.calls[1]).toEqual({
      command: '/usr/bin/secret-tool',
      args: [
        'store',
        '--label=Acme API key',
        'service',
        'acme-cli',
        'account',
        '/home/a/.acme',
      ],
      input: 'k-123',
    });
    expect(await keyring.get('acme-cli', '/home/a/.acme')).toBe('k-123');
  });

  it('is unavailable without a session bus or the tool, and treats a silent exit 1 as no item', async () => {
    const missing = fakeTool(() => ({ code: 1 }));
    expect(
      await new SecretService(
        missing.run,
        '/usr/bin/secret-tool',
        {},
        'linux',
      ).available(),
    ).toBe(false);
    expect(
      await new SecretService(
        missing.run,
        undefined,
        { DBUS_SESSION_BUS_ADDRESS: 'x' },
        'linux',
      ).available(),
    ).toBe(false);
    const noService = fakeTool(() => ({
      code: 1,
      stderr: 'secret-tool: Cannot autolaunch D-Bus without X11 $DISPLAY',
    }));
    expect(
      await new SecretService(
        noService.run,
        '/usr/bin/secret-tool',
        { DBUS_SESSION_BUS_ADDRESS: 'x' },
        'linux',
      ).available(),
    ).toBe(false);
    const keyring = new SecretService(
      missing.run,
      '/usr/bin/secret-tool',
      {},
      'linux',
    );
    expect(await keyring.get('acme-cli', 'a')).toBeUndefined();
  });
});

describe('CredentialManager', () => {
  it('sends the request, the key among it, on standard input and reads the credential back', async () => {
    let stored = '';
    const tool = fakeTool((_args, input) => {
      const request = JSON.parse(input ?? '{}') as {
        op: string;
        secret?: string;
      };
      if (request.op === 'set') stored = request.secret ?? '';
      return request.op === 'get' ? { stdout: stored } : {};
    });
    const manager = new CredentialManager(tool.run, 'C:\\ps.exe', 'win32');
    await manager.set(
      'acme-cli',
      'C:\\Users\\a\\.acme',
      'k-123',
      'Acme API key',
    );
    expect(tool.calls[0]?.command).toBe('C:\\ps.exe');
    expect(tool.calls[0]?.args).toEqual(POWERSHELL_ARGS);
    expect(JSON.parse(tool.calls[0]?.input ?? '')).toEqual({
      op: 'set',
      target: 'acme-cli:C:\\Users\\a\\.acme',
      account: 'C:\\Users\\a\\.acme',
      label: 'Acme API key',
      secret: Buffer.from('k-123').toString('base64'),
    });
    expect(POWERSHELL_ARGS.join(' ')).not.toContain('k-123');
    expect(await manager.get('acme-cli', 'C:\\Users\\a\\.acme')).toBe('k-123');
  });

  it('answers undefined for a missing credential and reports a failure', async () => {
    expect(
      await new CredentialManager(
        fakeTool(() => ({ code: 44 })).run,
        'x',
        'win32',
      ).get('s', 'a'),
    ).toBeUndefined();
    await expect(
      new CredentialManager(
        fakeTool(() => ({ code: 1, stderr: 'Access is denied' })).run,
        'x',
        'win32',
      ).get('s', 'a'),
    ).rejects.toThrow(
      'Cannot read the Windows Credential Manager: Access is denied',
    );
    expect(
      await new CredentialManager(
        fakeTool(() => ({})).run,
        'x',
        'darwin',
      ).available(),
    ).toBe(false);
  });
});
