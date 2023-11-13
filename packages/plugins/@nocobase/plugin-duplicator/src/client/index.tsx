import { Plugin } from '@nocobase/client';
import { BackupAndRestoreList } from './Configuration';
import { DuplicatorProvider } from './DuplicatorProvider';
import { NAMESPACE } from './locale';
export class DuplicatorPlugin extends Plugin {
  async load() {
    this.app.use(DuplicatorProvider);
    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: `{{t("Backup & Restore", { ns: "${NAMESPACE}" })}}`,
      icon: 'CloudServerOutlined',
      Component: BackupAndRestoreList,
      aclSnippet: 'pm.backup.restore',
    });
  }
}

export default DuplicatorPlugin;
