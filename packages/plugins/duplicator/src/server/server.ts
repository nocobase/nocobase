import { Plugin } from '@nocobase/server';
import addDumpCommand from './commands/dump-command';
import addRestoreCommand from './commands/restore-command';

import zhCN from './locale/zh-CN';
import collectionGroupAction from './actions/collection-groups-action';
import dumpAction from './actions/dump-action';
import restoreAction from './actions/restore-action';
import getDictAction from './actions/get-dict-action';

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
        collectionGroups: collectionGroupAction,
        getDict: getDictAction,
      },
    });

    this.app.acl.allow('duplicator', 'getDict');
  }
}
