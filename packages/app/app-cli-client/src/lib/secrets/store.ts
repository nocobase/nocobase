// The system keychain behind one small interface: the macOS Keychain through `/usr/bin/security`, the Secret Service
// (GNOME Keyring, KWallet) through `secret-tool`, and the Windows Credential Manager through PowerShell. Calling the
// operating system's own tools keeps the CLI free of native modules, so its standalone tarball stays the same on every
// platform. A secret always travels on standard input, never in a process argument another user could read in `ps`.
import { spawn } from 'node:child_process';

export type SecretStoreKind =
  'keychain' | 'secret-service' | 'credential-manager';

export interface SecretStore {
  readonly kind: SecretStoreKind;
  /** False when there is no usable keychain here (no tool, no session bus, no default keychain). */
  available(): Promise<boolean>;
  /** The stored secret, or undefined when there is no item. Throws `SecretStoreError` when the keychain cannot be read. */
  get(service: string, account: string): Promise<string | undefined>;
  /** Stores or replaces the secret and reads it back; throws `SecretStoreError` when it did not stick. */
  set(
    service: string,
    account: string,
    secret: string,
    label: string,
  ): Promise<void>;
  /** Removes the item; a missing item is not an error. */
  delete(service: string, account: string): Promise<void>;
}

export class SecretStoreError extends Error {
  override name = 'SecretStoreError';
}

export interface ToolResult {
  readonly code: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

/** Runs a keychain tool; tests replace it. */
export type RunTool = (
  command: string,
  args: readonly string[],
  input?: string,
) => Promise<ToolResult>;

/** A locked keychain may wait on an unlock dialog; give up after a minute rather than hang. */
const TOOL_TIMEOUT_MS = 60_000;

export const runTool: RunTool = (command, args, input) =>
  new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    const child = spawn(command, [...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });
    const timer = setTimeout(() => child.kill('SIGKILL'), TOOL_TIMEOUT_MS);
    child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({ code: null, stdout, stderr: stderr || error.message });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
    child.stdin.on('error', () => undefined);
    child.stdin.end(input ?? '');
  });

/** What a failed tool said, for an error message. */
export function toolError(result: ToolResult): string {
  return result.stderr.trim() || `exit ${String(result.code)}`;
}

/** The tool's answer without the line break it ends with. */
export function firstValue(stdout: string): string | undefined {
  const value = stdout.replace(/\r?\n$/u, '');
  return value === '' ? undefined : value;
}
