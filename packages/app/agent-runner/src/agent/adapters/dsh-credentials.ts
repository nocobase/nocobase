import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parse } from 'yaml';

/** The one credential reference the dsh adapter authenticates with. */
export const DSH_KEY_NAME = 'DEEPSEEK_API_KEY';

/** What dsh keeps below its home; the Web settings page writes the key here. */
const CREDENTIALS_FILENAME = '.credentials.yaml';

/** A stored credentials file is a few lines; anything larger is not one. */
const MAX_CREDENTIALS_BYTES = 1024 * 1024;

export type DshWebKey =
  /** The file stores a non-empty key. Only presence is reported, never the value. */
  | { readonly state: 'present'; readonly file: string }
  /** No file, or the file stores no key. */
  | { readonly state: 'absent'; readonly file: string }
  /** The file exists but this account cannot read it, or it is not a credentials document. */
  | {
      readonly state: 'unreadable' | 'invalid';
      readonly file: string;
      /** The system error code or a short word, never file content. */
      readonly cause: string;
    };

/**
 * Where dsh keeps its state for the environment `env`: `$DSH_HOME` (a blank value counts as unset, `~` expands to the
 * home directory), otherwise `.dsh` under the home of the account the runner runs as. `env` is what the runner passes
 * to dsh, so a `DSH_HOME` that was not passed with `--pass-env` does not apply, exactly as for dsh itself.
 */
export function dshHome(env: Record<string, string>): string {
  const home = env.HOME?.trim() || env.USERPROFILE?.trim() || os.homedir();
  const configured = env.DSH_HOME?.trim();
  if (!configured) return path.join(home, '.dsh');
  if (configured === '~') return home;
  if (configured.startsWith('~/') || configured.startsWith('~\\'))
    return path.join(home, configured.slice(2));
  return path.resolve(configured);
}

/** Whether `refs` of a parsed credentials document stores a non-empty `DEEPSEEK_API_KEY`. */
function storesKey(document: unknown): boolean {
  if (document === null || document === undefined) return false;
  if (typeof document !== 'object' || Array.isArray(document))
    throw new Error('not a mapping');
  const refs = (document as Record<string, unknown>).refs;
  if (refs === null || refs === undefined) return false;
  if (typeof refs !== 'object' || Array.isArray(refs))
    throw new Error('refs is not a mapping');
  const value = (refs as Record<string, unknown>)[DSH_KEY_NAME];
  return typeof value === 'string' && value.trim() !== '';
}

/**
 * Whether the key saved in the dsh Web settings is there: `refs.DEEPSEEK_API_KEY` of `<DSH_HOME>/.credentials.yaml`.
 * Reads one small file and reports presence only; the value never leaves this function.
 */
export async function inspectDshWebKey(
  env: Record<string, string>,
): Promise<DshWebKey> {
  const file = path.join(dshHome(env), CREDENTIALS_FILENAME);
  let text: string;
  try {
    const raw = await readFile(file);
    if (raw.length > MAX_CREDENTIALS_BYTES)
      return { state: 'invalid', file, cause: 'too large' };
    text = raw.toString('utf8');
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    // A missing file, or a home that is not a directory, is simply "no saved key".
    if (code === 'ENOENT' || code === 'ENOTDIR')
      return { state: 'absent', file };
    return { state: 'unreadable', file, cause: code ?? 'read error' };
  }
  try {
    return { state: storesKey(parse(text)) ? 'present' : 'absent', file };
  } catch {
    // The parser's own message quotes the source line, which can hold the key: report none of it.
    return { state: 'invalid', file, cause: 'invalid YAML' };
  }
}
