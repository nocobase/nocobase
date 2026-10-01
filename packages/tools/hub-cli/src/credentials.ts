// API keys saved by `hub auth login`. They live in the user's configuration directory rather than the project, keyed by
// remote URL: a Hub API key is bound to its Apps when it is created, so one key belongs to one remote, and two
// checkouts of the same project share it.
import { chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { HubCliError } from './errors.ts';
import { isRecord } from './remotes.ts';

export interface SavedKey {
  readonly apiKey: string;
  readonly savedAt: string;
}

interface CredentialsFile {
  version: 1;
  keys: Record<string, SavedKey>;
}

/**
 * `$XDG_CONFIG_HOME/nocobase/hub-credentials.json`, falling back to `~/.config`, and `%APPDATA%\nocobase` on Windows.
 */
export function credentialsPath(env: NodeJS.ProcessEnv = process.env): string {
  const base =
    process.platform === 'win32'
      ? (env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'))
      : env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  return path.join(base, 'nocobase', 'hub-credentials.json');
}

async function readCredentials(file: string): Promise<CredentialsFile> {
  let text: string;
  try {
    text = await readFile(file, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      return { version: 1, keys: {} };
    throw invalidCredentialsFile(file);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw invalidCredentialsFile(file);
  }
  if (!isRecord(parsed) || parsed.version !== 1 || !isRecord(parsed.keys))
    throw invalidCredentialsFile(file);
  const keys: Record<string, SavedKey> = {};
  for (const [url, entry] of Object.entries(parsed.keys)) {
    if (
      !isRecord(entry) ||
      typeof entry.apiKey !== 'string' ||
      typeof entry.savedAt !== 'string'
    )
      throw invalidCredentialsFile(file);
    keys[url] = { apiKey: entry.apiKey, savedAt: entry.savedAt };
  }
  return { version: 1, keys };
}

async function writeCredentials(
  file: string,
  credentials: CredentialsFile,
): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  // Created 0600 and renamed over the old file, so the key is never readable by others, not even while it is written.
  const temporary = `${file}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(credentials, null, 2)}\n`, {
    mode: 0o600,
  });
  await chmod(temporary, 0o600);
  await rename(temporary, file);
}

export async function loadKey(
  url: string,
  env?: NodeJS.ProcessEnv,
): Promise<SavedKey | undefined> {
  return (await readCredentials(credentialsPath(env))).keys[url];
}

export async function saveKey(
  url: string,
  apiKey: string,
  env?: NodeJS.ProcessEnv,
): Promise<void> {
  const file = credentialsPath(env);
  const credentials = await readCredentials(file);
  credentials.keys[url] = { apiKey, savedAt: new Date().toISOString() };
  await writeCredentials(file, credentials);
}

/** Removes the key saved for `url`, and reports whether there was one. */
export async function removeKey(
  url: string,
  env?: NodeJS.ProcessEnv,
): Promise<boolean> {
  const file = credentialsPath(env);
  const credentials = await readCredentials(file);
  if (!(url in credentials.keys)) return false;
  delete credentials.keys[url];
  await writeCredentials(file, credentials);
  return true;
}

function invalidCredentialsFile(file: string): HubCliError {
  return new HubCliError(
    'INVALID_CREDENTIALS_FILE',
    `${file} is not a readable hub-cli credentials file. Remove it and log in again with hub auth login.`,
    2,
  );
}
