import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface PackageManifestEntry {
  /** Package relative path using `/` separators. */
  readonly path: string;
  readonly size: number;
  readonly sha256: string;
}

export interface ScannedPackage {
  readonly key: string;
  readonly root: string;
  readonly entries: readonly PackageManifestEntry[];
}

export interface WorkflowPackageScanOptions {
  maxFiles?: number;
  maxBytes?: number;
}

export class WorkflowPackageScanError extends Error {
  constructor(
    message: string,
    readonly packagePath: string,
  ) {
    super(`${packagePath}: ${message}`);
    this.name = 'WorkflowPackageScanError';
  }
}

const EXCLUDED_DIRECTORIES: ReadonlySet<string> = new Set([
  '.git',
  'node_modules',
  '.cache',
  'dist',
  'build',
]);
const SECRET_NAMES: readonly RegExp[] = [
  /^\.env(?:\.|$)/i,
  /secret/i,
  /credentials?/i,
  /\.pem$/i,
  /\.key$/i,
];
const TEMP_NAMES: readonly RegExp[] = [
  /~$/,
  /^\.?#/,
  /\.tmp$/i,
  /\.swp$/i,
  /\.sock$/i,
];

export function assertPackageRelativePath(candidate: string): string {
  if (candidate.includes('\0'))
    throw new WorkflowPackageScanError('path contains NUL', candidate);
  if (path.isAbsolute(candidate) || /^[A-Za-z]:[\\/]/.test(candidate))
    throw new WorkflowPackageScanError(
      'absolute paths are not allowed',
      candidate,
    );
  const normalized = candidate.replaceAll('\\', '/');
  if (normalized.split('/').includes('..'))
    throw new WorkflowPackageScanError(
      'parent traversal is not allowed',
      candidate,
    );
  if (!normalized || normalized === '.')
    throw new WorkflowPackageScanError(
      'empty paths are not allowed',
      candidate,
    );
  return normalized.replace(/^\.\//, '');
}

function excluded(relativePath: string, directory: boolean): boolean {
  const parts = relativePath.split('/');
  if (directory && EXCLUDED_DIRECTORIES.has(parts.at(-1) ?? '')) return true;
  const name = parts.at(-1) ?? '';
  return (
    SECRET_NAMES.some((pattern) => pattern.test(name)) ||
    TEMP_NAMES.some((pattern) => pattern.test(name))
  );
}

export async function scanWorkflowPackage(
  packageRoot: string,
  options: WorkflowPackageScanOptions = {},
): Promise<ScannedPackage> {
  const root = await fs.realpath(path.resolve(packageRoot));
  const rootPrefix = `${root}${path.sep}`;
  const entries: PackageManifestEntry[] = [];
  const seenCaseFolded = new Map<string, string>();
  let totalBytes = 0;
  const maxFiles = options.maxFiles ?? 1_000;
  const maxBytes = options.maxBytes ?? 64 * 1024 * 1024;

  const visit = async (
    directory: string,
    relativeDirectory: string,
  ): Promise<void> => {
    const children = await fs.readdir(directory, { withFileTypes: true });
    for (const child of children.sort((left, right) =>
      Buffer.from(left.name).compare(Buffer.from(right.name)),
    )) {
      const relative = assertPackageRelativePath(
        relativeDirectory ? `${relativeDirectory}/${child.name}` : child.name,
      );
      if (excluded(relative, child.isDirectory())) continue;
      const absolute = path.join(directory, child.name);
      const real = await fs.realpath(absolute);
      if (real !== root && !real.startsWith(rootPrefix))
        throw new WorkflowPackageScanError(
          `symlink escapes package root: ${relative}`,
          root,
        );
      const folded = relative.toLocaleLowerCase('en-US');
      const previous = seenCaseFolded.get(folded);
      if (previous && previous !== relative)
        throw new WorkflowPackageScanError(
          `case-conflicting paths: ${previous} and ${relative}`,
          root,
        );
      seenCaseFolded.set(folded, relative);
      const stat = await fs.stat(absolute);
      if (stat.isDirectory()) {
        await visit(absolute, relative);
      } else if (stat.isFile()) {
        const content = await fs.readFile(absolute);
        totalBytes += content.byteLength;
        if (entries.length + 1 > maxFiles)
          throw new WorkflowPackageScanError(
            `package exceeds ${maxFiles} files`,
            root,
          );
        if (totalBytes > maxBytes)
          throw new WorkflowPackageScanError(
            `package exceeds ${maxBytes} bytes`,
            root,
          );
        entries.push({
          path: relative,
          size: content.byteLength,
          sha256: createHash('sha256').update(content).digest('hex'),
        });
      } else {
        throw new WorkflowPackageScanError(
          `unsupported filesystem entry: ${relative}`,
          root,
        );
      }
    }
  };
  await visit(root, '');
  if (
    !entries.some(
      (entry) => entry.path === 'workflow.ts' || entry.path === 'workflow.js',
    )
  ) {
    throw new WorkflowPackageScanError(
      'workflow.ts or workflow.js is required',
      root,
    );
  }
  return { key: path.basename(root), root, entries: Object.freeze(entries) };
}

/** Identity of the source snapshot shared by server artifacts and client entries. */
export function workflowClientRevision(scanned: ScannedPackage): string {
  return createHash('sha256')
    .update(JSON.stringify(scanned.entries))
    .digest('hex');
}

/** Match the workflow loader: auxiliary directories are not packages. */
export async function discoverWorkflowPackages(
  sourceRoot: string,
): Promise<string[]> {
  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(sourceRoot, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
  const roots: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const root = path.join(sourceRoot, entry.name);
    try {
      if ((await fs.stat(path.join(root, 'workflow.ts'))).isFile())
        roots.push(root);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  return roots.sort();
}
