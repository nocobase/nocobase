import { spawnSync } from 'node:child_process';
import { ProjectError } from './project.ts';

export type WorkspaceSynchronizer = (
  repoRoot: string,
  targetDirectory: string,
) => void;

export const synchronizeWorkspace: WorkspaceSynchronizer = (
  repoRoot,
  targetDirectory,
) => {
  const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const result = spawnSync(pnpm, ['install', '--no-frozen-lockfile'], {
    cwd: repoRoot,
    env: { ...process.env, CI: 'true' },
    // Keep package-manager output off stdout, including when the caller uses --json.
    stdio: ['inherit', 2, 2],
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new ProjectError(
      'INSTALL_FAILED',
      `pnpm install failed. Generated files and project changes were kept at ${targetDirectory}. Run pnpm install from ${repoRoot}, then register the plugin.`,
    );
  }
};
