import { statSync } from 'node:fs';
import path from 'node:path';
import { EXIT_INVALID, InstallerError, type Suggestion } from './errors.ts';
import { quoteForShell } from '@nocobase/cli-envelope';
import { installerCommand } from './invocation.ts';
import { rebuildCommandLine } from './prechecks.ts';
import type { InstallerState } from './state.ts';

/**
 * The archive `--archive` names, as an absolute path to a file that exists. Only a local path is accepted for now:
 * fetching one would need downloads, credentials and checksums of its own.
 */
export function resolveArchivePath(cwd: string, value: string): string {
  if (/^[a-z][a-z0-9+.-]*:\/\//iu.test(value)) {
    throw new InstallerError(
      'INVALID_USAGE',
      `--archive takes a local path; download ${value} to the server first.`,
      { exitCode: EXIT_INVALID },
    );
  }
  const file = path.resolve(cwd, value);
  let isFile = false;
  try {
    isFile = statSync(file).isFile();
  } catch {
    // Reported below.
  }
  if (!isFile) {
    throw new InstallerError(
      'ARCHIVE_NOT_FOUND',
      `${file} is not a file. Pass the deployment archive \`pnpm build --tar\` wrote to storage/exports/dist.tar.gz.`,
      { exitCode: EXIT_INVALID },
    );
  }
  return file;
}

/**
 * How to get a release that runs on this machine's Node: the archive is built again, in the application project, and
 * the installation upgrades to it.
 */
export function nodeRebuildAdvice(
  state: Pick<InstallerState, 'registry'>,
  root: string,
): Suggestion[] {
  return [
    {
      message:
        'Build the archive again for this machine, in the application project:',
      run: rebuildCommandLine(),
    },
    // No `run`: a suggestion's command runs as given, and the archive's path is not known here.
    {
      message: `Then copy it here and upgrade to it: ${installerCommand(`upgrade --dir ${quoteForShell(root)} --archive <the copied archive>`, { registry: state.registry })}`,
    },
  ];
}
