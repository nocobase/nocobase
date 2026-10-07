// Where the signed-in person's API key is kept: the system keychain (`AppCliConfig.keychainService`, one item per state
// directory), or, where there is none, `config.json` itself (0600), with a warning. `config.json` says which.
import path from 'node:path';

import { cliKeychainService } from '@nocobase/agent-protocol';

import type { AppCliConfig } from '../../config.ts';
import { MacKeychain } from './macos.ts';
import { SecretService } from './secret-service.ts';
import type { SecretStore, SecretStoreKind } from './store.ts';
import { CredentialManager } from './windows.ts';

export {
  SecretStoreError,
  type RunTool,
  type SecretStore,
  type SecretStoreKind,
  type ToolResult,
} from './store.ts';
export { MacKeychain } from './macos.ts';
export { SecretService } from './secret-service.ts';
export { CredentialManager } from './windows.ts';

export type KeyStorage = SecretStoreKind | 'file';

/** `AppCliConfig.keychainEnv` set to `off` (`ACME_KEYCHAIN=off`) turns the keychain off: the key goes into `config.json`. */
export function keychainDisabled(
  config: AppCliConfig,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const name = config.keychainEnv;
  return name !== undefined && /^(off|0|false|no)$/iu.test(env[name] ?? '');
}

/** The keychain of this platform, or undefined when it has none or it is turned off. */
export function defaultSecretStore(
  config: AppCliConfig,
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): SecretStore | undefined {
  if (keychainDisabled(config, env)) return undefined;
  switch (platform) {
    case 'darwin':
      return new MacKeychain();
    case 'linux':
      return new SecretService(undefined, undefined, env);
    case 'win32':
      return new CredentialManager();
    default:
      return undefined;
  }
}

/** The keychain service of the CLI's items, such as `acme-cli`. */
export function keychainService(config: AppCliConfig): string {
  return config.keychainService ?? cliKeychainService(config.bin);
}

/** One item per state directory, so a test home or a second profile never overwrites the real one. */
export function keychainAccount(home: string): string {
  return path.resolve(home);
}

export function keychainLabel(config: AppCliConfig, server: string): string {
  return `${config.displayName} CLI sign-in (${server})`;
}

export function describeStorage(storage: KeyStorage, file: string): string {
  switch (storage) {
    case 'keychain':
      return 'the macOS Keychain';
    case 'secret-service':
      return 'the Secret Service keyring';
    case 'credential-manager':
      return 'the Windows Credential Manager';
    case 'file':
      return `plain text in ${file} (0600)`;
  }
}
