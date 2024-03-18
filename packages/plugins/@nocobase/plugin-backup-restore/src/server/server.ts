import { Plugin } from '@nocobase/server';
import backupFilesResourcer from './resourcers/backup-files';
import addRestoreCommand from './commands/restore-command';

export default class Duplicator extends Plugin {
  beforeLoad() {
    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
      actions: ['backupFiles:*'],
    });

    addRestoreCommand(this.app);
  }

  async load() {
    this.app.resourcer.define(backupFilesResourcer);
  }
}
