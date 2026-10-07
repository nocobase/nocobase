// The changed files of a directory on this machine (`changed` on a manifest parameter): found at the working
// directory or above it, compared with the manifest the directory holds by SHA-256, and sent with the request as
// multipart parts named by their paths inside the directory.
import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import { EXIT_CODES } from '@nocobase/agent-protocol';

import { UsageError } from '../lib/command.ts';
import { accepts } from '../parse/arguments.ts';

/** Where to look and what to send, as the manifest describes it. */
export interface ChangedFilesSpec {
  /** Relative, such as `.nocobase-runner/knowledge`. */
  readonly dir: string;
  /** Inside `dir`: a JSON array of `{ path, hash }`. */
  readonly manifest: string;
  readonly maxBytes: number;
  readonly maxFiles: number;
  /** Extensions such as `.md`; any when absent. */
  readonly accept?: readonly string[];
}

/** A file on this machine and the name it is sent under. */
export interface LocalFile {
  readonly path: string;
  /** Its base name, or for a changed file its path inside the directory. */
  readonly name: string;
  readonly size: number;
}

const invalid = (message: string) =>
  new UsageError(message, EXIT_CODES.validation);

/** `dir` at `cwd` or the nearest directory above it; undefined when there is none. */
async function findUp(cwd: string, dir: string): Promise<string | undefined> {
  for (let current = path.resolve(cwd); ;) {
    const candidate = path.join(current, dir);
    if ((await stat(candidate).catch(() => undefined))?.isDirectory())
      return candidate;
    const parent = path.dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}

/** Every file under `root` except names starting with a dot, by its path inside `root` with `/` separators. */
async function filesUnder(root: string, inside = ''): Promise<string[]> {
  const entries = await readdir(path.join(root, inside), {
    withFileTypes: true,
  });
  const found: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const relative = inside ? `${inside}/${entry.name}` : entry.name;
    if (entry.isDirectory()) found.push(...(await filesUnder(root, relative)));
    else if (entry.isFile()) found.push(relative);
  }
  return found.sort();
}

/** The files of the directory that differ from its manifest, or that it does not list; `flag` names them in errors. */
export async function changedFiles(
  spec: ChangedFilesSpec,
  flag: string,
  cwd: string,
): Promise<LocalFile[]> {
  const root = await findUp(cwd, spec.dir);
  if (!root)
    throw invalid(
      `--${flag}: no ${spec.dir} directory here or above; this run has none.`,
    );
  let listed: ReadonlyMap<string, string>;
  try {
    const manifest = JSON.parse(
      await readFile(path.join(root, spec.manifest), 'utf8'),
    ) as unknown;
    if (!Array.isArray(manifest)) throw new Error('not a list');
    listed = new Map(
      manifest.flatMap((entry: unknown) => {
        const item = entry as { path?: unknown; hash?: unknown };
        return typeof item.path === 'string' && typeof item.hash === 'string'
          ? [[item.path, item.hash] as const]
          : [];
      }),
    );
  } catch {
    throw invalid(
      `--${flag}: cannot read ${path.join(spec.dir, spec.manifest)}.`,
    );
  }
  const changed: LocalFile[] = [];
  for (const relative of await filesUnder(root)) {
    if (spec.accept && !accepts(spec.accept, relative)) continue;
    const full = path.join(root, relative);
    const bytes = await readFile(full);
    const hash = createHash('sha256').update(bytes).digest('hex');
    if (listed.get(relative) === hash) continue;
    if (bytes.length > spec.maxBytes)
      throw invalid(
        `${path.join(spec.dir, relative)} is larger than ${spec.maxBytes} bytes.`,
      );
    changed.push({ path: full, name: relative, size: bytes.length });
  }
  if (changed.length === 0)
    throw invalid(`--${flag}: nothing changed in ${spec.dir}.`);
  if (changed.length > spec.maxFiles)
    throw invalid(
      `--${flag}: ${changed.length} files changed in ${spec.dir}; send at most ${spec.maxFiles} at once (${changed.map((file) => file.name).join(', ')}).`,
    );
  return changed;
}
