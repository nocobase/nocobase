import { posix } from 'node:path';
import { InMemoryFs, type IFileSystem } from 'just-bash';
import { sandboxLimits } from './limits.js';

const MUTATORS = new Set([
  'writeFile',
  'appendFile',
  'mkdir',
  'mkdirSync',
  'rm',
  'cp',
  'mv',
  'chmod',
  'utimes',
  'createExclusive',
  'writeFileSync',
  'writeFileLazy',
]);

class FsError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/** The historical read-only guard over just-bash's filesystem; storage and quotas belong to InMemoryFs. */
export function createSandboxFilesystem(
  files: Record<string, string>,
  maxTotalBytes: number = sandboxLimits.filesystemBytes,
  unreadable: ReadonlyMap<string, string> = new Map(),
): { fs: IFileSystem; lock(): void; dispose(): Promise<void> } {
  const inner = new InMemoryFs(files, { maxTotalBytes });
  inner.writeFileSync('/tmp/.keep', '');
  let locked = false;
  const writable = (path: unknown): boolean => {
    if (typeof path !== 'string' || path.includes('\0')) return false;
    const normalized = posix.resolve('/', path);
    return normalized === '/tmp' || normalized.startsWith('/tmp/');
  };
  const fs = new Proxy(inner, {
    get(target, property, receiver) {
      const value: unknown = Reflect.get(target, property, receiver);
      if (typeof value !== 'function') return value;
      const name = String(property);
      return (...args: unknown[]) => {
        if (
          ['readFile', 'readFileBytes', 'readFileBuffer', 'cp'].includes(
            name,
          ) &&
          typeof args[0] === 'string'
        ) {
          const reason = unreadable.get(posix.resolve('/', args[0]));
          if (reason) throw new FsError('EACCES', reason);
        }
        // Skills contain no links; refusing new links keeps the guard's normalized paths authoritative.
        if (locked && (name === 'symlink' || name === 'link'))
          throw new FsError('EPERM', 'EPERM: links are unavailable.');
        if (locked && MUTATORS.has(name)) {
          const written = name === 'cp' || name === 'mv' ? args[1] : args[0];
          const touched = name === 'mv' ? [args[0], args[1]] : [written];
          if (!touched.every(writable))
            throw new FsError('EROFS', 'EROFS: only /tmp is writable.');
        }
        return (value as (...args: unknown[]) => unknown).apply(target, args);
      };
    },
  });
  return {
    fs,
    lock() {
      locked = true;
    },
    async dispose() {
      await inner.rm('/', { recursive: true, force: true });
    },
  };
}
