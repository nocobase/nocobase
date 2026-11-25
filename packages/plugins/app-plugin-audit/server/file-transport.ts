import { constants } from 'node:fs';
import { mkdir, open, realpath } from 'node:fs/promises';
import path from 'node:path';
import type { AuditTransportDriver } from '@nocobase/app-server/audit';

interface AppendQueue {
  tail: Promise<void>;
  size: number;
}

// Named destinations can point to the same file. Serialize across them and across applications in this process.
const queues = new Map<string, AppendQueue>();
const maxPendingAppends = 64;

function within(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

async function append(file: string, line: string): Promise<void> {
  const handle = await open(
    file,
    constants.O_APPEND |
      constants.O_CREAT |
      constants.O_RDWR |
      (constants.O_NOFOLLOW ?? 0) |
      (constants.O_NONBLOCK ?? 0),
    0o600,
  );
  try {
    const info = await handle.stat();
    if (
      !info.isFile() ||
      info.nlink !== 1 ||
      (process.platform !== 'win32' && (info.mode & 0o077) !== 0)
    )
      throw new Error('Audit destination must be a private regular file.');
    if (info.size > 0) {
      const lastByte = Buffer.alloc(1);
      if (
        (await handle.read(lastByte, 0, 1, info.size - 1)).bytesRead !== 1 ||
        lastByte[0] !== 10
      )
        throw new Error('Audit destination ends with an incomplete line.');
    }
    const buffer = Buffer.from(line);
    try {
      let written = 0;
      while (written < buffer.length) {
        const result = await handle.write(
          buffer,
          written,
          buffer.length - written,
        );
        if (result.bytesWritten === 0)
          throw new Error('Audit append made no progress.');
        written += result.bytesWritten;
      }
    } catch (error) {
      await handle.truncate(info.size);
      throw error;
    }
  } finally {
    await handle.close();
  }
}

function enqueue(
  file: string,
  line: string,
  signal: AbortSignal,
): Promise<void> {
  let queue = queues.get(file);
  if (!queue) {
    queue = { size: 0, tail: Promise.resolve() };
    queues.set(file, queue);
  }
  const current = queue;
  if (current.size >= maxPendingAppends)
    throw new Error('Audit file queue is full.');
  current.size++;
  const write = current.tail.then(async () => {
    signal.throwIfAborted();
    await append(file, line);
  });
  current.tail = write.catch(() => undefined);
  return write.finally(() => {
    if (--current.size === 0) queues.delete(file);
  });
}

export const fileAuditDriver: AuditTransportDriver = {
  name: 'file',
  createTransport(options, { paths }) {
    const value = options.path;
    if (
      Object.keys(options).some((key) => key !== 'path') ||
      typeof value !== 'string' ||
      !value.trim() ||
      value.includes('\0') ||
      value.endsWith(path.sep)
    )
      throw new TypeError('File audit requires a file path.');
    const relative = !path.isAbsolute(value);
    const destination = path.resolve(paths.storageDir, value);
    if (
      relative &&
      (!within(paths.storageDir, destination) ||
        paths.storageDir === destination)
    )
      throw new TypeError(
        'Relative audit paths must stay inside application storage.',
      );

    let preparing: Promise<string> | undefined;
    const prepare = async (): Promise<string> => {
      const parent = path.dirname(destination);
      if (relative) {
        await mkdir(paths.storageDir, { recursive: true, mode: 0o700 });
        const root = await realpath(paths.storageDir);
        let directory = root;
        for (const segment of path
          .relative(paths.storageDir, parent)
          .split(path.sep)
          .filter(Boolean)) {
          const next = path.join(directory, segment);
          await mkdir(next, { recursive: true, mode: 0o700 });
          directory = await realpath(next);
          if (!within(root, directory))
            throw new Error('Audit path leaves application storage.');
        }
        return path.join(directory, path.basename(destination));
      }
      await mkdir(parent, { recursive: true, mode: 0o700 });
      return path.join(await realpath(parent), path.basename(destination));
    };
    return {
      async write(event, { signal }) {
        preparing ??= prepare().catch((error: unknown) => {
          preparing = undefined;
          throw error;
        });
        const file = await preparing;
        signal.throwIfAborted();
        await enqueue(file, `${JSON.stringify(event)}\n`, signal);
      },
    };
  },
};
