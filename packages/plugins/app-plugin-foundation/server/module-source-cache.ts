import { stat } from 'node:fs/promises';
import path from 'node:path';

import type { FoundationModuleSources } from '../shared/foundation.js';
import {
  collectModuleSources,
  type ModuleSourceObservation,
} from './module-sources.js';
import type { RuntimeProviderEvidence } from './provider-inventory.js';

const MAX_PATHS = 4096;
const MAX_BYTES = 1_000_000;
const TTL_MS = 60_000;

async function fingerprint(file: string): Promise<string> {
  try {
    const value = await stat(file);
    return JSON.stringify([
      value.dev,
      value.ino,
      value.mode,
      value.size,
      value.mtimeMs,
      value.ctimeMs,
    ]);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT' || code === 'ENOTDIR') return 'missing';
    throw error;
  }
}

/** Tracks read files and resolution directories, including missing alternatives, without retaining source or ASTs. */
class Snapshot implements ModuleSourceObservation {
  public readonly paths = new Map<string, string>();
  public cacheable = true;
  private bytes = 0;

  public unreadable(): void {
    this.cacheable = false;
  }

  public async watch(file: string): Promise<void> {
    if (!this.cacheable || this.paths.has(file)) return;
    this.bytes += Buffer.byteLength(file);
    // Checkouts keep their current source-reading behavior, including hot reload and unresolved declarations.
    if (
      /\.(?:ts|tsx|jsx)$/.test(file) ||
      this.paths.size >= MAX_PATHS ||
      this.bytes > MAX_BYTES
    ) {
      this.cacheable = false;
      return;
    }
    try {
      this.paths.set(file, await fingerprint(file));
    } catch {
      this.cacheable = false;
    }
  }

  public async valid(): Promise<boolean> {
    if (!this.cacheable) return false;
    for (const [file, before] of this.paths) {
      try {
        if ((await fingerprint(file)) !== before) return false;
      } catch {
        return false;
      }
    }
    return true;
  }
}

/** One bounded, validated compiled-result entry per application service; never caches dynamic observations. */
export class ModuleSourceCache {
  private cached?: {
    readonly key: string;
    readonly at: number;
    readonly files: Snapshot;
    readonly sources: FoundationModuleSources;
  };

  public constructor(private readonly now: () => number = Date.now) {}

  public async read(
    rootDir: string,
    runtime: readonly RuntimeProviderEvidence[] = [],
  ): Promise<FoundationModuleSources> {
    const key = JSON.stringify([
      path.resolve(rootDir),
      runtime.map(({ name, version, rootDir: root, evidence }) => [
        name,
        version,
        root,
        evidence,
      ]),
    ]);
    const previous = this.cached;
    if (
      previous?.key === key &&
      this.now() - previous.at < TTL_MS &&
      (await previous.files.valid())
    )
      return previous.sources;
    this.cached = undefined;
    const files = new Snapshot();
    const sources = await collectModuleSources(rootDir, runtime, files);
    if (
      files.cacheable &&
      Buffer.byteLength(key) <= MAX_BYTES &&
      Buffer.byteLength(JSON.stringify(sources)) <= MAX_BYTES &&
      (await files.valid())
    )
      this.cached = { key, at: this.now(), files, sources };
    return sources;
  }
}
