import { Plugin } from '@nocobase/server';
import addDumpCommand from './commands/dump';
import addRestoreCommand from './commands/restore';

import zhCN from './locale/zh-CN';

export default class Duplicator extends Plugin {
  beforeLoad() {
    this.app.i18n.addResources('zh-CN', 'duplicator', zhCN);

    addDumpCommand(this.app);
    addRestoreCommand(this.app);
  }
}
