import { open } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseDocument } from 'yaml';

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
 * Where dsh keeps its state for the environment `env`, as dsh resolves it: `$DSH_HOME` unless it is blank (a value
 * that is not blank is used exactly as written, spaces at its ends included), `~` expanded against the home
 * directory, a relative path taken from `cwd`, the directory dsh is started in; otherwise `.dsh` under the home of
 * the account the runner runs as. `env` is what the runner passes to dsh, so a `DSH_HOME` that was not passed with
 * `--pass-env` does not apply, exactly as for dsh itself.
 */
export function dshHome(env: Record<string, string>, cwd: string): string {
  const home = env.HOME || env.USERPROFILE || os.homedir();
  const configured = env.DSH_HOME;
  if (!configured?.trim()) return path.join(home, '.dsh');
  if (configured === '~') return home;
  if (configured.startsWith('~/') || configured.startsWith('~\\'))
    return path.join(home, configured.slice(2));
  return path.resolve(cwd, configured);
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
 * Read at most `MAX_CREDENTIALS_BYTES` of `file`: the bytes, or `undefined` when the file is larger. The size is
 * enforced while reading, so a huge file never gets into memory.
 */
async function readBounded(file: string): Promise<Buffer | undefined> {
  const handle = await open(file, 'r');
  try {
    const buffer = Buffer.alloc(MAX_CREDENTIALS_BYTES + 1);
    let length = 0;
    while (length < buffer.length) {
      const { bytesRead } = await handle.read(
        buffer,
        length,
        buffer.length - length,
        null,
      );
      if (bytesRead === 0) break;
      length += bytesRead;
    }
    return length > MAX_CREDENTIALS_BYTES
      ? undefined
      : buffer.subarray(0, length);
  } finally {
    await handle.close();
  }
}

/**
 * Whether the key saved in the dsh Web settings is there: `refs.DEEPSEEK_API_KEY` of `<DSH_HOME>/.credentials.yaml`,
 * with a relative `DSH_HOME` taken from `cwd`. Reads one small file and reports presence only; the value never
 * leaves this function. The parser is silent: its warnings and error messages quote the offending source line, which
 * can be the key, so anything it objects to becomes the fixed `invalid YAML`.
 */
export async function inspectDshWebKey(
  env: Record<string, string>,
  cwd: string,
): Promise<DshWebKey> {
  const file = path.join(dshHome(env, cwd), CREDENTIALS_FILENAME);
  let text: string;
  try {
    const raw = await readBounded(file);
    if (!raw) return { state: 'invalid', file, cause: 'too large' };
    text = raw.toString('utf8');
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    // A missing file, or a home that is not a directory, is simply "no saved key".
    if (code === 'ENOENT' || code === 'ENOTDIR')
      return { state: 'absent', file };
    return { state: 'unreadable', file, cause: code ?? 'read error' };
  }
  try {
    const document = parseDocument(text, { logLevel: 'silent' });
    if (document.errors.length > 0 || document.warnings.length > 0)
      return { state: 'invalid', file, cause: 'invalid YAML' };
    return {
      state: storesKey(document.toJS()) ? 'present' : 'absent',
      file,
    };
  } catch {
    return { state: 'invalid', file, cause: 'invalid YAML' };
  }
}
