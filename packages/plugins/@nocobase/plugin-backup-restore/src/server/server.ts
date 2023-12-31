import { Plugin } from '@nocobase/server';
import zhCN from './locale/zh-CN';
import backupFilesResourcer from './resourcers/backup-files';

export default class Duplicator extends Plugin {
  beforeLoad() {
    this.app.i18n.addResources('zh-CN', 'duplicator', zhCN);
  }

  async load() {
    this.app.resourcer.define(backupFilesResourcer);

    this.app.acl.allow('duplicator', 'getDict');
  }
}
