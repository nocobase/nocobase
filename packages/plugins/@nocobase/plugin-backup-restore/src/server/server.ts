import { Plugin } from '@nocobase/server';
import backupFilesResourcer from './resourcers/backup-files';

export default class PluginBackupRestoreServer extends Plugin {
  beforeLoad() {
    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
      actions: ['backupFiles:*'],
    });
  }

  async load() {
    this.app.resourcer.define(backupFilesResourcer);
  }
}
