import { BackupError } from '@nocobase/backup';
import type { BackupManifest } from '@nocobase/backup';
import { CommandError } from '../command/errors.ts';

export async function runBackupCommand<T>(
  operation: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  process.on('SIGINT', cancel);
  process.on('SIGTERM', cancel);
  try {
    return await operation(controller.signal);
  } catch (error) {
    if (error instanceof BackupError) {
      throw new CommandError(error.message, {
        code: error.code,
        details: error.details,
        exit: error.code === 'BACKUP_ABORTED' ? 130 : undefined,
      });
    }
    throw error;
  } finally {
    process.off('SIGINT', cancel);
    process.off('SIGTERM', cancel);
  }
}

export function printBackupManifest(
  manifest: BackupManifest,
  log: (message: string) => void,
): void {
  log(`${manifest.app.name} ${manifest.app.version} (${manifest.createdAt})`);
  for (const connection of manifest.connections) {
    log(
      `Database ${connection.name}: ${connection.mode}${connection.mode === 'excluded' ? ` (${connection.reason})` : ` at ${connection.snapshot.time}`}`,
    );
  }
  for (const disk of manifest.disks) {
    log(
      `Disk ${disk.name}: ${disk.mode}${disk.mode === 'files' ? ` (${disk.count} files, ${disk.size} bytes)` : ''}`,
    );
  }
}
