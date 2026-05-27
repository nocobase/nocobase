import { createMockCluster, MockCluster } from '@nocobase/test';
import { BackupManager } from '../managers/backup';
import { PluginBackupsServer } from '../plugin';
import settingsCollection from '../collections/backup-settings';

describe('PluginBackupsServer > cluster', () => {
  let cluster: MockCluster;

  beforeEach(async () => {
    cluster = await createMockCluster({
      plugins: ['backups', 'file-manager'],
      beforeInstall: async (app) => {
        // Register the collections so that the install's db.sync() can create
        // their tables. Do NOT call db.sync() here: with MySQL, pre-creating
        // tables before install's db.clean({ drop: true }) can leave FK-
        // constrained tables behind (Sequelize's dropAllTables does not
        // disable FK checks), causing isInstalled() to return true and the
        // install to skip load(), which leaves the plugin cache uncreated.
        await app.db.collection({ name: 'storages', fields: [] });
        await app.db.collection(settingsCollection);
      },
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await cluster.destroy();
  });

  it('should run auto backup on only one node when triggered simultaneously', async () => {
    const [app1, app2] = cluster.nodes;

    const backupNames: string[] = [];
    vi.spyOn(BackupManager.prototype, 'createBackupName').mockResolvedValue('test_backup');
    vi.spyOn(BackupManager.prototype, 'backup').mockImplementation(async (name: string) => {
      backupNames.push(name);
      return '/mock/path/test_backup.nbdata';
    });

    const plugin1 = app1.pm.get(PluginBackupsServer) as PluginBackupsServer;
    const plugin2 = app2.pm.get(PluginBackupsServer) as PluginBackupsServer;

    // Trigger both nodes simultaneously — only the first to acquire the
    // distributed lock should proceed; the other should skip.
    await Promise.all([(plugin1 as any).runAutoBackupTask(), (plugin2 as any).runAutoBackupTask()]);

    // Exactly one node ran the backup; the other was skipped via LockAcquireError.
    expect(backupNames.length).toBe(1);
  });

  it('should allow a subsequent auto backup after the previous one completes', async () => {
    const [app1, app2] = cluster.nodes;

    const backupNames: string[] = [];
    vi.spyOn(BackupManager.prototype, 'createBackupName').mockResolvedValue('test_backup');
    vi.spyOn(BackupManager.prototype, 'backup').mockImplementation(async (name: string) => {
      backupNames.push(name);
      return '/mock/path/test_backup.nbdata';
    });

    const plugin1 = app1.pm.get(PluginBackupsServer) as PluginBackupsServer;
    const plugin2 = app2.pm.get(PluginBackupsServer) as PluginBackupsServer;

    // First run on node1 — should execute.
    await (plugin1 as any).runAutoBackupTask();
    expect(backupNames.length).toBe(1);

    // Second run on node2 after node1 has finished — lock is already
    // released, so node2 should be able to proceed.
    await (plugin2 as any).runAutoBackupTask();
    expect(backupNames.length).toBe(2);
  });
});
