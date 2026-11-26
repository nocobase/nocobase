import { BackupError, assertBackupDatabasesIdle } from '@nocobase/backup';
import type { BackupConnection } from '@nocobase/backup';
import { tryStorageLock } from '@nocobase/drive';
import type { Application } from '../application/index.js';
import type { NodeServerConfig } from '../node/config.js';
import { applicationGuardPath } from './runtime-guard.js';

export async function withStoppedApplication<T>(
  app: Application,
  connections: readonly BackupConnection[],
  operation: () => Promise<T>,
): Promise<T> {
  const release = await tryStorageLock(
    applicationGuardPath(app.paths),
    'exclusive',
  );
  if (!release)
    throw new BackupError(
      'RESTORE_APP_RUNNING',
      'The application, a backup, or database maintenance is active. Stop the application and let active operations finish before restoring.',
    );
  try {
    if (await hasRunningListener(app)) {
      throw new BackupError(
        'RESTORE_APP_RUNNING',
        'The application is still serving requests. Stop it before restoring.',
      );
    }
    await assertBackupDatabasesIdle(connections);
    return await operation();
  } finally {
    release();
  }
}

async function hasRunningListener(app: Application): Promise<boolean> {
  if (app.mode !== 'standalone') return false;
  const server = app.config.get<NodeServerConfig>('server');
  const host = server?.host ?? '127.0.0.1';
  const address =
    host === '::'
      ? '[::1]'
      : host === '0.0.0.0'
        ? '127.0.0.1'
        : host.includes(':') && !host.startsWith('[')
          ? `[${host}]`
          : host;
  const url = new URL(
    `${app.publicBasePath.replace(/\/$/, '')}/api/healthz`,
    `http://${address}:${server?.port ?? 13000}`,
  );
  try {
    const response = await fetch(url, {
      redirect: 'error',
      signal: AbortSignal.timeout(1000),
    });
    if (
      !response.ok ||
      !response.headers.get('content-type')?.includes('application/json')
    ) {
      await response.body?.cancel();
      return false;
    }
    const health: unknown = await response.json();
    if (typeof health !== 'object' || !health || !('app' in health))
      return false;
    const candidate = health.app;
    return (
      typeof candidate === 'object' &&
      candidate !== null &&
      'name' in candidate &&
      'basePath' in candidate &&
      candidate.name === app.appName &&
      candidate.basePath === app.publicBasePath
    );
  } catch {
    // Modern runtimes also hold the storage lock independently of their listener.
    return false;
  }
}
