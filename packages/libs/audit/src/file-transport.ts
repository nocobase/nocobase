import { mkdir, realpath } from 'node:fs/promises';
import path from 'node:path';

import type { AuditFileOptions } from './config.js';
import { FileAuditOutput } from './file-output.js';
import type {
  AuditTransport,
  AuditTransportContext,
  AuditTransportDriver,
} from './service.js';

const outputs = new Map<string, FileAuditOutput>();

function within(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

export function createFileAuditDriver(): AuditTransportDriver & {
  prepare(): Promise<void>;
} {
  const files: Array<() => Promise<FileAuditOutput>> = [];
  return {
    name: 'file',
    createTransport(options, context) {
      const transport = createFileAuditTransport(
        options as AuditFileOptions,
        context,
      );
      files.push(() => transport.prepare());
      return transport;
    },
    async prepare() {
      // Resolve and register every policy before allowing startup cleanup.
      const prepared = await Promise.allSettled(
        files.map((prepare) => prepare()),
      );
      files.length = 0;
      for (const result of prepared)
        if (result.status === 'fulfilled') result.value.start();
    },
  };
}

function createFileAuditTransport(
  options: AuditFileOptions,
  { paths, report }: AuditTransportContext,
): AuditTransport & { prepare(): Promise<FileAuditOutput> } {
  const { path: value, maxFileSizeMB = 50, retentionDays = 180 } = options;
  const relative = !path.isAbsolute(value);
  const storage = path.resolve(paths.storageDir);
  const destination = path.resolve(storage, value);
  if (relative && (!within(storage, destination) || storage === destination))
    throw new TypeError(
      'Relative audit paths must stay inside application storage.',
    );

  const reportTarget = (message: string): void => report?.(message);
  let outputKey: string;
  let preparing: Promise<FileAuditOutput> | undefined;
  const createOutput = async (): Promise<FileAuditOutput> => {
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
    outputKey = path.join(directory, path.basename(destination));
    let output = outputs.get(outputKey);
    if (!output) {
      output = new FileAuditOutput(
        directory,
        path.basename(destination, '.jsonl'),
      );
      outputs.set(outputKey, output);
    }
    output.attach(reportTarget, maxFileSizeMB, retentionDays);
    return output;
  };
  const prepare = (): Promise<FileAuditOutput> =>
    (preparing ??= createOutput().catch((error: unknown) => {
      preparing = undefined;
      throw error;
    }));
  return {
    prepare,
    async write(event, { signal }) {
      const output = await prepare();
      signal.throwIfAborted();
      await output.write(Buffer.from(JSON.stringify(event) + '\n'), signal);
    },
    async close() {
      const output = await preparing?.catch(() => undefined);
      await output?.detach(reportTarget, () => outputs.delete(outputKey));
    },
  };
}
