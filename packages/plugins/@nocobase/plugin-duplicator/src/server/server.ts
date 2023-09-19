import { Plugin } from '@nocobase/server';
import addDumpCommand from './commands/dump-command';
import addRestoreCommand from './commands/restore-command';

import { koaMulter as multer } from '@nocobase/utils';
import * as os from 'os';
import dumpAction from './actions/dump-action';
import dumpableCollections from './actions/dumpable-collections-action';
import getDictAction from './actions/get-dict-action';
import { getPackageContent, restoreAction } from './actions/restore-action';
import zhCN from './locale/zh-CN';

export default class Duplicator extends Plugin {
  beforeLoad() {
    this.app.i18n.addResources('zh-CN', 'duplicator', zhCN);

    addDumpCommand(this.app);
    addRestoreCommand(this.app);
  }

  async load() {
    this.app.resourcer.define({
      name: 'duplicator',
      middleware: async (ctx, next) => {
        if (ctx.action.actionName !== 'upload') {
          return next();
        }
        const storage = multer.diskStorage({
          destination: os.tmpdir(), // 获取临时目录
          filename: function (req, file, cb) {
            const randomName = Date.now().toString() + Math.random().toString().slice(2); // 随机生成文件名
            cb(null, randomName);
          },
        });

        const upload = multer({ storage }).single('file');
        return upload(ctx, next);
      },
      actions: {
        restore: restoreAction,
        upload: getPackageContent,
        dump: dumpAction,
        dumpableCollections: dumpableCollections,
        getDict: getDictAction,
      },
    });

    this.app.acl.allow('duplicator', 'getDict');
  }
}
