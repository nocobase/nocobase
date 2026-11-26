import {
  createJsonLinesLogOutput,
  type JsonLinesLogOutput,
} from '@nocobase/logging';
import { mkdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import type { AuditFileOptions } from './config.js';
import type { AuditTransport, AuditTransportContext } from './service.js';

export const fileAuditDriverName = 'file';

function within(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

export function createFileAuditTransport(
  options: AuditFileOptions,
  paths: AuditTransportContext['paths'],
  onCleanupError: () => void,
): AuditTransport & { prepare(): Promise<JsonLinesLogOutput> } {
  const { path: value, maxFileSizeMB = 50, retentionDays = 180 } = options;
  const relative = !path.isAbsolute(value);
  const storage = path.resolve(paths.storageDir);
  const destination = path.resolve(storage, value);
  if (relative && (!within(storage, destination) || storage === destination))
    throw new TypeError(
      'Relative audit paths must stay inside application storage.',
    );

  let preparing: Promise<JsonLinesLogOutput> | undefined;
  const createOutput = async (): Promise<JsonLinesLogOutput> => {
    const parent = path.dirname(destination);
    let directory: string;
    if (relative) {
      await mkdir(storage, { recursive: true, mode: 0o700 });
      const root = await realpath(storage);
      directory = root;
      for (const segment of path
        .relative(storage, parent)
        .split(path.sep)
        .filter(Boolean)) {
        const next = path.join(directory, segment);
        await mkdir(next, { recursive: true, mode: 0o700 });
        directory = await realpath(next);
        if (!within(root, directory))
          throw new Error('Audit path leaves application storage.');
      }
    } else {
      await mkdir(parent, { recursive: true, mode: 0o700 });
      directory = await realpath(parent);
    }
    return createJsonLinesLogOutput({
      directory,
      name: path.basename(destination, '.jsonl'),
      maxFileSizeMB,
      retentionDays,
      onCleanupError,
    });
  };
  const prepare = (): Promise<JsonLinesLogOutput> =>
    (preparing ??= createOutput().catch((error: unknown) => {
      preparing = undefined;
      throw error;
    }));
  return {
    prepare,
    async write(event, { signal }) {
      const output = await prepare();
      signal.throwIfAborted();
      output.writeLine(JSON.stringify(event) + '\n');
    },
    async close() {
      const output = await preparing?.catch(() => undefined);
      await output?.close();
    },
  };
}
