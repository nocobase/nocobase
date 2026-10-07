// The macOS Keychain through `/usr/bin/security`, called by its absolute path so nothing on PATH stands in for it.
import { existsSync } from 'node:fs';

import {
  firstValue,
  runTool,
  SecretStoreError,
  toolError,
  type RunTool,
  type SecretStore,
} from './store.ts';

export const SECURITY = '/usr/bin/security';
/** `errSecItemNotFound`: how `find-` and `delete-generic-password` exit when there is no item. */
const NOT_FOUND = 44;

/** `security -i` splits its input on whitespace and reads double-quoted words; refuse what would need escaping. */
function quote(value: string): string {
  if (/["\\\n\r]/u.test(value))
    throw new SecretStoreError(
      'The value contains characters the macOS Keychain command cannot take.',
    );
  return `"${value}"`;
}

export class MacKeychain implements SecretStore {
  readonly kind = 'keychain' as const;

  private readonly run: RunTool;
  private readonly platform: NodeJS.Platform;

  constructor(
    run: RunTool = runTool,
    platform: NodeJS.Platform = process.platform,
  ) {
    this.run = run;
    this.platform = platform;
  }

  async available(): Promise<boolean> {
    if (this.platform !== 'darwin' || !existsSync(SECURITY)) return false;
    return (await this.run(SECURITY, ['default-keychain'])).code === 0;
  }

  async get(service: string, account: string): Promise<string | undefined> {
    const result = await this.run(SECURITY, [
      'find-generic-password',
      '-s',
      service,
      '-a',
      account,
      '-w',
    ]);
    if (result.code === NOT_FOUND) return undefined;
    if (result.code !== 0)
      throw new SecretStoreError(
        `Cannot read the macOS Keychain: ${toolError(result)}`,
      );
    return firstValue(result.stdout);
  }

  async set(
    service: string,
    account: string,
    secret: string,
    label: string,
  ): Promise<void> {
    // `security -i` reads the command from standard input, so the secret never appears in the process list. It exits 0
    // even when the command fails, hence the read-back.
    const line = `add-generic-password -U -s ${quote(service)} -a ${quote(account)} -l ${quote(label)} -w ${quote(secret)}\n`;
    const result = await this.run(SECURITY, ['-i'], line);
    if (result.code !== 0 || (await this.get(service, account)) !== secret)
      throw new SecretStoreError(
        `Cannot write to the macOS Keychain: ${result.stderr.trim() || 'the item did not stick'}`,
      );
  }

  async delete(service: string, account: string): Promise<void> {
    const result = await this.run(SECURITY, [
      'delete-generic-password',
      '-s',
      service,
      '-a',
      account,
    ]);
    if (result.code !== 0 && result.code !== NOT_FOUND)
      throw new SecretStoreError(
        `Cannot delete from the macOS Keychain: ${toolError(result)}`,
      );
  }
}
