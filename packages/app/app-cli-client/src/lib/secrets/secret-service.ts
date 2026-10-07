// The Secret Service (GNOME Keyring, KWallet) through libsecret's `secret-tool`. It needs a desktop session's D-Bus: on
// a headless server there is usually none, and the CLI falls back to a file.
import { existsSync } from 'node:fs';
import path from 'node:path';

import {
  firstValue,
  runTool,
  SecretStoreError,
  toolError,
  type RunTool,
  type SecretStore,
} from './store.ts';

/** `secret-tool` on `searchPath`, or undefined. */
export function findSecretTool(
  searchPath: string = process.env.PATH ?? '',
): string | undefined {
  for (const dir of searchPath.split(path.delimiter)) {
    if (dir === '') continue;
    const candidate = path.join(dir, 'secret-tool');
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

export class SecretService implements SecretStore {
  readonly kind = 'secret-service' as const;

  private readonly run: RunTool;
  private readonly tool: string | undefined;
  private readonly env: NodeJS.ProcessEnv;
  private readonly platform: NodeJS.Platform;

  constructor(
    run: RunTool = runTool,
    tool: string | undefined = findSecretTool(),
    env: NodeJS.ProcessEnv = process.env,
    platform: NodeJS.Platform = process.platform,
  ) {
    this.run = run;
    this.tool = tool;
    this.env = env;
    this.platform = platform;
  }

  async available(): Promise<boolean> {
    if (
      this.platform !== 'linux' ||
      this.tool === undefined ||
      (this.env.DBUS_SESSION_BUS_ADDRESS ?? '') === ''
    )
      return false;
    // `lookup` exits 1 with nothing on stderr when there is simply no item; a missing service or bus says why.
    const result = await this.run(this.tool, [
      'lookup',
      'service',
      'nocobase-cli-probe',
      'account',
      'probe',
    ]);
    return (
      result.code === 0 || (result.code === 1 && result.stderr.trim() === '')
    );
  }

  async get(service: string, account: string): Promise<string | undefined> {
    const result = await this.run(this.requireTool(), [
      'lookup',
      'service',
      service,
      'account',
      account,
    ]);
    if (result.code === 1 && result.stderr.trim() === '') return undefined;
    if (result.code !== 0)
      throw new SecretStoreError(
        `Cannot read the Secret Service: ${toolError(result)}`,
      );
    return firstValue(result.stdout);
  }

  async set(
    service: string,
    account: string,
    secret: string,
    label: string,
  ): Promise<void> {
    // `store` reads the secret from standard input when it is not a terminal.
    const result = await this.run(
      this.requireTool(),
      ['store', `--label=${label}`, 'service', service, 'account', account],
      secret,
    );
    if (result.code !== 0 || (await this.get(service, account)) !== secret)
      throw new SecretStoreError(
        `Cannot write to the Secret Service: ${result.stderr.trim() || 'the item did not stick'}`,
      );
  }

  async delete(service: string, account: string): Promise<void> {
    const result = await this.run(this.requireTool(), [
      'clear',
      'service',
      service,
      'account',
      account,
    ]);
    if (result.code !== 0 && result.stderr.trim() !== '')
      throw new SecretStoreError(
        `Cannot delete from the Secret Service: ${toolError(result)}`,
      );
  }

  private requireTool(): string {
    if (this.tool === undefined)
      throw new SecretStoreError('secret-tool is not installed.');
    return this.tool;
  }
}
