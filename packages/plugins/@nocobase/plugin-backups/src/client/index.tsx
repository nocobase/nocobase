import { Plugin } from '@nocobase/client';
import { BackupSettings } from './components/BackupSettings';
import { BackupsManagement } from './components/BackupsManagement';
import { NAMESPACE } from './constants';

export class PluginBackupsClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.app.pluginSettingsManager.add(`${NAMESPACE}`, {
      title: this.t('Backup manager'),
      icon: 'CloudServerOutlined',
    });
    this.app.pluginSettingsManager.add(`${NAMESPACE}.list`, {
      title: this.t('Backup list'),
      icon: 'CloudServerOutlined',
      Component: BackupsManagement,
      aclSnippet: `pm.${NAMESPACE}`,
    });
    this.app.pluginSettingsManager.add(`${NAMESPACE}.settings`, {
      title: this.t('Settings'),
      icon: 'SettingOutlined',
      Component: BackupSettings,
      aclSnippet: `pm.${NAMESPACE}.settings`,
    });
  }
}

export default PluginBackupsClient;
