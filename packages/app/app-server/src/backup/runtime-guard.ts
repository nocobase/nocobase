import { BackupError } from '@nocobase/backup/errors';
import { tryStorageLock } from '@nocobase/drive';
import type { ReleaseStorageLock } from '@nocobase/drive';
import type { AppPaths } from '../config/index.js';

export function applicationGuardPath(paths: AppPaths): string {
  return paths.storage('.nocobase-backup/application.sqlite');
}

export async function enterRunningApplication(
  paths: AppPaths,
): Promise<ReleaseStorageLock> {
  const release = await tryStorageLock(applicationGuardPath(paths), 'shared');
  if (!release)
    throw new BackupError(
      'RESTORE_IN_PROGRESS',
      'The application is being restored. Retry after the restore finishes.',
    );
  return release;
}
