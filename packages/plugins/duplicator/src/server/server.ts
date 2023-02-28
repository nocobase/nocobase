import { Plugin } from '@nocobase/server';
import addDumpCommand from './commands/dump-command';
import addRestoreCommand from './commands/restore-command';

import zhCN from './locale/zh-CN';
import dumpAction from './actions/dump-action';
import restoreAction from './actions/restore-action';
import getDictAction from './actions/get-dict-action';
import dumpableCollections from './actions/dumpable-collections-action';

export default class Duplicator extends Plugin {
  beforeLoad() {
    this.app.i18n.addResources('zh-CN', 'duplicator', zhCN);

    addDumpCommand(this.app);
    addRestoreCommand(this.app);
  }

  async load() {
    this.app.resourcer.define({
      name: 'duplicator',
      actions: {
        restore: restoreAction,
        dump: dumpAction,
        dumpableCollections: dumpableCollections,
        getDict: getDictAction,
      },
    });

    this.app.acl.allow('duplicator', 'getDict');
  }
}
