// Building for the Hub. The Hub reports the platform its Host runs Apps on; the build targets exactly that, and an
// archive built elsewhere is checked against it before it is uploaded.
import { spawn } from 'node:child_process';
import { t as listArchive } from 'tar';

import { HubCliError } from './errors.ts';
import { parseBuildTarget, type BuildTarget } from './hub-client.ts';
import { isRecord } from './remotes.ts';

const PLATFORMS = new Set(['darwin', 'linux', 'win32']);
const ARCHES = new Set(['x64', 'arm64', 'arm']);

/** `linux-x64 Node 24`, the way targets are named in messages. */
export function describeTarget(target: BuildTarget): string {
  const libc =
    target.platform === 'linux' && target.libc === 'musl' ? '-musl' : '';
  return `${target.platform}-${target.arch}${libc} Node ${String(target.nodeMajor)}`;
}

/** The `nocobase build` options that produce an archive for `target`. */
export function buildArguments(target: BuildTarget): string[] {
  if (!PLATFORMS.has(target.platform) || !ARCHES.has(target.arch))
    throw new HubCliError(
      'BUILD_TARGET_UNSUPPORTED',
      `The Hub runs ${describeTarget(target)}, which nocobase build cannot target. Build the archive on a machine like the Hub's and deploy it with --file.`,
      1,
    );
  const libc =
    target.platform === 'linux' && target.libc === 'musl' ? '-musl' : '';
  return [
    '--target',
    `${target.platform}-${target.arch}${libc}`,
    '--node-version',
    String(target.nodeMajor),
    '--tar',
  ];
}

/**
 * Runs a build command in `cwd`. Its output goes to stderr, both streams, so a `--json` document stays the only thing
 * on stdout.
 */
export async function runBuild(
  command: { command: string; args: readonly string[] },
  cwd: string,
): Promise<void> {
  const exitCode = await new Promise<number>((resolve) => {
    const child = spawn(command.command, [...command.args], {
      cwd,
      stdio: ['ignore', 2, 2],
      shell: process.platform === 'win32',
    });
    child.once('error', () => {
      resolve(-1);
    });
    child.once('close', (code) => {
      resolve(code ?? 1);
    });
  });
  if (exitCode !== 0)
    throw new HubCliError(
      'BUILD_FAILED',
      `The build failed${exitCode === -1 ? ' to start' : ` with exit code ${String(exitCode)}`}; its output is above. Nothing was uploaded.`,
      1,
    );
}

/**
 * The `nocobase.buildTarget` an archive records, read from its `dist/package.json`. `undefined` when the archive
 * records none or cannot be read; the Hub checks the archive itself either way.
 */
export async function readArchiveTarget(
  file: string,
): Promise<BuildTarget | undefined> {
  let manifest: Buffer | undefined;
  try {
    await listArchive({
      file,
      onReadEntry: (entry) => {
        const name = entry.path.replace(/^\.\//, '');
        if (
          manifest === undefined &&
          (name === 'dist/package.json' || name === 'package.json') &&
          entry.size <= 16 * 1024 * 1024
        ) {
          const chunks: Buffer[] = [];
          entry.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });
          entry.on('end', () => {
            manifest = Buffer.concat(chunks);
          });
        }
      },
    });
  } catch {
    return undefined;
  }
  if (manifest === undefined) return undefined;
  try {
    const parsed: unknown = JSON.parse(manifest.toString('utf8'));
    if (!isRecord(parsed) || !isRecord(parsed.nocobase)) return undefined;
    return parseBuildTarget(parsed.nocobase.buildTarget) ?? undefined;
  } catch {
    return undefined;
  }
}

/** The same comparison the Hub makes: platform, architecture, Node major, and the C library on Linux. */
export function sameTarget(archive: BuildTarget, hub: BuildTarget): boolean {
  return (
    archive.platform === hub.platform &&
    archive.arch === hub.arch &&
    archive.nodeMajor === hub.nodeMajor &&
    (archive.platform !== 'linux' ||
      (archive.libc ?? 'glibc') === (hub.libc ?? 'glibc'))
  );
}
