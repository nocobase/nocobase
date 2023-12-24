import { Plugin } from '@nocobase/server';
import addDumpCommand from './commands/dump-command';
import addRestoreCommand from './commands/restore-command';
import zhCN from './locale/zh-CN';
import backupFilesResourcer from './resourcers/backup-files';

export default class Duplicator extends Plugin {
  beforeLoad() {
    this.app.i18n.addResources('zh-CN', 'duplicator', zhCN);

    addDumpCommand(this.app);
    addRestoreCommand(this.app);
  }

  async load() {
    this.app.resourcer.define(backupFilesResourcer);

    this.app.acl.allow('duplicator', 'getDict');
  }
}
